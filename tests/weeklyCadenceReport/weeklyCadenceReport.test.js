// Run with --experimental-test-module-mocks (see npm test).
const { describe, it, mock, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const data = require("../fixtures/sample-data.json");

const src = path.join(__dirname, "../../src");
const sendEmail = mock.fn(async () => {});
const queryLlm = mock.fn();

mock.module(path.join(src, "weeklyCadenceReport/buildWeeklyCadenceList.js"), {
  defaultExport: async () => structuredClone(data),
});
mock.module(path.join(src, "sendEmail.js"), { defaultExport: sendEmail });
mock.module(path.join(src, "weeklyCadenceReport/weeklyCadenceQueryLlm.js"), {
  defaultExport: queryLlm,
});

const weeklyCadenceReport = require("../../src/weeklyCadenceReport/weeklyCadenceReport");
const { buildNameMaps } = require("../../src/weeklyCadenceReport/parseNames");
const names = buildNameMaps(data.trainerNames, data.clientNames);

const event = {};
const sentHtml = () => sendEmail.mock.calls[0].arguments[1];
const assertHasTrainerTable = (html) => {
  assert.ok(html.includes("Missed (8 wk)"), "trainer table header missing");
  const table = html.slice(html.indexOf("<table"), html.indexOf("</table>"));
  for (const t of data.trainers) {
    const name = names.trainers.get(t.trainerId) ?? `#${t.trainerId}`;
    assert.ok(table.includes(name.replace(/&/g, "&amp;")), `trainer ${t.trainerId} not in table`);
  }
};

let savedFlag;
beforeEach(() => {
  savedFlag = process.env.LLM_ENABLED;
  sendEmail.mock.resetCalls();
  queryLlm.mock.resetCalls();
  mock.method(console, "error", () => {});
});
afterEach(() => {
  if (savedFlag === undefined) delete process.env.LLM_ENABLED;
  else process.env.LLM_ENABLED = savedFlag;
  console.error.mock.restore();
});

describe("weeklyCadenceReport", () => {
  it("still sends the email with the trainer table when queryLlm throws", async () => {
    process.env.LLM_ENABLED = "true";
    queryLlm.mock.mockImplementation(async () => {
      throw new Error("boom");
    });

    await weeklyCadenceReport(event, {});

    assert.equal(queryLlm.mock.callCount(), 1);
    assert.equal(sendEmail.mock.callCount(), 1);
    assertHasTrainerTable(sentHtml());
    assert.equal(console.error.mock.callCount(), 1);
  });

  it("never calls queryLlm when LLM_ENABLED is unset", async () => {
    delete process.env.LLM_ENABLED;

    await weeklyCadenceReport(event, {});

    assert.equal(queryLlm.mock.callCount(), 0);
    assert.equal(sendEmail.mock.callCount(), 1);
    assertHasTrainerTable(sentHtml());
  });

  it("substitutes names into the briefs before rendering", async () => {
    process.env.LLM_ENABLED = "true";
    const [t] = data.trainers;
    const c = data.clients.find((x) => x.trainerId === t.trainerId) ?? data.clients[0];
    queryLlm.mock.mockImplementation(async () => ({
      headline: `{trainer:${t.trainerId}} missed the most sessions.`,
      trainers: [{ trainerId: t.trainerId, brief: `Call {client:${c.clientId}} this week.` }],
    }));

    await weeklyCadenceReport(event, {});

    const html = sentHtml();
    assert.ok(html.includes(names.clients.get(c.clientId).replace(/&/g, "&amp;")));
    assert.ok(!html.includes("{client:") && !html.includes("{trainer:"));
  });
});
