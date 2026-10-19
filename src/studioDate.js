/*
 * File: /src/studioDate.js
 * Project: lambdaemails
 * Created Date: 2026-10-19
 * Author: Raif
 *
 */
const { DateTime } = require("luxon");

// Lambda runs in UTC; shift to studio-local (Eastern) the same way buildWeeklyAbsenteeList does.
// Call per invocation — a module-level value goes stale on warm starts.
const studioNow = () => DateTime.now().minus({ hours: 5 });

module.exports = { studioNow };
