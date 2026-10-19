const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const data = require("../fixtures/sample-data.json");
const {
  buildNameMaps,
  substituteNames,
  substituteNameSection,
} = require("../../src/weeklyCadenceReport/parseNames");

const names = buildNameMaps(data.trainerNames, data.clientNames);
const [t] = data.trainerNames;
const [c1, c2] = data.clientNames;
const full = (x) => [x.firstName, x.lastName].filter(Boolean).join(" ");

describe("buildNameMaps", () => {
  it("keys Maps by trainerId / clientId", () => {
    assert.ok(names.trainers instanceof Map);
    assert.equal(names.trainers.get(t.trainerId), full(t));
    assert.equal(names.clients.get(c1.clientId), full(c1));
  });

  it("skips a missing lastName rather than printing null", () => {
    const m = buildNameMaps([{ trainerId: 1, firstName: "Priya", lastName: null }], []);
    assert.equal(m.trainers.get(1), "Priya");
  });
});

describe("substituteNameSection", () => {
  it("swaps both token types", () => {
    assert.equal(
      substituteNameSection(`{trainer:${t.trainerId}} saw {client:${c1.clientId}}`, names),
      `${full(t)} saw ${full(c1)}`,
    );
  });

  it("swaps multiple tokens in one string", () => {
    const out = substituteNameSection(
      `{client:${c1.clientId}}, {client:${c2.clientId}} and {client:${c1.clientId}} again`,
      names,
    );
    assert.equal(out, `${full(c1)}, ${full(c2)} and ${full(c1)} again`);
  });

  it("falls back to client #N / trainer #N for unknown IDs", () => {
    assert.equal(
      substituteNameSection("{client:999999} with {trainer:999999}", names),
      "client #999999 with trainer #999999",
    );
  });
});

describe("substituteNames", () => {
  it("substitutes headline, every brief and note, keeping trainerId", () => {
    const out = substituteNames(
      {
        headline: `{client:${c1.clientId}} stopped`,
        trainers: [{ trainerId: t.trainerId, brief: `Call {client:${c2.clientId}}` }],
        note: `{trainer:${t.trainerId}} was out`,
      },
      names,
    );
    assert.deepEqual(out, {
      headline: `${full(c1)} stopped`,
      trainers: [{ trainerId: t.trainerId, brief: `Call ${full(c2)}` }],
      note: `${full(t)} was out`,
    });
  });
});
