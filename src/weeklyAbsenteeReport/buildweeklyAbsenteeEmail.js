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

const trainersClients = (group) =>
	group
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

const trainers = (groupedTrainers) =>
	Object.keys(groupedTrainers).reduce((acc, key) => {
		acc += `<br /><b> ${key}</b><br />
${trainersClients(groupedTrainers[key])}`;
		return acc;
	}, "");

const buildWeeklyAbsenteeEmail = async (data) => {
	const groupedTrainers = groupBy(
		data.recordset,
		(c) => `${c.TrainerLastName}, ${c.TrainerFirstName}`
	);

	const email = `<b>Weekly absentee report for ${moment()
		.subtract(10, "days")
		.format("MMM Do YYYY")}</b><br /><br />${trainers(groupedTrainers)}`;

	console.log("Weekly Absentee Email successfully built");
	return email;
};

module.exports = buildWeeklyAbsenteeEmail;
