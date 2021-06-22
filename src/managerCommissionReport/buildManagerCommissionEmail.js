/*
 * File: /src/buildManagerCommissionReport.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 */

const moment = require("moment");
const sessions = require("./sessions");
const inarrears = require("./inarrears");

const buildManagerCommissionReport = async ({ data, inarrearsData }) => {
	const sessionsHtml = sessions(data);
	const inarrearsHtml = inarrears(inarrearsData);
	let email = `<b>Manager Commission report for ${moment()
		.subtract(1, "month")
		.format("MMMM YYYY")}</b><br /><br />${sessionsHtml}`;
	if (Object.keys(inarrearsData).length > 0) {
		email += `<br /><br /><b>In Arrears</b><br /><br />${inarrearsHtml}`;
	}
	console.log("Manager Commission Email successfully built");
	return email;
};

module.exports = buildManagerCommissionReport;
