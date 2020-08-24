/*
 * File: /src/buildManagerCommissionReport.js
 * Project: lambdaemails
 * Created Date: 2020-08-14
 * Author: Raif
 *
 * Copyright (c) 2020 TaskRabbit, Inc
 */

const sql = require("mssql");

const generateSqlStatement = (locationIds) => `select t.firstName,
t.lastName,
s.appointmentType,
s.clientId,
s.cost as clientCost
from session s 
inner join appointment a on s.appointmentId = a.entityid
inner join [user] t on a.trainerId = t.entityId
where s.trainerPaid = 1
and a.locationId in (${locationIds.join(",")})
and a.date >= DATETIMEFROMPARTS(year(getDate()),month(dateadd(MM,-1,getDate())),1,00, 00, 0,0)
and a.date <= DATETIMEFROMPARTS(year(getDate()),month(dateadd(MM,-1,getDate())),day(EOMONTH(dateadd(MM,-1,getDate()))),00, 01, 0,0)
`;

const getHour = (type) => {
	switch (type) {
		case "Pair":
		case "Hour": {
			return 1;
		}
		case "Half Hour": {
			return 0.5;
		}
	}
};

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

const aggregateData = (data, manager) => {
	const uniqueClients = {};
	const totalClients = (trainer, client) => {
		uniqueClients[trainer] = uniqueClients[trainer] || {};
		uniqueClients[trainer][client] = uniqueClients[trainer][client] || 1;
		return Object.keys(uniqueClients[trainer]).length;
	};
	const reduction = (data || []).reduce(
		(acc, item) => {
			const appointmentHours = getHour(item.appointmentType);
			const trainer = `${item.lastName}, ${item.firstName}`;
			acc[trainer] = acc[trainer] || {};
			acc[trainer].trainer = trainer;
			acc[trainer].clientTotal = totalClients(trainer, item.clientId);
			acc[trainer].totalHours =
				(acc[trainer].totalHours || 0) + appointmentHours;
			acc[trainer].totalRevenue =
				(acc[trainer].totalRevenue || 0) + item.clientCost;
			acc.totals.allHours += appointmentHours;
			acc.totals.allRevenue += item.clientCost;
			return acc;
		},
		{ totals: { allClients: 0, allHours: 0, allRevenue: 0 } }
	);

	const result = Object.keys(reduction).reduce(
		(acc, key) => {
			if (key !== "totals") {
				acc.rows.push(reduction[key]);
				acc.totals.allClients += reduction[key].clientTotal;
			}
			return acc;
		},
		{ totals: reduction.totals, rows: [] }
	);

	result.totals.eligableRevenue =
		reduction.totals.allRevenue - reduction[manager].totalRevenue;
	result.totals.managerPercentage = calculateManagerPercentage(
		reduction.totals.allRevenue
	);
	result.totals.managerCommission =
		result.totals.managerPercentage * result.totals.eligableRevenue;
	return result;
};

const buildManagerCommissionReport = async (event) => {
	mssql = await sql.connect(process.env.DB_CONNECTION);
	const items = await mssql.query(generateSqlStatement(event.locationIds));
	console.log(
		`Manager Commission sql returned ${items.recordset.length} records`
	);
	return aggregateData(items.recordset, event.manager);
};

module.exports = buildManagerCommissionReport;
