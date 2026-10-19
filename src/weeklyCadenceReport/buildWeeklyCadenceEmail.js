/*
 * File: /src/buildMonthlyAbsenteeEmail.js
 * Project: lambdaemails
 * Created Date: 2020-08-02
 * Author: Raif
 *
 */

const moment = require("moment");
const STATUS_LABEL = {
  Stopped: "Stopped",
  Drifting: "Drifting",
  Early: "Early warning",
  "Off cadence": "Slowed",
  Moved: "Moved",
};

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const td = (v, align = "left") =>
  `<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:${align}">${esc(v)}</td>`;
const th = (v, align = "left") =>
  `<th style="padding:6px 10px;border-bottom:2px solid #ccc;text-align:${align};font-weight:600">${esc(v)}</th>`;

const lastSeen = (days) =>
  days == null
    ? "—"
    : days < 7
      ? "this week"
      : `${Math.round(days / 7)} wk ago`;

const trainerTable = (trainers, names) => {
  const rows = trainers
    .map(
      (t) => `<tr>
    ${td(names.trainers.get(t.trainerId) ?? `#${t.trainerId}`)}
    ${td(t.clients, "right")}${td(t.onPace, "right")}${td(t.slowed, "right")}
    ${td(t.drifting, "right")}${td(t.early, "right")}${td(t.stopped, "right")}${td(t.movedToOtherTrainer, "right")}
    ${td(t.paceDeliveredPct == null ? "—" : `${Math.round(t.paceDeliveredPct)}%`, "right")}
    ${td(t.missedSessions, "right")}
  </tr>`,
    )
    .join("");
  return `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:14px">
    <tr>${th("Trainer")}${th("Clients", "right")}${th("On pace", "right")}${th("Slowed", "right")}${th("Drifting", "right")}${th("Early", "right")}${th("Stopped", "right")}${th("Moved", "right")}${th("Pace", "right")}${th("Shortfall (8 wk)", "right")}</tr>
    ${rows}</table>`;
};

const clientRows = (clients, names) => {
  if (!clients.length)
    return `<p style="color:#777;font-size:13px;margin:4px 0 0">No flagged clients.</p>`;
  const rows = clients
    .map(
      (c) => `<tr>
    ${td(names.clients.get(c.clientId) ?? `#${c.clientId}`)}
    ${td(STATUS_LABEL[c.status] ?? c.status)}
    ${td(c.usualPerWeek, "right")}${td(c.recentPerWeek, "right")}
    ${td(lastSeen(c.daysSinceLast))}
    ${td(Math.round(c.missedSessions), "right")}
  </tr>`,
    )
    .join("");
  return `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px;margin-top:6px">
    <tr>${th("Client")}${th("Status")}${th("Usual /wk", "right")}${th("Recent /wk", "right")}${th("Last seen")}${th("Shortfall", "right")}</tr>
    ${rows}</table>`;
};

const trainerSection = (t, clients, brief, names) => {
  const name = names.trainers.get(t.trainerId) ?? `#${t.trainerId}`;
  const stats = [
    ["shortfall", t.missedSessions],
    ["stopped", t.stopped],
    ["slowed", t.slowed],
    ["drifting", t.drifting],
    ["early", t.early],
  ]
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${k}`)
    .join(" · ");
  return `<div style="margin-top:28px">
    <h3 style="margin:0;font-size:16px">${esc(name)} <span style="font-weight:400;color:#777;font-size:13px">${esc(stats)}</span></h3>
    ${brief ? `<p style="margin:8px 0 0;font-size:14px;line-height:1.45">${esc(brief)}</p>` : ""}
    ${clientRows(clients, names)}
  </div>`;
};

const buildEmail = ({ weekEnding, data, names, briefs }) => {
  const briefFor = (id) =>
    briefs?.trainers.find((t) => t.trainerId === id)?.brief;
  const clientsFor = (id) => data.clients.filter((c) => c.trainerId === id);

  return `<!doctype html><html><body style="margin:0;padding:24px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#222;background:#fff">
  <div style="max-width:720px;margin:0 auto">
    <h2 style="margin:0 0 4px">Weekly cadence report</h2>
    <p style="margin:0 0 16px;color:#777;font-size:13px">Week ending ${esc(weekEnding)} · last 8 weeks vs. each client's prior 18</p>
    ${briefs ? `<p style="font-size:16px;line-height:1.45;margin:0 0 8px">${esc(briefs.headline)}</p>` : ""}
    ${briefs?.note ? `<p style="font-size:13px;color:#777;margin:0 0 16px">${esc(briefs.note)}</p>` : ""}
    ${trainerTable(data.trainers, names)}
    ${data.trainers.map((t) => trainerSection(t, clientsFor(t.trainerId), briefFor(t.trainerId), names)).join("")}
    <p style="margin-top:32px;font-size:12px;color:#999;line-height:1.5">
      On pace = last 8 weeks at 75%+ of the client's own usual. Slowed = 50–75%. Drifting = under 50%. Early = fine over 8 weeks but the last 3 dropped and they're overdue. Moved = picked up with another trainer. Clients who quit more than 8 weeks ago aren't shown. Shortfall = sessions below the client’s own usual pace over the last 8 weeks. A client who usually trains twice a week and came once a week has a shortfall of 8.
    </p>
  </div></body></html>`;
};

module.exports = buildEmail;
