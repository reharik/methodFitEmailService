/*
 * File: /src/managerCommissionReport.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 */
const buildManagerCommissionList = require("./buildManagerCommissionList");
const sendEmail = require("../sendEmail");
const buildActiveTrainerEmail = require("./buildActiveTrainerEmail");
const buildManagerCommissionEmail = require("./buildManagerCommissionEmail");
const moment = require("moment");

const managerCommissionReport = async (event, context) => {
  const data = await buildManagerCommissionList(event);
  const email = await buildManagerCommissionEmail(data);
  await sendEmail(
    `${moment()
      .subtract(1, "month")
      .format("MMMM YYYY")} Manager Commission Report V2`,
    email,
    event,
    context,
  );

  const emails = await buildActiveTrainerEmail(data);
  for (let i = 0; i < emails.length; i++) {
    const e = emails[i];
    await sendEmail(
      `${moment().format("MMM YYYY")} Active Trainer Report`,
      e.email,
      event,
      context,
      e.toAddress,
    );
  }
};

module.exports = managerCommissionReport;
