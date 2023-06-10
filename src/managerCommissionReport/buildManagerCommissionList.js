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
t.firstName,
t.lastName,
c.firstName as clientFirstName,
c.lastName as clientLastName,
s.appointmentType,
s.clientId,
s.cost as clientCost,
s.appointmentId,
InArrears,
a.startTime
from session s 
inner join appointment a on s.appointmentId = a.entityid
inner join [user] t on a.trainerId = t.entityId
inner join client c on c.entityId = s.clientId
where s.SessionUsed = 1
and a.locationId in (${locationIds.join(",")})
and a.date >= format(DATEADD(MONTH, -1, getDate()), 'yyyy-MM-01') 
and a.date <= EOMONTH(DATEADD(MONTH, -1, getDate()))
`;

const pairs = {};
const getHour = (item) => {
	switch (item.appointmentType) {
		case "Pair": {
			if (pairs[item.appointmentId]) {
				return 0;
			}
			pairs[item.appointmentId] = 1;
			return 1;
		}
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
			const appointmentHours = getHour(item);
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
	const items = await mssql.query(generateSqlStatement([2,3]));
	console.log(
		`Manager Commission sql V2 returned ${items.recordset.length} records`
	);
	return {
		data: aggregateData(
			items.recordset.filter((x) => !x.inarrears),
			// I can't remember how to make the event send a gd payload.  So I'm just gonna hardcode this for now
			"Clark, Adam"
		),
		inarrearsData: aggregateInarrears(
			items.recordset.filter((x) => x.inarrears)
		),
	};
};

module.exports = buildManagerCommissionReport;
