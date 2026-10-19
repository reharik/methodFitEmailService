const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const data = require("../fixtures/sample-data.json");
const buildEmail = require("../../src/weeklyCadenceReport/buildWeeklyCadenceEmail");
const { buildNameMaps } = require("../../src/weeklyCadenceReport/parseNames");

const names = buildNameMaps(data.trainerNames, data.clientNames);
const weekEnding = "2026-10-19";
const escHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const trainerName = (id) => names.trainers.get(id) ?? `#${id}`;
// Each trainer section starts with an <h3>; sections render in data.trainers order.
const sections = (html) => html.split("<h3").slice(1);
const trainerTableHtml = (html) => html.slice(html.indexOf("<table"), html.indexOf("</table>"));

describe("buildEmail with briefs: null", () => {
  const html = buildEmail({ weekEnding, data, names, briefs: null });

  it("contains every trainer name from the fixture", () => {
    for (const t of data.trainers) {
      assert.ok(html.includes(escHtml(trainerName(t.trainerId))), `missing trainer ${t.trainerId}`);
    }
  });

  it("contains no unrendered or broken values", () => {
    for (const bad of ["undefined", "NaN", "{client:", "{trainer:", "[object Object]"]) {
      assert.ok(!html.includes(bad), `html contains ${bad}`);
    }
    assert.doesNotMatch(html, /\bnull\b/);
  });

  it("renders one section per trainer", () => {
    assert.equal(sections(html).length, data.trainers.length);
  });

  it("has a Stopped column holding each trainer's stopped count", () => {
    const table = trainerTableHtml(html);
    const headers = [...table.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((m) => m[1]);
    const col = headers.indexOf("Stopped");
    assert.ok(col > -1, "no Stopped header");
    const rows = table.split("<tr>").slice(2); // [0] is before the header row, [1] is the header
    data.trainers.forEach((t, i) => {
      const cells = [...rows[i].matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map((m) => m[1]);
      assert.equal(cells.length, headers.length);
      assert.equal(cells[col], String(t.stopped));
    });
  });

  it("includes the stopped count in each trainer section's stats line", () => {
    const secs = sections(html);
    data.trainers.forEach((t, i) => {
      assert.ok(secs[i].includes(`${t.stopped} stopped`), `section ${i} missing stopped count`);
    });
  });
});

describe("buildEmail with briefs", () => {
  assert.ok(data.trainers.length >= 2, "fixture needs at least 2 trainers");
  const [a, b] = data.trainers;
  const briefs = {
    headline: "HEADLINE-MARKER: missed sessions are up this week.",
    note: "NOTE-MARKER: one closed week excluded.",
    trainers: [
      { trainerId: a.trainerId, brief: `BRIEF-MARKER-${a.trainerId} needs a call this week.` },
      { trainerId: b.trainerId, brief: `BRIEF-MARKER-${b.trainerId} has one client slowing.` },
    ],
  };
  const html = buildEmail({ weekEnding, data, names, briefs });

  it("puts the headline before the trainer table", () => {
    const headlineAt = html.indexOf("HEADLINE-MARKER");
    assert.ok(headlineAt > -1);
    assert.ok(headlineAt < html.indexOf("<table"));
  });

  it("renders the note", () => {
    assert.ok(html.includes("NOTE-MARKER"));
  });

  it("puts each brief in its own trainer's section and no other", () => {
    const secs = sections(html);
    data.trainers.forEach((t, i) => {
      assert.ok(secs[i].includes(escHtml(trainerName(t.trainerId))), `section ${i} is not trainer ${t.trainerId}`);
      const own = briefs.trainers.find((x) => x.trainerId === t.trainerId);
      const found = secs[i].match(/BRIEF-MARKER-\d+/g) ?? [];
      assert.deepEqual(found, own ? [`BRIEF-MARKER-${t.trainerId}`] : []);
    });
  });

  it("renders the trainer table identically to the no-briefs version", () => {
    const plain = buildEmail({ weekEnding, data, names, briefs: null });
    assert.equal(trainerTableHtml(html), trainerTableHtml(plain));
  });
});
