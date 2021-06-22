/*
 * File: /src/managerCommissionReport/sessions.js
 * Project: lambdaemails
 * Created Date: 2020-11-14
 * Author: Raif
 *
 */

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
		<td>Commission Base</td>
		<td colspan="2">${formatCurrency(totals.eligableRevenue)}</td>
		<td></td>
	</tr>
	<tr style="font-weight:bold;">
		<td colspan="">Commission %</td>
		<td colspan="2">${totals.managerPercentage * 100}%</td>
		<td></td>
	</tr>
	<tr style="font-weight:bold;">
		<td>Manager Commission</td>
		<td colspan="2">${formatCurrency(totals.managerCommission)}</td>
		<td></td>
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

const sessions = (data) => {
	let html = root;
	data.rows.forEach((x) => (html += buildRow(x)));
	html += buildFooter(data.totals);
	html += `</table>`;

	return html;
};

module.exports = sessions;
