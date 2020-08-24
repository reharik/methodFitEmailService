// /*
//  * File: /sendEmail.js
//  * Project: src
//  * Created Date: 2020-08-02
//  * Author: Raif
//  *
//  * Copyright (c) 2020 TaskRabbit, Inc
//  */
var moment = require("moment");
var aws = require("aws-sdk");
var ses = new aws.SES({ region: "us-east-2" });

const sendEmail = async (subject, email, context) => {
	const params = {
		Destination: {
			ToAddresses: [process.env.EMAIL_ADDRESS],
		},
		Message: {
			Body: {
				Html: {
					Charset: "UTF-8",
					Data: email,
				},
			},
			Subject: {
				Charset: "UTF-8",
				Data: subject,
			},
		},
		Source: "MethodFit Scheduler <info@methodfit.com>",
	};

	try {
		const result = await ses.sendEmail(params).promise();
		console.log(`${subject} sent successfully: ${result.MessageId}`);
		context.done(null, "Success");
	} catch (err) {
		console.error(`${subject} was not sent successfully`);
		console.error(err, err.stack);
		context.done(null, "Failed");
	}
};

module.exports = sendEmail;
