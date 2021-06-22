/*
 * File: /src/monthlyAbsenteeReport.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 */
const buildMonthlyAbsenteeList = require("./buildMonthlyAbsenteeList");
const sendEmail = require("../sendEmail");
const buildMonthlyAbsenteeEmail = require("./buildMonthlyAbsenteeEmail");
const moment = require("moment");

const monthlyAbsenteeReport = async (event, context) => {
	const data = await buildMonthlyAbsenteeList(event);
	const email = buildMonthlyAbsenteeEmail(data);
	await sendEmail(
		`${moment().format("MM/DD/YYYY")} Monthly long-term inactive list`,
		email,
		event,
		context
	);
	context.done(null, "Success");
};

module.exports = monthlyAbsenteeReport;
