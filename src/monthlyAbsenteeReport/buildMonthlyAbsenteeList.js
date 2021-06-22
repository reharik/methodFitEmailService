/*
 * File: /buildMonthlyAbsenteeList
 * Project: src
 * Created Date: 2020-08-02
 * Author: Raif
 *
 */
const sql = require("mssql");

const sqlStatement = `SELECT u.LastName + ', ' + u.FirstName AS Trainer,
a.date as Date,
c.LastName + ', ' + c.FirstName AS Client,
l.name AS Location,
(select SUM(case when s1.appointmentType = 'Hour' then 1 else 0 end)
    FROM session s1 
    GROUP BY s1.clientID,
            s1.SessionUsed
    HAVING s1.SessionUsed=0 AND s1.clientId = c.entityId ) as Hour,
(select SUM(case when s1.appointmentType = 'Half Hour' then 1 else 0 end)
    FROM session s1 
    GROUP BY s1.clientID,
            s1.SessionUsed
    HAVING s1.SessionUsed=0 AND s1.clientId = c.entityId ) HalfHour,
(select SUM(case when s1.appointmentType = 'Pair' then 1 else 0 end) 
    FROM session s1 
    GROUP BY s1.clientID,
            s1.SessionUsed 
    HAVING s1.SessionUsed=0 AND s1.clientId = c.entityId ) Pair,
(select SUM(case when s1.appointmentType = 'Hour' AND InArrears = 1 then 1 else 0 end)
    FROM session s1 
    GROUP BY s1.clientID,
            s1.SessionUsed
    HAVING s1.SessionUsed=1 AND  s1.clientId = c.entityId )  NegHour,
(select SUM(case when s1.appointmentType = 'Half Hour' AND InArrears = 1 then 1 else 0 end)
    FROM session s1 
    GROUP BY s1.clientID,
            s1.SessionUsed
    HAVING s1.SessionUsed=1 AND  s1.clientId = c.entityId ) NegHalfHour,
(select SUM(case when s1.appointmentType = 'Pair' AND InArrears = 1 then 1 else 0 end)
    FROM session s1 
    GROUP BY s1.clientID,
            s1.SessionUsed
    HAVING s1.SessionUsed=1 AND  s1.clientId = c.entityId ) NegPair
FROM    client c
INNER JOIN appointment_client ac
	ON c.entityid = ac.clientid
INNER JOIN appointment a 
	ON ac.appointmentid = a.entityid
LEFT JOIN [user] u on a.trainerid = u.entityId
INNER JOIN location l on a.LocationId = l.entityId
WHERE
 a.date = (
   SELECT MAX(a1.date) LastDate
        FROM client c1
        INNER JOIN appointment_client ac1
            ON c1.entityid = ac1.clientid
        INNER JOIN appointment a1 
            ON ac1.appointmentid = a1.entityid
        group by c1.entityId,a1.Completed
        having max(a1.date) < DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()), -30)  
        and c1.entityId = c.entityId
        and a1.Completed = 1
)
and NOT c.Archived = 1
order by c.LastName, c.FirstName`;

const buildMonthlyAbsenteeList = async () => {
	const mssql = await sql.connect(process.env.DB_CONNECTION);
	const clientSessions = await mssql.query(sqlStatement);
	return clientSessions.recordset;
};

module.exports = buildMonthlyAbsenteeList;
