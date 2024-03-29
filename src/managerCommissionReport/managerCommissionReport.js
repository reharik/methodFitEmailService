/*
 * File: /src/managerCommissionReport.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 */
const buildManagerCommissionList = require("./buildManagerCommissionList");
const sendEmail = require("../sendEmail");
const buildManagerCommissionEmail = require("./buildManagerCommissionEmail");
const moment = require("moment");

const managerCommissionReport = async (event, context) => {
	const data = await buildManagerCommissionList(event);
	const email = await buildManagerCommissionEmail(data);
	await sendEmail(
		`${moment()
			.subtract(1, "month")
			.format("MMMM YYYY")} Manager Commission Report V2`,
		email,
		event,
		context
	);
	context.done(null, "Success");
};

module.exports = managerCommissionReport;
