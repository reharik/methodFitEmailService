/*
 * File: /src/buildWeeklyPaymentEmail.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 * Copyright (c) 2020 TaskRabbit, Inc
 */

const moment = require("moment");

const buildWeeklyPaymentEmail = async (payments) => {
	const root = `
<table style="width:100%">
	<tr style="font-weight:bold;">
		<td>Purchase Date</td>
		<td>Trainer</td>
		<td>Client</td>
		<td>Total</td>
	</tr>
`;

	const buildPaymentRow = (payment, type) => `
	<tr>
		<td>${type}</td>
		<td>${payment[type + "Price"]}</td>
		<td>${payment[type]}</td>
		<td>$${payment[type + "Price"] * payment[type]}</td>
	</tr>
`;

	const buildItemRows = (payment) => {
		let result = ``;
		if (payment.FullHour) {
			result += buildPaymentRow(payment, "FullHour");
		}
		if (payment.FullHourTenPack) {
			result += buildPaymentRow(payment, "FullHourTenPack");
		}
		if (payment.HalfHour) {
			result += buildPaymentRow(payment, "HalfHour");
		}
		if (payment.HalfHourTenPack) {
			result += buildPaymentRow(payment, "HalfHourTenPack");
		}
		if (payment.Pair) {
			result += buildPaymentRow(payment, "Pair");
		}
		if (payment.PairTenPack) {
			result += buildPaymentRow(payment, "PairTenPack");
		}
		return result;
	};

	const buildItemList = (payment) => `
	<table style="width:100%; padding-left:15px">
		<tr style="font-style:italic;">
			<td style="border-bottom:1px solid black">Item</td>
			<td style="border-bottom:1px solid black">Price</td>
			<td style="border-bottom:1px solid black">Quantity</td>
			<td style="border-bottom:1px solid black">Total</td>
		</tr>
	${buildItemRows(payment)}
	
	</table>
`;

	const buildPayment = (payment) => `
	<tr>
		<td  style="padding:5px;border-top: 1px solid black;border-left: 1px solid black; border-bottom: 1px solid black;">${moment(
			payment.CreatedDate
		).format("MM/DD/YYYY hh:mm A")}</td>
		<td style="border-top: 1px solid black;border-bottom: 1px solid black;">${
			payment.Trainer
		}</td>
		<td style="border-top: 1px solid black;border-bottom: 1px solid black;">${
			payment.Client
		}</td>
		<td style="border-top: 1px solid black;border-right: 1px solid black;border-bottom: 1px solid black;">$${
			payment.PaymentTotal
		}</td>
	</tr>
	<tr>
		<td colspan="4" style="border-left: 1px solid black;border-right: 1px solid black;">
			${buildItemList(payment)}
		</td>
	</tr>
	<tr>
		<td colspan="4" style="width:100%; border-top:1px solid black;">
		&nbsp;
		</td>
	</tr>
`;
	let html;
	if (payments.length === 0) {
		html = "No payments entered on this day";
	} else {
		html = root;
		payments.forEach((x) => (html += buildPayment(x)));
		html += `
</table>
`;
	}
	const email = `<b>Daily payment report for ${moment().format(
		"MMM Do YYYY"
	)}</b><br /><br />${html}`;
	return email;
};

module.exports = buildWeeklyPaymentEmail;
