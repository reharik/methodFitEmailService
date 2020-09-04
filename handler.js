/*
 * File: /src/dailyPaymentReport/handler.js
 * Project: lambdaemails
 * Created Date: 2020-08-16
 * Author: Raif
 *
 * Copyright (c) 2020 TaskRabbit, Inc
 */
"use strict";
const dailyPaymentReport = require("./src/dailyPaymentReport/dailyPaymentReport");
const weeklyAbsenteeReport = require("./src/weeklyAbsenteeReport/weeklyAbsenteeReport");
const managerCommissionReport = require("./src/managerCommissionReport/managerCommissionReport");

module.exports.dailyPaymentReport = async (event, context) => {
	await dailyPaymentReport(event, context);
	return {
		statusCode: 200,
		body: result, //;JSON.stringify(result, null, 2),
	};
};

module.exports.weeklyAbsenteeReport = async (event, context) => {
	await weeklyAbsenteeReport(event, context);
	return {
		statusCode: 200,
		body: result, //;JSON.stringify(result, null, 2),
	};
};

module.exports.managerCommissionReport = async (event, context) => {
	await managerCommissionReport(event, context);
	return {
		statusCode: 200,
		body: result, //;JSON.stringify(result, null, 2),
	};
};
