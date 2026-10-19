const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const data = require("../fixtures/sample-data.json");
const { buildLlmPayload } = require("../../src/weeklyCadenceReport/weeklyCadenceReport");
const queryLlm = require("../../src/weeklyCadenceReport/weeklyCadenceQueryLlm");

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const nameParts = [...data.trainerNames, ...data.clientNames]
  .flatMap((x) => [x.firstName, x.lastName])
  .filter((s) => typeof s === "string" && s.trim());
// Whole-word, case-sensitive: a client called "Mo" shouldn't match the status "Moved".
const leakedNames = (text) =>
  [...new Set(nameParts)].filter((n) =>
    new RegExp(`(^|[^A-Za-z])${escapeRe(n)}([^A-Za-z]|$)`).test(text),
  );

const payload = buildLlmPayload("2026-10-19", data);

describe("LLM payload privacy boundary", () => {
  it("fixture has names to check", () => {
    assert.ok(nameParts.length > 0);
  });

  it("contains no first or last name from trainerNames or clientNames", () => {
    assert.deepEqual(leakedNames(JSON.stringify(payload)), []);
  });

  it("sends flagged clients only the allow-listed fields", () => {
    const allowed = [
      "clientId", "trainerId", "status", "usualPerWeek",
      "recentPerWeek", "daysSinceLast", "missedSessions", "unusedCredits",
    ];
    for (const c of payload.flaggedClients) assert.deepEqual(Object.keys(c), allowed);
  });

  it("puts no names in the request actually sent to the API", async () => {
    let sent;
    const fakeClient = {
      messages: {
        create: async (req) => {
          sent = req;
          return { content: [{ type: "text", text: "hi" }], usage: { input_tokens: 1, output_tokens: 1 } };
        },
      },
    };
    await assert.rejects(queryLlm(payload, fakeClient)); // no tool_use; we only want the request
    assert.deepEqual(leakedNames(JSON.stringify(sent)), []);
  });
});
