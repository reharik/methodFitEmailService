/*
 * File: /buildWeeklyAbsenteeList
 * Project: src
 * Created Date: 2020-08-02
 * Author: Raif
 *
 */

const sql = require("mssql");
const {DateTime} = require('luxon');
const now =  DateTime.now().minus({"hours":5})
const cutOffDate = now.minus({"days":6}).toISO();
const cutOffISO = cutOffDate.substring(0,cutOffDate.indexOf("T"));
const nowISO = now.toISO().substring(0,now.toISO().indexOf("+"));


const sqlStatement = `SELECT  c.EntityId, 
u.email as trainerEmail,
u.FirstName as TrainerFirstName,
u.LastName as TrainerLastName,
c.FirstName,
c.LastName,
c.Email,
c.MobilePhone,
MAX(a.date) LastDate
FROM    client c
INNER JOIN appointment_client ac
	ON c.entityid = ac.clientid
INNER JOIN appointment a 
	ON ac.appointmentid = a.entityid
left join [user] u on a.trainerid = u.entityId
join User_Client uc on c.entityId = uc.ClientId AND a.TrainerId = uc.UserId
GROUP   BY c.entityid ,c.entityId, 
c.firstName,
c.lastName,
c.email,
c.mobilephone,
u.email,
a.Completed,
u.FirstName,
u.LastName
having max(a.date) < '${cutOffISO}'
--and max(a.date) > DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()), -90)
and a.Completed = 1
and NOT c.Archived = 1
order by u.lastname, u.FirstName`;

const buildWeeklyAbsenteeList = async () => {
	const mssql = await sql.connect(process.env.DB_CONNECTION);
	const clientSessions = await mssql.query(sqlStatement);
	return clientSessions.recordset;
};

module.exports = buildWeeklyAbsenteeList;
