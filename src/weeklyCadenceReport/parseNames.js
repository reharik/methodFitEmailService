const fullName = (x) => [x.firstName, x.lastName].filter(Boolean).join(" ");

const buildNameMaps = (trainerArr, clientArr) => {
  const trainers = new Map(trainerArr.map((x) => [x.trainerId, fullName(x)]));
  const clients = new Map(clientArr.map((x) => [x.clientId, fullName(x)]));
  return { trainers, clients };
};

const substituteNameSection = (section, names) =>
  section
    .replace(
      /\{trainer:(\d+)\}/g,
      (_, id) => names.trainers.get(+id) ?? `trainer #${id}`,
    )
    .replace(
      /\{client:(\d+)\}/g,
      (_, id) => names.clients.get(+id) ?? `client #${id}`,
    );

const substituteNames = (briefs, names) => {
  const result = {};
  result.headline = substituteNameSection(briefs.headline, names);
  result.trainers = briefs.trainers.map((t) => ({
    ...t,
    brief: substituteNameSection(t.brief, names),
  }));
  if (briefs.note) {
    result.note = substituteNameSection(briefs.note, names);
  }
  return result;
};

module.exports = { buildNameMaps, substituteNames, substituteNameSection };
