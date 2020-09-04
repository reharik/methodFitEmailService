/*
 * File: /buildWeeklyAbsenteeList
 * Project: src
 * Created Date: 2020-08-02
 * Author: Raif
 *
 * Copyright (c) 2020 TaskRabbit, Inc
 */
const sql = require("mssql");

const sqlStatement = `SELECT  c.EntityId, 
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

a.Completed,
u.FirstName,
u.LastName
having max(a.date) < DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()), -10) 
--and max(a.date) > DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()), -90)
and a.Completed = 1
order by u.lastname, u.FirstName`;

const buildWeeklyAbsenteeList = async () => {
	const mssql = await sql.connect(process.env.DB_CONNECTION);
	const clientSessions = await mssql.query(sqlStatement);
	return clientSessions.recordset;
};

module.exports = buildWeeklyAbsenteeList;
