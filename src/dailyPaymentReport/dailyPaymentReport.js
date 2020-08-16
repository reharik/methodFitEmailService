/*
 * File: /src/dailyPaymentReport.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 * Copyright (c) 2020 TaskRabbit, Inc
 */
const buildDailyPaymentList = require("./buildDailyPaymentList");
const sendEmail = require("./../sendEmail");
const buildDailyPaymentEmail = require("./buildDailyPaymentEmail");
const moment = require("moment");

const dailyPaymentReport = async (context) => {
	const data = await buildDailyPaymentList();
	const email = await buildDailyPaymentEmail(data);
	await sendEmail(
		`${moment().format("MMM Do YYYY")} Daily Payment Report`,
		email,
		context
	);
};

module.exports = dailyPaymentReport;
