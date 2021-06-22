/*
 * File: /src/buildMonthlyAbsenteeEmail.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 */

const moment = require("moment");

const displayInventory = (row) => {
	const totalHours = row.Hour - row.NegHour;
	const totalHalfHours = row.HalfHour - row.NegHalfHour;
	const totalPairs = row.Pair - row.NegPair;

	return `${totalHours ? `${totalHours} Hour(s)` : ""}${
		totalHalfHours
			? `${totalHours ? `, ` : ""}${totalHalfHours} Half Hour(s)`
			: ""
	}${
		totalPairs
			? `${totalHours || totalHalfHours ? `, ` : ""}${totalPairs} Pairs(s)`
			: ""
	}`;
};

const renderBody = (data) => {
	return data.reduce((html, x) => {
		html =
			html +
			String.raw`
				<tr>
					<td style="border-top: 1px solid black;border-left: 1px solid black; ">
						<span style="padding:5px;">${x.Client}</span>
					</td>
					<td style="border-top: 1px solid black;border-left: 1px solid black;">
						<span style="padding:5px;">${moment(x.Date).format("MM/DD/YYYY")}
						</span>
					</td>
					<td style="border-top: 1px solid black;border-left: 1px solid black;">
						<span style="padding:5px;">${x.Trainer}
						</span>
					</td>
					<td style="border-top: 1px solid black;border-left: 1px solid black;">
						<span style="padding:5px;">${x.Location}
						</span>
					</td>
					<td style="border-top: 1px solid black;border-left: 1px solid black;border-right: 1px solid black;">
						<span style="padding:5px;">${displayInventory(x)}
						</span>
					</td>
				</tr>
			`;
		return html;
	}, ``);
};

const buildEmail = (data) => String.raw`
	<b
		>Monthly long-term inactive list for the date
		${moment().format("MM/DD/YYYY")}</b
	></br>
	<table>
		<tr>
			<th style="border-bottom:1px solid black">Client</th>
			<th style="border-bottom:1px solid black">Date</th>
			<th style="border-bottom:1px solid black">Trainer</th>
			<th style="border-bottom:1px solid black">location</th>
			<th style="border-bottom:1px solid black">Inventory</th>
		</tr>${renderBody(data)}
		
	</table>
`;

const buildMonthlyAbsenteeEmail = (data) => {
	const email = buildEmail(data);
	console.log("Monthly long-term inactive list Email successfully built");
	return email;
};

module.exports = buildMonthlyAbsenteeEmail;
