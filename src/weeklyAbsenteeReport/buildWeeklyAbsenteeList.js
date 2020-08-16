/*
 * File: /buildWeeklyAbsenteeList
 * Project: src
 * Created Date: 2020-08-02
 * Author: Raif
 *
 * Copyright (c) 2020 TaskRabbit, Inc
 */
const sql = require("mssql");

const buildWeeklyAbsenteeList = async () => {
	mssql = await sql.connect(process.env.DB_CONNECTION);

	const clientSessions = await mssql
		.request()
		.execute("DailyClientAbsenteeReport");

	return clientSessions;
};

module.exports = buildWeeklyAbsenteeList;
