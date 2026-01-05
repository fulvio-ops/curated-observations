/**
 * KETOGO daily runner (Option 1: GitHub Actions + JSON in repo)
 *
 * - Fetch deterministic RSS feeds (same list)
 * - Apply manifesto-aligned subtractive heuristics (no AI required)
 * - Append approved items to public/data/observations.json
 * - Append approved objects to public/data/objects.json
 * - If nothing approved, do nothing (quiet day)
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 20000,
  headers: {
    "User-Agent": "KETOGO/1.0 (+quiet editor)"
  }
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

const DATA_PATH = path.join(process.cwd(), "public", "data", "observations.json");
const OBJECTS_PATH = path.join(process.cwd(), "public", "data", "objects.json");

function sha1(input) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

/**
 * Hard reject terms shared across both observations and objects.
 * Keep it strict: tragedy, violence, politics, outrage, promotions, "how-to".
 */
function hardRejectTerms() {
  return [
    "killed", "dead", "death", "shoot", "shooting", "war", "bomb", "attack", "terror", "rape",
    "murder", "suicide", "hostage", "injured", "victim", "earthquake", "flood", "fire",
    "politic", "election", "president", "minister", "parliament", "senate", "congress",
    "opinion", "editorial", "analysis", "explainer", "why you should", "how to", "tips",
    "best", "top ", "deal", "discount", "sponsored", "promo", "buy now", "affiliate"
  ];
}

/**
 * Observations approval:
 * - hard rejects
 * - low-signal rejects
 * - allow-list = clear fit
 * - otherwise deterministic 20% of neutral items
 */
function approveHeuristic({ title, link }) {
  const t = (title || "").toLowerCase();

  const hardReject = hardRejectTerms();
  if (hardReject.some(k => t.includes(k))) return { ok: false, reason: "hard_reject" };

  const lowSignal = ["breaking", "live", "update", "highlights", "recap"];
  if (lowSignal.some(k => t.includes(k))) return { ok: false, reason: "low_signal" };

  const allow = [
    "odd", "weird", "strange", "bizarre", "absurd", "of course", "apparently", "somehow",
    "unexpected", "mildly", "satisfying", "design", "prototype", "invention", "product",
    "nobody asked", "this exists"
  ];

  const ok = allow.some(k => t.includes(k));
  if (!ok) {
    // deterministic fallback: 20% of neutral items
    const h = parseInt(sha1(`${title || ""}|${link || ""}`).slice(0, 8), 16);
    const pass = (h % 100) < 20;
    if (!pass) return { ok: false, reason: "no_clear_fit" };
  }

  if (!link) return { ok: false, reason: "no_link" };
  return { ok: true, reason: "approved" };
}

/**
 * Objects approval:
 * Goal: tangible artifacts (physical objects), not apps/services/AI-tools.
 * - hard rejects (shared)
 * - rejects for software/services/finance noise
 * - allow-list signals for physical objects/design artifacts
 * - otherwise deterministic 20% of neutral items (after rejects)
 */
function approveObjectHeuristic({ title, link }) {
  const t = (title || "").toLowerCase();

  const hardReject = hardRejectTerms();
  if (hardReject.some(k => t.includes(k))) return { ok: false, reason: "hard_reject" };

  // reject software/services + generic tech/business noise
  const reject = [
    "app", "saas", "software", "platform", "startup", "funding", "raises", "round",
    "ai ", "chatgpt", "prompt", "llm", "openai",
    "crypto", "token", "blockchain", "nft",
    "newsletter", "podcast", "webinar", "course", "tutorial",
    "price target", "stocks", "earnings"
  ];
  if (reject.some(k => t.includes(k))) return { ok: false, reason: "not_object" };

  // allow signals for tangible artifacts
  const allow = [
    "chair", "lamp", "table", "sofa", "stool", "shelf",
    "mug", "cup", "bottle", "glass",
    "toy", "figure", "mask", "bag", "backpack", "wallet",
    "watch", "clock",
    "keyboard", "mouse", "speaker", "headphones", "camera",
    "gadget", "device", "tool", "machine", "robot",
    "design", "prototype", "product", "object",
    "odd", "weird", "bizarre", "absurd"
  ];

  const ok = allow.some(k => t.includes(k));
  if (!ok) {
    // deterministic fallback: 20% of neutral items (post-reject)
    const h = parseInt(sha1(`obj|${title || ""}|${link || ""}`).slice(0, 8), 16);
    const pass = (h % 100) < 20;
    if (!pass) return { ok: false, reason: "no_object_signal" };
  }

  if (!link) return { ok: false, reason: "no_link" };
  return { ok: true, reason: "approved_object" };
}

