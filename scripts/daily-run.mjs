/**
 * KETOGO daily runner (Option 1: GitHub Actions + JSON in repo)
 *
 * - Fetch deterministic RSS feeds
 * - Apply strict, manifesto-aligned *subtractive* heuristics (no AI required)
 * - Append approved items to public/data/observations.json
 * - If nothing approved, do nothing (quiet day)
 *
 * Notes:
 * - This script is intentionally conservative: it rejects most items.
 * - You can later replace `approveHeuristic()` with an AI editor, if desired.
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

function sha1(input) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

/**
 * Very conservative heuristic approval.
 * Approve only "light" observational oddities; reject tragedy, violence, politics, outrage, advice, promotions.
 */
function approveHeuristic({ title, link }) {
  const t = (title || "").toLowerCase();

  // hard rejects
  const hardReject = [
    "killed", "dead", "death", "shoot", "shooting", "war", "bomb", "attack", "terror", "rape",
    "murder", "suicide", "hostage", "injured", "victim", "earthquake", "flood", "fire",
    "politic", "election", "president", "minister", "parliament", "senate", "congress",
    "opinion", "editorial", "analysis", "explainer", "why you should", "how to", "tips",
    "best", "top ", "deal", "discount", "sponsored", "promo", "buy now", "affiliate"
  ];
  if (hardReject.some(k => t.includes(k))) return { ok: false, reason: "hard_reject" };

  // "too obvious" / low-signal rejects
  const lowSignal = ["breaking", "live", "update", "highlights", "recap"];
  if (lowSignal.some(k => t.includes(k))) return { ok: false, reason: "low_signal" };

  // allow signals: weirdness / accidental civilization
  const allow = [
    "odd", "weird", "strange", "bizarre", "absurd", "of course", "apparently", "somehow",
    "unexpected", "mildly", "satisfying", "design", "prototype", "invention", "product",
    "nobody asked", "this exists"
  ];

const ok = allow.some(k => t.includes(k));
  if (!ok) {
    // fallback deterministico: 20% dei titoli "neutri" (non esplicitamente fuori manifesto)
    // Questo evita la roulette: stesso input -> stessa selezione.
    const h = parseInt(sha1(`${title || ""}|${link || ""}`).slice(0, 8), 16);
    const pass = (h % 100) < 20; // <<< 20%
    if (!pass) return { ok: false, reason: "no_clear_fit" };
  }

  // final pass: must have link
  if (!link) return { ok: false, reason: "no_link" };

  return { ok: true, reason: "approved" };
}

function microJudgmentHeuristic(title) {
  // Minimal, dry, non-explanatory nods. Keep it short and neutral.
  const options = [
    "This exists.",
    "Someone approved this.",
    "No one stopped it.",
    "And yet, here we are.",
    "Perfectly normal, apparently.",
    "Reality remains employed."
  ];
  // Deterministic pick based on hash (no randomness across runs)
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
        results.push({
          source: f.name,
          title,
          link,
          published_at: isoDate ? new Date(isoDate).toISOString() : new Date().toISOString()
        });
      }
    } catch (e) {
      // Quiet failure: just skip this feed
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

async function main() {
  const existing = loadExisting();
  const existingSet = new Set(existing.map(x => x.fingerprint).filter(Boolean));

  const collected = await fetchAll();

  // Deduplicate by fingerprint across history
  const newItems = [];
  for (const it of collected) {
    const fp = sha1(`${it.source}|${it.link}`);
    if (existingSet.has(fp)) continue;
    newItems.push({ ...it, fingerprint: fp });
  }

  // Apply manifesto-aligned filter
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
    console.log("[quiet-day] No new approved items. No changes.");
    return;
  }

  // Append and sort by published_at desc
  const merged = [...existing, ...approved].sort((a, b) => {
    const da = new Date(a.published_at).getTime();
    const db = new Date(b.published_at).getTime();
    return db - da;
  });

  save(merged);
  console.log(`[publish] Added ${approved.length} items.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
