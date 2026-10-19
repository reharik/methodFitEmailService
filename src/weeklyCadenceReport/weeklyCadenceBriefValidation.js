const { z } = require("zod");

const ReportSchema = z.object({
  headline: z.string().min(10),
  trainers: z.array(
    z.object({
      trainerId: z.number().int(),
      brief: z.string().min(10),
    }),
  ),
  note: z.string().nullable(),
});

const weeklyCadenceBriefValidation = (result, payload) => {
  const report = ReportSchema.parse(result); // throws ZodError on mismatch

  const trainerIds = new Set(payload.trainers.map((t) => t.trainerId));
  const clientIds = new Set(payload.flaggedClients.map((c) => c.clientId));

  const allText = [
    report.headline,
    ...report.trainers.map((t) => t.brief),
    report.note ?? "",
  ].join(" ");

  for (const t of report.trainers) {
    if (!trainerIds.has(t.trainerId))
      throw new Error(`unknown trainerId ${t.trainerId}`);
  }
  for (const [, id] of allText.matchAll(/\{trainer:(\d+)\}/g)) {
    if (!trainerIds.has(+id)) throw new Error(`unknown trainer token ${id}`);
  }
  for (const [, id] of allText.matchAll(/\{client:(\d+)\}/g)) {
    if (!clientIds.has(+id)) throw new Error(`unknown client token ${id}`);
  }
};

module.exports = weeklyCadenceBriefValidation;