function microJudgmentHeuristic(title) {
  const options = [
    "This exists.",
    "Someone approved this.",
    "No one stopped it.",
    "And yet, here we are.",
    "Perfectly normal, apparently.",
    "Reality remains employed."
  ];
  const h = parseInt(sha1(title || "x").slice(0, 8), 16);
  return options[h % options.length];
}

async function fetchAll() {
  const results = [];
  for (const f of FEEDS) {
    try {
      const feed = await parser.parseURL(f.url);
      for (const item of feed.items || []) {
        const title = (item.title || "").trim();
        const link = (item.link || item.guid || "").trim();
        const isoDate = item.isoDate || item.pubDate || null;

        // normalize date to ISO for sorting stability
        const published_at = isoDate
          ? new Date(isoDate).toISOString()
          : new Date().toISOString();

        results.push({
          source: f.name,
          title,
          link,
          published_at
        });
      }
    } catch (e) {
      console.error(`[feed-error] ${f.name}: ${e?.message || e}`);
    }
  }
  return results;
}

function loadExisting() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function save(arr) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(arr, null, 2) + "\n", "utf-8");
}

function loadExistingObjects() {
  try {
    const raw = fs.readFileSync(OBJECTS_PATH, "utf-8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveObjects(arr) {
  fs.writeFileSync(OBJECTS_PATH, JSON.stringify(arr, null, 2) + "\n", "utf-8");
}

async function main() {
  const existing = loadExisting();
  const existingSet = new Set(existing.map(x => x.fingerprint).filter(Boolean));

  const existingObjects = loadExistingObjects();
  const existingObjectsSet = new Set(existingObjects.map(x => x.fingerprint).filter(Boolean));

  const collected = await fetchAll();

  // Deduplicate across history by fingerprint
  const newItems = [];
  for (const it of collected) {
    if (!it.link) continue;
    const fp = sha1(`${it.source}|${it.link}`);
    if (existingSet.has(fp)) continue;
    newItems.push({ ...it, fingerprint: fp });
  }

  // Observations: manifesto-aligned filter
  const approved = [];
  for (const it of newItems) {
    const verdict = approveHeuristic(it);
    if (!verdict.ok) continue;
    approved.push({
      ...it,
      micro_judgment: microJudgmentHeuristic(it.title)
    });
  }

  if (approved.length === 0) {
    console.log("[quiet-day] No new approved observations. No changes.");
  } else {
    const merged = [...existing, ...approved].sort((a, b) => {
      const da = new Date(a.published_at).getTime();
      const db = new Date(b.published_at).getTime();
      return db - da;
    });
    save(merged);
    console.log(`[publish] Added ${approved.length} observations.`);
  }

  // Objects: separate selection from the same pool
  const approvedObjects = [];
  for (const it of newItems) {
    const verdict = approveObjectHeuristic(it);
    if (!verdict.ok) continue;

    const fpObj = sha1(`object|${it.source}|${it.link}`);
    if (existingObjectsSet.has(fpObj)) continue;

    approvedObjects.push({
      ...it,
      fingerprint: fpObj,
      micro_judgment: microJudgmentHeuristic(it.title)
    });
  }

  if (approvedObjects.length === 0) {
    console.log("[objects] No new approved objects. No changes.");
  } else {
    const mergedObjects = [...existingObjects, ...approvedObjects].sort((a, b) => {
      const da = new Date(a.published_at).getTime();
      const db = new Date(b.published_at).getTime();
      return db - da;
    });
    saveObjects(mergedObjects);
    console.log(`[objects] Added ${approvedObjects.length} items.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
