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
	const result = await dailyPaymentReport(context);
	console.log(result);
	return {
		statusCode: 200,
		body: result, //;JSON.stringify(result, null, 2),
	};
};

module.exports.weeklyAbsenteeReport = async (event, context) => {
	const result = await weeklyAbsenteeReport(context);
	console.log(result);
	return {
		statusCode: 200,
		body: result, //;JSON.stringify(result, null, 2),
	};
};

module.exports.managerCommissionReport = async (event, context) => {
	const result = await managerCommissionReport(event, context);
	console.log(result);
	return {
		statusCode: 200,
		body: result, //;JSON.stringify(result, null, 2),
	};
};
