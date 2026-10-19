-- [SETUP] ---------------------------------------------------------------
DROP TABLE IF EXISTS #wk, #raw, #series, #cad, #stats, #client, #closed;

DECLARE @End       date = CAST(GETDATE() AS date);
DECLARE @Weeks     int  = 26;    -- history window
DECLARE @Score     int  = 8;     -- cadence scored over the last N weeks
DECLARE @Start     date = DATEADD(week, -@Weeks, @End);
DECLARE @StopAge   int  = 8;     -- stops older than this roll into a count
-- [/SETUP]

-- [WEEKS] ---------------------------------------------------------------
-- Week index: 1 = the week ending today, 26 = oldest
;WITH n AS (SELECT TOP (@Weeks) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS WeekNo FROM sys.objects)
SELECT WeekNo,
       WeekEnd   = DATEADD(day, -7 * (WeekNo - 1), @End),
       WeekStart = DATEADD(day, -7 * WeekNo + 1, @End)
INTO #wk FROM n;
-- [/WEEKS]

-- [SERIES] --------------------------------------------------------------
-- One pass over Appointment, bucketed by week; then one row per client-trainer-week with zeros
SELECT ac.ClientId, a.TrainerId, w.WeekNo, Sessions = COUNT(*)
INTO #raw
FROM Appointment a
JOIN Appointment_Client ac ON ac.AppointmentId = a.EntityId
JOIN #wk w ON CAST(a.Date AS date) BETWEEN w.WeekStart AND w.WeekEnd
WHERE a.Completed = 1 AND a.TrainerId IS NOT NULL
GROUP BY ac.ClientId, a.TrainerId, w.WeekNo;

