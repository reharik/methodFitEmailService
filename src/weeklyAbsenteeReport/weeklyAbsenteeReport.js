/*
 * File: /src/weeklyAbsenteeReport.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 */
const buildWeeklyAbsenteeList = require("./buildWeeklyAbsenteeList");
const sendEmail = require("./../sendEmail");
const buildWeeklyAbsenteeEmails = require("./buildweeklyAbsenteeEmail");
const moment = require("moment");

const weeklyAbsenteeReport = async (event, context) => {
	const data = await buildWeeklyAbsenteeList(event);
	const emails = buildWeeklyAbsenteeEmails(data);
	for (let i = 0; i < emails.length; i++) {
		const e = emails[i];
		await sendEmail(
			`${moment().format("MMM Do YYYY")} Client Absentee Report`,
			e.email,
			event,
			context,
			e.toAddress,
			[process.env.EMAIL_ADDRESS]
		);
	}
	context.done(null, "Success");
};

module.exports = weeklyAbsenteeReport;
