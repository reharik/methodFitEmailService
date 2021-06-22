/*
 * File: /src/buildWeeklyAbsenteeEmail.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 */

const { groupBy } = require("lodash");
const moment = require("moment");

const trainersClients = (group) =>
	group
		.sort((a, b) => (moment(a.LastDate).isAfter(moment(b.LastDate)) ? 1 : -1))
		.reduce((acc, x) => {
			acc += `    <br />
${x.FirstName} ${x.LastName}: Last Appointment ${moment(x.LastDate).format(
				"M/D/YYYY"
			)}.
<br />`;
			return acc;
		}, "");

const buildWeeklyAbsenteeEmails = (data) => {
	const groupedTrainers = groupBy(
		data,
		(c) => `${c.TrainerLastName}, ${c.TrainerFirstName}`
	);

	const emails = Object.keys(groupedTrainers).map((key) => {
		const group = groupedTrainers[key];

		const trainerEmail = group[0].trainerEmail;
		const email = `<b>Weekly absentee report for week ending ${moment().format(
			"MMM Do YYYY"
		)}</b><br /><br />${trainersClients(groupedTrainers[key])}`;
		return { toAddress: trainerEmail, email };
	});

	console.log("Weekly Absentee Emails successfully built");
	return emails;
};

module.exports = buildWeeklyAbsenteeEmails;
