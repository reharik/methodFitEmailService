const Anthropic = require("@anthropic-ai/sdk");
const weeklyCadenceBriefValidation = require("./weeklyCadenceBriefValidation");
const { SYSTEM_PROMPT } = require("./weeklyCadencePrompt");

const MODEL = process.env.LLM_MODEL ?? "claude-sonnet-5-5";

const REF =
  "Refer to clients as {client:ID} and trainers as {trainer:ID}, exactly as written — e.g. {client:12138}, {trainer:32}. Never write a name.";

const REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "trainers", "note"],
  properties: {
    headline: {
      type: "string",
      description: `One or two sentences. The most important thing this week, with its number. ${REF}`,
    },
    trainers: {
      type: "array",
      description:
        "One entry per trainer with something worth saying. Omit trainers with nothing to act on. Order by urgency.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["trainerId", "brief"],
        properties: {
          trainerId: { type: "integer" },
          brief: { type: "string", description: `2–4 sentences. ${REF}` },
        },
      },
    },
    note: {
      type: ["string", "null"],
      description: `One sentence on a data caveat worth knowing this week, or null if there is none. ${REF}`,
    },
  },
};

let defaultClient;
const getClient = () =>
  (defaultClient ??= new Anthropic({ maxRetries: 1, timeout: 90_000 }));

const weeklyCadenceQueryLlm = async (payload, client = getClient()) => {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 16000, // adaptive thinking is on by default and counts against this
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here is this week's cadence data as JSON. Write the report.\n\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``,
      },
    ],
    output_config: {
      format: { type: "json_schema", schema: REPORT_SCHEMA },
    },
  });

  if (res.stop_reason === "max_tokens") {
    throw new Error("LLM output truncated");
  }
  if (res.stop_reason === "refusal") {
    throw new Error("LLM refused");
  }
  const text = res.content.find((b) => b.type === "text")?.text;
  if (!text) {
    throw new Error("LLM returned no text block");
  }
  const raw = JSON.parse(text);

  weeklyCadenceBriefValidation(raw, payload); // throws on bad shape or unknown IDs

  console.log(
    JSON.stringify({
      msg: "llm ok",
      model: MODEL,
      inputTokens: res.usage?.input_tokens,
      outputTokens: res.usage?.output_tokens,
      stopReason: res.stop_reason,
    }),
  );

  return raw;
};

module.exports = weeklyCadenceQueryLlm;
