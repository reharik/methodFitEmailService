/*
 * File: /src/weeklyAbsenteeReport.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 * Copyright (c) 2020 TaskRabbit, Inc
 */
const buildWeeklyAbsenteeList = require("./buildWeeklyAbsenteeList");
const sendEmail = require("./../sendEmail");
const buildWeeklyAbsenteeEmail = require("./buildweeklyAbsenteeEmail");
const moment = require("moment");

const weeklyAbsenteeReport = async (event, context) => {
	const data = await buildWeeklyAbsenteeList(event);
	const email = await buildWeeklyAbsenteeEmail(data);
	await sendEmail(
		`${moment().format("MMM Do YYYY")} Client Absentee Report`,
		email,
		event,
		context
	);
};

module.exports = weeklyAbsenteeReport;
