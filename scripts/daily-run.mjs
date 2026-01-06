/**
 * KETOGO daily runner — PREVIEW OBJECTS MODE
 *
 * - Observations: same logic as before (20% neutral fallback)
 * - Objects (preview):
 *   - derived from design / product feeds
 *   - ONLY physical objects
 *   - max 3 per week
 *   - no Amazon API, no affiliate links
 *   - objects are editorial hints, not recommendations
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 20000,
  headers: { "User-Agent": "KETOGO/1.0 (+quiet editor)" }
});

const FEEDS = [
  { name: "Reddit · mildlyinteresting", url: "https://www.reddit.com/r/mildlyinteresting/.rss" },
  { name: "Reddit · oddlysatisfying", url: "https://www.reddit.com/r/oddlysatisfying/.rss" },
  { name: "Reddit · ofcoursethatsathing", url: "https://www.reddit.com/r/ofcoursethatsathing/.rss" },
  { name: "Product Hunt", url: "https://www.producthunt.com/feed" },
  { name: "Hacker News · frontpage", url: "https://hnrss.org/frontpage" },
  { name: "ANSA", url: "https://www.ansa.it/sito/ansait_rss.xml" },
  { name: "Designboom", url: "https://www.designboom.com/feed/" },
  { name: "Yanko Design", url: "https://www.yankodesign.com/feed/" }
];

const DATA_DIR = path.join(process.cwd(), "public", "data");
const OBS_PATH = path.join(DATA_DIR, "observations.json");
const OBJ_PATH = path.join(DATA_DIR, "objects.json");

function sha1(s) {
  return crypto.createHash("sha1").update(s).digest("hex");
}

/* ---------- shared utils ---------- */

function loadJson(p) {
  try {
    const raw = fs.readFileSync(p, "utf-8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveJson(p, arr) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(arr, null, 2) + "\n", "utf-8");
}

function hardRejectTerms(t) {
  return [
    "killed","dead","death","war","attack","terror","shoot","bomb",
    "politic","election","president","minister",
    "how to","tips","guide","best","top ","deal","discount","promo"
  ].some(k => t.includes(k));
}

/* ---------- OBSERVATIONS ---------- */

function approveObservation({ title, link }) {
  const t = (title || "").toLowerCase();
  if (hardRejectTerms(t)) return false;

  const allow = ["odd","weird","strange","bizarre","absurd","design","prototype","unexpected"];
  if (allow.some(k => t.includes(k))) return true;

  const h = parseInt(sha1(`${title}|${link}`).slice(0, 8), 16);
  return (h % 100) < 20;
}

/* ---------- OBJECTS (PREVIEW) ---------- */

function approvePreviewObject({ title, source }) {
  const t = (title || "").toLowerCase();
  const s = (source || "").toLowerCase();

  // only object-friendly sources
  if (!["designboom", "yanko"].some(k => s.includes(k))) return false;

  // reject software/services
  if (["app","saas","software","platform","ai ","crypto"].some(k => t.includes(k))) return false;

  // require physical object signals
  const nouns = [
    "chair","lamp","table","sofa","bench","stool",
    "mug","cup","bottle","glass",
    "bag","watch","clock","keyboard","speaker",
    "tool","device","gadget","robot"
  ];
  if (!nouns.some(k => t.includes(k))) return false;

  return true;
}

function weekKey() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const w = Math.ceil((((d - new Date(Date.UTC(y,0,1))) / 86400000) + 1) / 7);
  return `${y}-W${w}`;
}

/* ---------- MAIN ---------- */

async function main() {
  const observations = loadJson(OBS_PATH);
  const objects = loadJson(OBJ_PATH);

  const seenObs = new Set(observations.map(o => o.fingerprint));
  const seenObj = new Set(objects.map(o => o.fingerprint));

  const collected = [];

  for (const f of FEEDS) {
    try {
      const feed = await parser.parseURL(f.url);
      for (const it of feed.items || []) {
        const title = (it.title || "").trim();
        const link = (it.link || it.guid || "").trim();
        const date = it.isoDate || it.pubDate || new Date().toISOString();

        collected.push({
          source: f.name,
          title,
          link,
          published_at: new Date(date).toISOString()
        });
      }
    } catch {}
  }

  /* ----- observations ----- */
  const newObs = [];
  for (const it of collected) {
    const fp = sha1(`obs|${it.source}|${it.link}`);
    if (seenObs.has(fp)) continue;
    if (!approveObservation(it)) continue;

    newObs.push({
      ...it,
      fingerprint: fp,
      micro_judgment: null
    });
  }

  if (newObs.length) {
    saveJson(OBS_PATH, [...observations, ...newObs].sort((a,b)=>new Date(b.published_at)-new Date(a.published_at)));
  }

  /* ----- objects (preview, weekly cap) ----- */
  const thisWeek = weekKey();
  const weeklyCount = objects.filter(o => o.week === thisWeek).length;

  const newObj = [];
  if (weeklyCount < 3) {
    for (const it of collected) {
      if (newObj.length + weeklyCount >= 3) break;

      const fp = sha1(`obj|${it.source}|${it.link}`);
      if (seenObj.has(fp)) continue;
      if (!approvePreviewObject(it)) continue;

      newObj.push({
        ...it,
        fingerprint: fp,
        week: thisWeek,
        note: "Available on Amazon",
        micro_judgment: null
      });
    }
  }

  if (newObj.length) {
    saveJson(OBJ_PATH, [...objects, ...newObj].sort((a,b)=>new Date(b.published_at)-new Date(a.published_at)));
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
