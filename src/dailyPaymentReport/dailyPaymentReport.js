/*
 * File: /src/dailyPaymentReport.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 */
const buildDailyPaymentList = require("./buildDailyPaymentList");
const sendEmail = require("./../sendEmail");
const buildDailyPaymentEmail = require("./buildDailyPaymentEmail");
const moment = require("moment");

const dailyPaymentReport = async (event, context) => {
	const data = await buildDailyPaymentList();
	const email = await buildDailyPaymentEmail(data);
	await sendEmail(
		`${moment().subtract(1,"days").format("MMM Do YYYY")} Daily Payment Report`,
		email,
		event,
		context
	);
	context.done(null, "Success");
};

module.exports = dailyPaymentReport;
