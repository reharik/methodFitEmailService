const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const data = require("../fixtures/sample-data.json");
const queryLlm = require("../../src/weeklyCadenceReport/weeklyCadenceQueryLlm");
const { buildLlmPayload } = require("../../src/weeklyCadenceReport/weeklyCadenceReport");

const payload = buildLlmPayload("2026-10-19", data);
const [trainer] = payload.trainers;
const [client] = payload.flaggedClients;
assert.ok(trainer && client, "fixture needs at least one trainer and one flagged client");

const unusedId = (ids) => (ids.includes(999) ? Math.max(...ids) + 1 : 999);
const unknownTrainerId = unusedId(payload.trainers.map((t) => t.trainerId));
const unknownClientId = unusedId(payload.flaggedClients.map((c) => c.clientId));

const validInput = () => ({
  headline: `{trainer:${trainer.trainerId}} has the most missed sessions this week.`,
  trainers: [
    {
      trainerId: trainer.trainerId,
      brief: `{client:${client.clientId}} is ${client.status} and worth a call.`,
    },
  ],
  note: "One closed week was excluded.",
});

// Fake Anthropic client; records each request in .calls.
const fakeClient = (content, stop_reason = "end_turn") => {
  const calls = [];
  return {
    calls,
    messages: {
      create: async (req) => {
        calls.push(req);
        return { content, stop_reason, usage: { input_tokens: 1, output_tokens: 1 } };
      },
    },
  };
};
// Structured outputs arrive as JSON in a text block, after any (empty) thinking block.
const jsonReply = (obj) =>
  fakeClient([
    { type: "thinking", thinking: "", signature: "sig" },
    { type: "text", text: JSON.stringify(obj) },
  ]);

describe("queryLlm", () => {
  it("resolves with the parsed report on a valid response", async () => {
    const fc = jsonReply(validInput());
    assert.deepEqual(await queryLlm(payload, fc), validInput());
    assert.equal(fc.calls.length, 1);
  });

  it("requests structured output via output_config.format, not forced tool use", async () => {
    const fc = jsonReply(validInput());
    await queryLlm(payload, fc);
    const [req] = fc.calls;
    assert.equal(req.tool_choice, undefined);
    assert.equal(req.tools, undefined);
    assert.equal(req.output_config.format.type, "json_schema");
    assert.ok(req.messages[0].content.includes(JSON.stringify(payload)));
  });

  it("sends a schema the API accepts: closed objects, every property required", async () => {
    const fc = jsonReply(validInput());
    await queryLlm(payload, fc);
    const walk = (s, path) => {
      if (s.type === "object") {
        assert.equal(s.additionalProperties, false, `${path} must set additionalProperties:false`);
        assert.deepEqual([...s.required].sort(), Object.keys(s.properties).sort(), `${path} must require every property`);
        for (const [k, v] of Object.entries(s.properties)) walk(v, `${path}.${k}`);
      }
      if (s.items) walk(s.items, `${path}[]`);
    };
    const { schema } = fc.calls[0].output_config.format;
    walk(schema, "$");
    assert.deepEqual(schema.properties.note.type, ["string", "null"]);
  });

  it("accepts note: null", async () => {
    const input = { ...validInput(), note: null };
    assert.deepEqual(await queryLlm(payload, jsonReply(input)), input);
  });

  it("rejects when note is absent rather than null", async () => {
    const { note, ...rest } = validInput();
    await assert.rejects(queryLlm(payload, jsonReply(rest)));
  });

  it("rejects when headline is missing", async () => {
    const { headline, ...rest } = validInput();
    await assert.rejects(queryLlm(payload, jsonReply(rest)));
  });

  it("rejects when trainers is not an array", async () => {
    const input = { ...validInput(), trainers: { trainerId: trainer.trainerId, brief: "not an array at all" } };
    await assert.rejects(queryLlm(payload, jsonReply(input)));
  });

  it("rejects a trainerId not in the payload", async () => {
    const input = validInput();
    input.trainers[0].trainerId = unknownTrainerId;
    await assert.rejects(queryLlm(payload, jsonReply(input)), /unknown trainerId/);
  });

  it("rejects a {client:N} token not in flaggedClients", async () => {
    const input = validInput();
    input.trainers[0].brief = `{client:${unknownClientId}} has stopped coming in.`;
    await assert.rejects(queryLlm(payload, jsonReply(input)), /unknown client token/);
  });

  it("rejects a {trainer:N} token not in the payload", async () => {
    const input = { ...validInput(), headline: `{trainer:${unknownTrainerId}} is behind this week.` };
    await assert.rejects(queryLlm(payload, jsonReply(input)), /unknown trainer token/);
  });

  it("rejects a response with no text block", async () => {
    const fc = fakeClient([{ type: "thinking", thinking: "", signature: "sig" }]);
    await assert.rejects(queryLlm(payload, fc), /no text block/);
  });

  it("rejects text that isn't JSON", async () => {
    await assert.rejects(queryLlm(payload, fakeClient([{ type: "text", text: "hi" }])), SyntaxError);
  });

  it("rejects a truncated response (stop_reason max_tokens)", async () => {
    const fc = fakeClient([{ type: "text", text: '{"headline": "cut of' }], "max_tokens");
    await assert.rejects(queryLlm(payload, fc), /truncated/);
  });

  it("rejects a refusal", async () => {
    await assert.rejects(queryLlm(payload, fakeClient([], "refusal")), /refused/);
  });
});
