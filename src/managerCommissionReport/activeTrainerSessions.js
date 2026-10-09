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
		<td style="border-bottom:1px solid black">Total Hours</td>
		<td style="border-bottom:1px solid black">Active Clients</td>
		<td style="border-bottom:1px solid black">Ave Hours/Client</td>
	</tr>
`;

const buildRow = (row) => `
	<tr>
		<td style="border-bottom:1px solid black">
			${row.trainer}</td>
		<td style="border-bottom:1px solid black">
			${row.totalHours}</td>
		<td style="border-bottom:1px solid black">
			${row.clientTotal}</td>
		<td style="border-bottom:1px solid black">
			${row.average}</td>
	</tr>
`;

const sessions = (data) => {
  let html = root;
  data.rows.forEach((x) => (html += buildRow(x)));
  html += `</table>`;

  return html;
};

module.exports = sessions;
