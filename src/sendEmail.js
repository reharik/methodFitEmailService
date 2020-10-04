// /*
//  * File: /sendEmail.js
//  * Project: src
//  * Created Date: 2020-08-02
//  * Author: Raif
//  *
//  * Copyright (c) 2020 TaskRabbit, Inc
//  */
var aws = require("aws-sdk");
var ses = new aws.SES({ region: "us-east-2" });

const sendEmail = async (
	subject,
	email,
	event,
	context,
	toAddress = process.env.EMAIL_ADDRESS,
	ccAddresses
) => {
	const overrideEmail = event.emailAddress;
	const params = {
		Destination: {
			ToAddresses: [overrideEmail || toAddress],
			CcAddresses: !overrideEmail ? ccAddresses : [],
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
	} catch (err) {
		console.error(`${subject} was not sent successfully`);
		console.error(err, err.stack);
		context.done(null, "Failed");
	}
};

module.exports = sendEmail;
