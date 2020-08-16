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

module.exports.dailyPaymentReport = async (event, context) => {
	const result = await dailyPaymentReport(context);
	return {
		statusCode: 200,
		body: result, //;JSON.stringify(result, null, 2),
	};
};

module.exports.weeklyAbsenteeReport = async (event, context) => {
	const result = await weeklyAbsenteeReport(context);
	return {
		statusCode: 200,
		body: result, //;JSON.stringify(result, null, 2),
	};
};
