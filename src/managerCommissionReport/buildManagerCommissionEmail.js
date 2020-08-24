/*
 * File: /src/buildManagerCommissionReport.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 * Copyright (c) 2020 TaskRabbit, Inc
 */

const moment = require("moment");

const root = `
<table style="border:1px solid black; padding:3px; width: 100%;">
	<tr style="font-weight:bold;" >
		<td style="border-bottom:1px solid black">Trainer</td>
		<td style="border-bottom:1px solid black">Revenue</td>
		<td style="border-bottom:1px solid black">Total Hours</td>
		<td style="border-bottom:1px solid black">Active Clients</td>
	</tr>
`;

const buildFooter = (totals) => `
	<tr style="font-weight:bold;" >
		<td>Total</td>
		<td>${formatCurrency(totals.allRevenue)}</td>
		<td>${totals.allHours}</td>
		<td>${totals.allClients}</td>
	</tr>
	<tr style="font-weight:bold;">
		<td colspan="2">Commission Base</td>
		<td></td>
		<td>${formatCurrency(totals.eligableRevenue)}</td>
	</tr>
	<tr style="font-weight:bold;">
		<td colspan="2">Commission %</td>
		<td></td>
		<td>${totals.managerPercentage * 100}%</td>
	</tr>
	<tr style="font-weight:bold;">
		<td colspan="2">Manager Commission</td>
		<td></td>
		<td>${formatCurrency(totals.managerCommission)}</td>
	</tr>
`;

const buildRow = (row) => `
	<tr>
		<td style="border-bottom:1px solid black">
			${row.trainer}</td>
		<td style="border-bottom:1px solid black">
			${formatCurrency(row.totalRevenue)}</td>
		<td style="border-bottom:1px solid black">
			${row.totalHours}</td>
		<td style="border-bottom:1px solid black">
			${row.clientTotal}</td>
	</tr>
`;

const formatCurrency = (value) => {
	return new Intl.NumberFormat("en-Us", {
		style: "currency",
		currency: "USD",
	}).format(value);
};

const buildManagerCommissionReport = async (data) => {
	let html = root;
	data.rows.forEach((x) => (html += buildRow(x)));
	html += buildFooter(data.totals);
	html += `</table>`;

	const email = `<b>Manager Commission report for ${moment()
		.subtract(1, "month")
		.format("MMMM YYYY")}</b><br /><br />${html}`;

	console.log("Manager Commission Email successfully built");
	return email;
};

module.exports = buildManagerCommissionReport;
