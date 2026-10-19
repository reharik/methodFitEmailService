/*
 * File: /src/weeklyCadenceReport.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 */
const buildWeeklyCadenceList = require("./buildWeeklyCadenceList");
const sendEmail = require("../sendEmail");
const buildWeeklyCadenceEmail = require("./buildWeeklyCadenceEmail");
const queryLlm = require("./weeklyCadenceQueryLlm");
const { studioNow } = require("../studioDate");
const names = require("./parseNames");

// IDs and numbers only — names never leave the Lambda. Allow-list, so new SQL columns don't leak.
const buildLlmPayload = (weekEnding, data) => ({
  weekEnding,
  trainers: data.trainers,
  flaggedClients: data.clients.map((c) => ({
    clientId: c.clientId,
    trainerId: c.trainerId,
    status: c.status,
    usualPerWeek: c.usualPerWeek,
    recentPerWeek: c.recentPerWeek,
    daysSinceLast: c.daysSinceLast,
    shortfall: c.shortfall,
    unusedCredits: c.unusedCredits,
    paceDeliveredPct: c.paceDeliveredPct,
  })),
});

const weeklyCadenceReport = async (event, context) => {
  const weekEnding = studioNow().toISODate();
  const data = await buildWeeklyCadenceList(event);
  const namesMaps = names.buildNameMaps(data.trainerNames, data.clientNames);

  let briefs = null;
  if (process.env.LLM_ENABLED === "true") {
    try {
      const payload = buildLlmPayload(weekEnding, data);
      briefs = await queryLlm(payload); // validated shape or throws
      briefs = names.substituteNames(briefs, namesMaps); // {client:12138} → "Maria R."
    } catch (e) {
      console.error("LLM step failed; sending without briefs", e);
      briefs = null;
    }
  }

  const email = buildWeeklyCadenceEmail({
    weekEnding,
    data,
    names: namesMaps,
    briefs,
  });
  await sendEmail(
    `Cadence report — week ending ${weekEnding}`,
    email,
    event,
    context,
  );
};

module.exports = weeklyCadenceReport;
module.exports.buildLlmPayload = buildLlmPayload;
