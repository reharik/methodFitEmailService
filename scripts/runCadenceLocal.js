// scripts/runCadenceLocal.js
const weeklyCadenceReport = require("../src/weeklyCadenceReport/weeklyCadenceReport");
weeklyCadenceReport({ emailAddress: process.env.EMAIL_ADDRESS }, {})
  .then(() => {
    console.log("done");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
