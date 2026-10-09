/*
 * File: /src/buildActiveTrainerReport.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 */

const sessions = require("./activeTrainerSessions");
const moment = require("moment");

const buildActiveTrainerReport = async ({ data }) => {
  const emails = data.rows.map((x) => {
    const sessionsHtml = sessions({ rows: [x] });
    let email = `<b>Average hours per client for ${moment()
      .subtract(1, "month")
      .format("MMMM YYYY")}</b><br /><br />${sessionsHtml}`;

    return { toAddress: x.trainerEmail, email };
  });
  console.log("Active Trainer Email successfully built");
  return emails;
};

module.exports = buildActiveTrainerReport;