SELECT p.ClientId, p.TrainerId, w.WeekNo, w.WeekStart,
       Sessions       = ISNULL(r.Sessions, 0),
       StudioSessions = ISNULL((SELECT SUM(Sessions) FROM #raw r2 WHERE r2.ClientId = p.ClientId AND r2.WeekNo = w.WeekNo), 0)
INTO #series
FROM (SELECT ClientId, TrainerId FROM #raw GROUP BY ClientId, TrainerId HAVING SUM(Sessions) >= 6) p
CROSS JOIN #wk w
LEFT JOIN #raw r ON r.ClientId = p.ClientId AND r.TrainerId = p.TrainerId AND r.WeekNo = w.WeekNo;
-- [/SERIES]

-- [CLOSED] --------------------------------------------------------------
-- Closed = at least 75% of active trainers below half their own median week (holidays, snow); one trainer away doesn't count
;WITH tw AS (
  SELECT TrainerId, WeekNo, Total = SUM(Sessions) FROM #raw GROUP BY TrainerId, WeekNo
), tmed AS (
  SELECT TrainerId, Total, rn = ROW_NUMBER() OVER (PARTITION BY TrainerId ORDER BY Total), cnt = COUNT(*) OVER (PARTITION BY TrainerId) FROM tw
), med AS (
  SELECT TrainerId, Med = AVG(1.0 * Total) FROM tmed WHERE rn IN ((cnt+1)/2, (cnt+2)/2) GROUP BY TrainerId HAVING AVG(1.0 * Total) >= 5
), flags AS (
  SELECT w.WeekNo,
         Down = SUM(CASE WHEN ISNULL(tw.Total, 0) < 0.5 * m.Med THEN 1 ELSE 0 END),
         Trainers = COUNT(*)
  FROM #wk w CROSS JOIN med m
  LEFT JOIN tw ON tw.TrainerId = m.TrainerId AND tw.WeekNo = w.WeekNo
  GROUP BY w.WeekNo
)
SELECT WeekNo, Down, Trainers, Closed = CASE WHEN Down >= 0.75 * Trainers THEN 1 ELSE 0 END
INTO #closed FROM flags;
-- [/CLOSED]

-- [CADENCE] -------------------------------------------------------------
-- Cadence = baseline sessions/week rounded to the nearest 0.5, for display
SELECT s.ClientId, s.TrainerId,
       Cadence = CAST(ROUND(AVG(1.0 * s.Sessions) * 2, 0) / 2 AS decimal(4,2))
INTO #cad
FROM #series s JOIN #closed cw ON cw.WeekNo = s.WeekNo
WHERE s.WeekNo > @Score AND cw.Closed = 0
GROUP BY s.ClientId, s.TrainerId
HAVING AVG(1.0 * s.Sessions) >= 0.3;
-- [/CADENCE]

-- [STATS] ---------------------------------------------------------------
-- Per client-trainer, closed weeks excluded from every rate
SELECT s.ClientId, s.TrainerId,
  Cadence     = cd.Cadence,
  BaselineWk  = 1.0 * SUM(CASE WHEN s.WeekNo > @Score AND cw.Closed = 0 THEN s.Sessions ELSE 0 END)
                / NULLIF(SUM(CASE WHEN s.WeekNo > @Score AND cw.Closed = 0 THEN 1 ELSE 0 END), 0),
  RecentWk    = 1.0 * SUM(CASE WHEN s.WeekNo <= @Score AND cw.Closed = 0 THEN s.Sessions ELSE 0 END)
                / NULLIF(SUM(CASE WHEN s.WeekNo <= @Score AND cw.Closed = 0 THEN 1 ELSE 0 END), 0),
  Last3Wk     = 1.0 * SUM(CASE WHEN s.WeekNo <= 3 AND cw.Closed = 0 THEN s.Sessions ELSE 0 END)
                / NULLIF(SUM(CASE WHEN s.WeekNo <= 3 AND cw.Closed = 0 THEN 1 ELSE 0 END), 0),
  OpenRecentWeeks = SUM(CASE WHEN s.WeekNo <= @Score AND cw.Closed = 0 THEN 1 ELSE 0 END),
  FirstWeekNo = MAX(CASE WHEN s.Sessions > 0 THEN s.WeekNo END),
  LastWeekNo  = MIN(CASE WHEN s.Sessions > 0 THEN s.WeekNo END),
  OtherRecent = SUM(CASE WHEN s.WeekNo <= @Score THEN s.StudioSessions - s.Sessions ELSE 0 END),
  OtherPrior  = SUM(CASE WHEN s.WeekNo >  @Score THEN s.StudioSessions - s.Sessions ELSE 0 END)
INTO #stats
FROM #series s
JOIN #closed cw ON cw.WeekNo = s.WeekNo
LEFT JOIN #cad cd ON cd.ClientId = s.ClientId AND cd.TrainerId = s.TrainerId
GROUP BY s.ClientId, s.TrainerId, cd.Cadence;
-- [/STATS]

-- [STATUS] --------------------------------------------------------------
SELECT
  st.*,
  Expected       = ROUND(st.BaselineWk * st.OpenRecentWeeks, 1),
  Delivered      = st.RecentWk * st.OpenRecentWeeks,
  CadenceRate    = ROUND(100.0 * st.RecentWk / NULLIF(st.BaselineWk, 0), 0),
  MissedSessions = ROUND(CASE WHEN (st.BaselineWk - st.RecentWk) * st.OpenRecentWeeks > 0
                              THEN (st.BaselineWk - st.RecentWk) * st.OpenRecentWeeks ELSE 0 END, 1),
  DaysSinceLast  = CASE WHEN st.LastWeekNo IS NULL THEN NULL ELSE (st.LastWeekNo - 1) * 7 END,
  TypicalGap     = ROUND(7.0 / NULLIF(st.BaselineWk, 0), 0),
  Status = CASE
    WHEN st.Cadence IS NULL OR st.FirstWeekNo < @Weeks - 4 THEN 'New'
    WHEN st.LastWeekNo > @StopAge THEN 'Gone'
    WHEN st.RecentWk = 0 AND st.OtherRecent > 0 THEN 'Moved'
    WHEN st.RecentWk = 0 THEN 'Stopped'
    WHEN st.RecentWk < 0.5 * st.BaselineWk AND st.OtherRecent >= st.OtherPrior + 3 THEN 'Moved'
    WHEN st.RecentWk < 0.5 * st.BaselineWk THEN 'Drifting'
    WHEN st.Last3Wk < 0.5 * st.BaselineWk AND (st.LastWeekNo - 1) * 7 > 1.5 * 7.0 / NULLIF(st.BaselineWk,0) THEN 'Early'
    WHEN st.RecentWk < 0.75 * st.BaselineWk AND st.OtherRecent >= st.OtherPrior + 3 THEN 'Moved'
    WHEN st.RecentWk < 0.75 * st.BaselineWk THEN 'Off cadence'
    ELSE 'On cadence'
  END
INTO #client
FROM #stats st
WHERE st.BaselineWk >= 0.3 OR st.RecentWk >= 0.3;
-- [/STATUS]

-- [OUT-TRAINERS] --------------------------------------------------------
-- Result 1: trainer cadence rollup
SELECT
  trainerId           = c.TrainerId,
  clients             = COUNT(*),
  onPace              = SUM(CASE WHEN c.Status = 'On cadence'  THEN 1 ELSE 0 END),
  slowed              = SUM(CASE WHEN c.Status = 'Off cadence' THEN 1 ELSE 0 END),
  early               = SUM(CASE WHEN c.Status = 'Early'       THEN 1 ELSE 0 END),
  drifting            = SUM(CASE WHEN c.Status = 'Drifting'    THEN 1 ELSE 0 END),
  stopped             = SUM(CASE WHEN c.Status = 'Stopped'     THEN 1 ELSE 0 END),
  movedToOtherTrainer = SUM(CASE WHEN c.Status = 'Moved'       THEN 1 ELSE 0 END),
  goneOlder           = SUM(CASE WHEN c.Status = 'Gone'        THEN 1 ELSE 0 END),
  paceDeliveredPct    = ROUND(AVG(CASE WHEN c.Status NOT IN ('New','Gone','Moved')
                                       THEN CASE WHEN c.CadenceRate > 100 THEN 100 ELSE c.CadenceRate END END), 0),
  missedSessions      = ROUND(SUM(CASE WHEN c.Status NOT IN ('New','Gone','Moved') THEN c.MissedSessions ELSE 0 END), 0)
FROM #client c
JOIN [User] u ON u.EntityId = c.TrainerId
WHERE ISNULL(u.Archived,0) = 0
GROUP BY c.TrainerId
ORDER BY missedSessions DESC;
-- [/OUT-TRAINERS]

-- [OUT-CLIENTS] ---------------------------------------------------------
-- Result 2: flagged clients, worst first
SELECT
  trainerId                 = c.TrainerId,
  clientId                  = c.ClientId,
  status                    = c.Status,
  cadence                   = c.Cadence,
  usualPerWeek              = ROUND(c.BaselineWk, 2),
  recentPerWeek             = ROUND(c.RecentWk, 2),
  last3Weeks                = ROUND(c.Last3Wk, 2),
  paceDeliveredPct          = c.CadenceRate,
  missedSessions            = c.MissedSessions,
  daysSinceLast             = c.DaysSinceLast,
  typicalGapDays            = c.TypicalGap,
  sessionsWithOtherTrainers = c.OtherRecent,
  unusedCredits             = (SELECT COUNT(*) FROM Session x
                               WHERE x.ClientId = c.ClientId AND x.SessionUsed = 0
                                 AND ISNULL(x.InArrears,0) = 0 AND x.CreatedDate >= DATEADD(year,-1,@End))
FROM #client c
JOIN [User] u ON u.EntityId = c.TrainerId
WHERE ISNULL(u.Archived,0) = 0
  AND c.Status NOT IN ('New','Gone','On cadence')
ORDER BY c.TrainerId,
  CASE c.Status WHEN 'Stopped' THEN 1 WHEN 'Drifting' THEN 2 WHEN 'Early' THEN 3 WHEN 'Off cadence' THEN 4 ELSE 5 END,
  c.MissedSessions DESC;
-- [/OUT-CLIENTS]
-- [OUT-SERIES] ----------------------------------------------------------
-- Result 3: weekly series for flagged clients (sparkline data)
SELECT s.TrainerId, s.ClientId, c.Cadence, s.WeekNo, s.WeekStart, s.Sessions
FROM #series s JOIN #client c ON c.ClientId = s.ClientId AND c.TrainerId = s.TrainerId
WHERE c.Status IN ('Stopped','Drifting','Early','Off cadence')
ORDER BY s.TrainerId, s.ClientId, s.WeekNo DESC;
-- [/OUT-SERIES]

-- [OUT-TRAINER-WEEKLY] --------------------------------------------------
-- Result 4: per trainer per week, actual vs expected (expected = sum of each client's baseline)
SELECT s.TrainerId, s.WeekNo, s.WeekStart,
  Actual   = SUM(s.Sessions),
  Expected = ROUND(SUM(CASE WHEN st.Status NOT IN ('New','Gone') THEN st.BaselineWk ELSE 0 END), 1),
  Closed   = MAX(cw.Closed)
FROM #series s
JOIN #client st ON st.ClientId = s.ClientId AND st.TrainerId = s.TrainerId
JOIN #closed cw ON cw.WeekNo = s.WeekNo
JOIN [User] u ON u.EntityId = s.TrainerId AND ISNULL(u.Archived,0) = 0
GROUP BY s.TrainerId, s.WeekNo, s.WeekStart
ORDER BY s.TrainerId, s.WeekNo DESC;
-- [/OUT-TRAINER-WEEKLY]

-- [OUT-PII] -------------------------------------------------------------
-- Results 5 & 6: names, merged in AFTER the LLM call
SELECT trainerId = EntityId, firstName = FirstName, lastName = LastName FROM [User] WHERE ISNULL(Archived,0) = 0;
SELECT clientId  = EntityId, firstName = FirstName, lastName = LastName FROM Client;
-- [/OUT-PII]