/*
 * File: /src/buildManagerCommissionReport.js
 * Project: lambdaemails
 * Created Date: 2020-08-14
 * Author: Raif
 *
 */
const sql = require("mssql");
const moment = require("moment");

const generateSqlStatement = (locationIds) => `select
  x.trainer,
  x.trainerEmail,
  x.clientTotal,
  x.totalHours,
  x.totalRevenue,
  round(x.totalHours / nullif(x.clientTotal, 0), 2) as average
from (
  select
    t.entityId as trainerId,
    concat(t.lastName, ', ', t.firstName) as trainer,
    t.email as trainerEmail,
    count(distinct s.clientId) as clientTotal,
    -- Hour = 1, Half Hour = .5, Pair = 1 per appointment (not per client)
    sum(case s.appointmentType when 'Hour' then 1.0 when 'Half Hour' then 0.5 else 0 end)
      + count(distinct case when s.appointmentType = 'Pair' then s.appointmentId end) as totalHours,
    sum(s.cost) as totalRevenue
  from session s
  inner join appointment a on s.appointmentId = a.entityid
  inner join [user] t on a.trainerId = t.entityId
  where s.SessionUsed = 1
    and a.locationId in (${locationIds.join(",")})
    and a.date >= format(DATEADD(MONTH, -1, getDate()), 'yyyy-MM-01')
    and a.date <= EOMONTH(DATEADD(MONTH, -1, getDate()))
  group by t.entityId, t.lastName, t.firstName, t.email
) x
order by x.trainerId
`;

const generateInarrearsSqlStatement = (locationIds) => `select
  t.firstName,
  t.lastName,
  c.firstName as clientFirstName,
  c.lastName as clientLastName,
  s.appointmentType,
  a.startTime
from session s
inner join appointment a on s.appointmentId = a.entityid
inner join [user] t on a.trainerId = t.entityId
inner join client c on c.entityId = s.clientId
where s.SessionUsed = 1
  and InArrears = 1
  and a.locationId in (${locationIds.join(",")})
  and a.date >= format(DATEADD(MONTH, -1, getDate()), 'yyyy-MM-01')
  and a.date <= EOMONTH(DATEADD(MONTH, -1, getDate()))
`;

const calculateManagerPercentage = (totalRevenue) => {
  if (totalRevenue >= 41666) {
    return 0.05;
  }
  if (totalRevenue >= 37500) {
    return 0.04;
  }
  if (totalRevenue >= 33333) {
    return 0.03;
  }
  if (totalRevenue >= 29166) {
    return 0.02;
  }
  if (totalRevenue >= 25000) {
    return 0.01;
  }
  return 0;
};

const aggregateData = (rows, manager) => {
  const totals = rows.reduce(
    (acc, row) => {
      acc.allClients += row.clientTotal;
      acc.allHours += row.totalHours;
      acc.allRevenue += row.totalRevenue;
      return acc;
    },
    { allClients: 0, allHours: 0, allRevenue: 0 },
  );

  totals.average = totals.allClients
    ? Math.round((totals.allHours / totals.allClients) * 100) / 100
    : 0;

  const managerRow = rows.find((x) => x.trainer === manager);
  totals.eligableRevenue =
    totals.allRevenue - (managerRow ? managerRow.totalRevenue : 0);
  totals.managerPercentage = calculateManagerPercentage(totals.allRevenue);
  totals.managerCommission = totals.managerPercentage * totals.eligableRevenue;
  return { totals, rows };
};

const aggregateInarrears = (data) => {
  return (data || []).reduce((acc, item) => {
    const trainer = `${item.lastName}, ${item.firstName}`;
    const client = `${item.clientLastName}, ${item.clientFirstName}`;
    acc[trainer] = acc[trainer] || [];
    acc[trainer].push({
      client,
      trainer,
      date: moment(item.startTime).format("MMM Do YYYY hh:mm A"),
      type: item.appointmentType,
    });
    return acc;
  }, {});
};

const buildManagerCommissionReport = async (event) => {
  const mssql = await sql.connect(process.env.DB_CONNECTION);
  // I can't remember how to make the event send a gd payload.  So I'm just gonna hardcode this for now
  const items = await mssql.query(
    generateSqlStatement(event.locationIds || [2, 3]),
  );
  const inarrearsItems = await mssql.query(
    generateInarrearsSqlStatement(event.locationIds || [2, 3]),
  );
  console.log(
    `Manager Commission sql returned ${items.recordset.length} records`,
  );
  return {
    data: aggregateData(
      items.recordset,
      // I can't remember how to make the event send a gd payload.  So I'm just gonna hardcode this for now
      event.manager || "Clark, Adam",
    ),
    inarrearsData: aggregateInarrears(inarrearsItems.recordset),
  };
};

module.exports = buildManagerCommissionReport;
