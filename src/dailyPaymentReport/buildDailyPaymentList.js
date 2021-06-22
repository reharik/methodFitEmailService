/*
 * File: /src/buildDailyPaymentList.js
 * Project: lambdaemails
 * Created Date: 2020-08-14
 * Author: Raif
 *
 */

const sql = require("mssql");

const sqlStatement = `SELECT p.CreatedDate,
t.FirstName + ' ' + t.LastName AS Trainer,
c.FirstName + ' ' + c.LastName AS Client,
p.FullHour,
p.FullHourPrice,
p.FullHourTenPack,
p.FullHourTenPackPrice,
p.HalfHour,
p.HalfHourPrice,
p.HalfHourTenPack,
p.HalfHourTenPackPrice,
p.Pair,
p.PairPrice,
p.PairTenPack,
p.PairTenPackPrice,
p.PaymentTotal,
p.EntityId
FROM Payment as p INNER JOIN [User] AS t ON p.CreatedById = t.EntityId 
		INNER JOIN Client as c ON p.ClientId = c.EntityId
WHERE p.createdDate between 
	DATETIMEFROMPARTS(year(getDate()),month(getDate()),day(dateadd(DD,-1,getdate())),00, 01, 0,0)
	and DATETIMEFROMPARTS(year(getDate()),month(getDate()),day(dateadd(DD,-1,getdate())),23, 59, 0,0)
ORDER BY c.LastName`;

const buildDailyPaymentList = async () => {
	const mssql = await sql.connect(process.env.DB_CONNECTION);

	const payments = await mssql.query(sqlStatement);
	console.log(
		`Daily payment sql returned ${payments.recordset.length} records`
	);
	return payments.recordset;
};

module.exports = buildDailyPaymentList;
