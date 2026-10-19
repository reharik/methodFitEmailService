/*
 * File: /buildWeeklyCadenceList
 * Project: src
 * Created Date: 2026-10-16
 * Author: Raif
 *
 */
const sql = require("mssql");
const fs = require("node:fs");
const path = require("node:path");

const CADENCE_SQL = fs.readFileSync(
  path.join(__dirname, "cadence.sql"),
  "utf8",
);

const buildWeeklyCadenceList = async () => {
  const pool = await sql.connect(process.env.DB_CONNECTION);
  const r = await pool.request().batch(CADENCE_SQL); // batch, not query — allows DECLARE + temp tables

  if (r.recordsets.length !== 6) {
    throw new Error(`expected 6 recordsets, got ${r.recordsets.length}`);
  }

  const [trainers, clients, series, trainerWeekly, trainerNames, clientNames] =
    r.recordsets;
  return {
    trainers,
    clients,
    series,
    trainerWeekly,
    trainerNames,
    clientNames,
  };
};

module.exports = buildWeeklyCadenceList;
