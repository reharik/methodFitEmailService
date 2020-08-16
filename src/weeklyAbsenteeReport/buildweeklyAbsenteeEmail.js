/*
 * File: /src/buildWeeklyAbsenteeEmail.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 * Copyright (c) 2020 TaskRabbit, Inc
 */

const { groupBy } = require("lodash");
const moment = require("moment");

const buildWeeklyAbsenteeEmail = async (data) => {
	const grouped = groupBy(
		data.recordset,
		(c) => `${c.TrainerLastName}, ${c.TrainerFirstName}`
	);

	const trainersClients = (key) =>
		grouped[key]
			.sort((a, b) => (moment(a.LastDate).isAfter(moment(b.LastDate)) ? 1 : -1))
			.reduce((acc, x) => {
				acc += `    <br />
${x.FirstName} ${x.LastName}'s Last Appointment was on ${moment(
					x.LastDate
				).format("MMM Do YYYY")}.
Their Phone number is ${x.MobilePhone}.
Their Email is <a href='mailto:"${x.Email}"'>${x.Email}</a>
<br />`;
				return acc;
			}, "");

	const trainers = Object.keys(grouped).reduce((acc, key) => {
		acc += `<br /><b> ${key}</b><br />
${trainersClients(key)}`;
		return acc;
	}, "");

	const email = `<b>Weekly absentee report for ${moment()
		.subtract(10, "days")
		.format("MMM Do YYYY")}</b><br /><br />${trainers}`;
	return email;
};

module.exports = buildWeeklyAbsenteeEmail;
