/**
 * Weekly Amazon Objects (PA-API 5.0)
 * - Fetch 3–4 "odd but usable" objects
 * - Deduplicate by ASIN across history
 * - Append to public/data/objects.json
 *
 * Requires GitHub secrets:
 * - AMAZON_PAAPI_ACCESS_KEY
 * - AMAZON_PAAPI_SECRET_KEY
 * - AMAZON_PAAPI_PARTNER_TAG   (your Associates tag)
 * - AMAZON_PAAPI_HOST          (e.g. webservices.amazon.it)
 * - AMAZON_PAAPI_REGION        (e.g. eu-west-1)
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import https from "node:https";

const OBJECTS_PATH = path.join(process.cwd(), "public", "data", "objects.json");

const ACCESS_KEY = process.env.AMAZON_PAAPI_ACCESS_KEY;
const SECRET_KEY = process.env.AMAZON_PAAPI_SECRET_KEY;
const PARTNER_TAG = process.env.AMAZON_PAAPI_PARTNER_TAG;
const HOST = process.env.AMAZON_PAAPI_HOST || "webservices.amazon.it";
const REGION = process.env.AMAZON_PAAPI_REGION || "eu-west-1";

const MARKETPLACE = "www.amazon.it"; // keep as IT for ketogo.it

function sha1(s) {
  return crypto.createHash("sha1").update(s).digest("hex");
}

function loadObjects() {
  try {
    const raw = fs.readFileSync(OBJECTS_PATH, "utf-8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveObjects(arr) {
  fs.mkdirSync(path.dirname(OBJECTS_PATH), { recursive: true });
  fs.writeFileSync(OBJECTS_PATH, JSON.stringify(arr, null, 2) + "\n", "utf-8");
}

// Minimal “odd but usable” query set (rotated deterministically each week)
const QUERY_POOL = [
  "cucina utensile insolito",
  "organizzatore scrivania strano",
  "gadget casa intelligente semplice",
  "attrezzo manuale particolare",
  "accessorio bagno insolito",
  "luce lampada design funzionale",
  "supporto telefono scrivania strano",
  "apribottiglie insolito",
  "tagliaverdure particolare",
  "misurino cucina strano",
];

// avoid obvious junk
const TITLE_BLOCK = [
  "regalo divertente",
  "scherzo",
  "prank",
  "sexy",
  "adult",
  "costume",
  "halloween",
  "porn",
  "nft",
  "crypto",
];

function pickWeeklyQueries(count = 3) {
  // ISO week-ish: use year-week based on UTC date
  const d = new Date();
  const y = d.getUTCFullYear();
  const day = new Date(Date.UTC(y, d.getUTCMonth(), d.getUTCDate()));
  const first = new Date(Date.UTC(y, 0, 1));
  const week = Math.ceil((((day - first) / 86400000) + first.getUTCDay() + 1) / 7);

  const seed = parseInt(sha1(`${y}-W${week}`).slice(0, 8), 16);
  const picked = [];
  for (let i = 0; i < count; i++) {
    const idx = (seed + i * 101) % QUERY_POOL.length;
    picked.push(QUERY_POOL[idx]);
  }
  return picked;
}

/**
 * PA-API signing is a bit verbose; for reliability, we keep it contained.
 * This is a minimal AWS SigV4 signer for the SearchItems endpoint.
 */
function hmac(key, str, encoding = "hex") {
  return crypto.createHmac("sha256", key).update(str, "utf8").digest(encoding);
}
function hash(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}
function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = crypto.createHmac("sha256", "AWS4" + key).update(dateStamp).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(regionName).digest();
  const kService = crypto.createHmac("sha256", kRegion).update(serviceName).digest();
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
  return kSigning;
}

function paapiRequest(bodyObj) {
  return new Promise((resolve, reject) => {
    const service = "ProductAdvertisingAPI";
    const amzTarget = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";
    const endpoint = "/paapi5/searchitems";
    const method = "POST";

    const body = JSON.stringify(bodyObj);

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); // YYYYMMDD'T'HHMMSS'Z'
    const dateStamp = amzDate.slice(0, 8);

    const canonicalUri = endpoint;
    const canonicalQuerystring = "";
    const canonicalHeaders =
      `content-encoding:amz-1.0\n` +
      `content-type:application/json; charset=utf-8\n` +
      `host:${HOST}\n` +
      `x-amz-date:${amzDate}\n` +
      `x-amz-target:${amzTarget}\n`;
    const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
    const payloadHash = hash(body);

    const canonicalRequest =
      `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${REGION}/${service}/aws4_request`;
    const stringToSign =
      `${algorithm}\n${amzDate}\n${credentialScope}\n${hash(canonicalRequest)}`;

    const signingKey = getSignatureKey(SECRET_KEY, dateStamp, REGION, service);
    const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

    const authorizationHeader =
      `${algorithm} Credential=${ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const options = {
      hostname: HOST,
      path: endpoint,
      method,
      headers: {
        "content-encoding": "amz-1.0",
        "content-type": "application/json; charset=utf-8",
        "x-amz-date": amzDate,
        "x-amz-target": amzTarget,
        "Authorization": authorizationHeader,
        "host": HOST,
        "content-length": Buffer.byteLength(body),
      },
      timeout: 25000,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) return resolve(json);
          return reject(new Error(`PAAPI ${res.statusCode}: ${data.slice(0, 400)}`));
        } catch (e) {
          reject(new Error(`PAAPI parse error: ${e.message}`));
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error("PAAPI timeout"));
    });
    req.write(body);
    req.end();
  });
}

function eurPrice(item) {
  const p = item?.Offers?.Listings?.[0]?.Price?.Amount;
  return typeof p === "number" ? p : null;
}

function isGoodCandidate(item) {
  const title = (item?.ItemInfo?.Title?.DisplayValue || "").toLowerCase();
  if (!title) return false;
  if (TITLE_BLOCK.some(k => title.includes(k))) return false;

  const price = eurPrice(item);
  if (price == null) return false;
  if (price < 5 || price > 25) return false;

  return true;
}

async function main() {
  if (!ACCESS_KEY || !SECRET_KEY || !PARTNER_TAG) {
    console.log("[amazon-objects] Missing PA-API secrets. Skipping.");
    return;
  }

  const existing = loadObjects();
  const seenAsin = new Set(existing.map(x => x.asin).filter(Boolean));

  const queries = pickWeeklyQueries(3);
  const picks = [];

  for (const q of queries) {
    if (picks.length >= 4) break;

    const body = {
      Keywords: q,
      Marketplace: MARKETPLACE,
      PartnerTag: PARTNER_TAG,
      PartnerType: "Associates",
      ItemCount: 10,
      Resources: [
        "ItemInfo.Title",
        "ItemInfo.ByLineInfo",
        "ItemInfo.Features",
        "Offers.Listings.Price",
        "Images.Primary.Medium",
      ],
    };

    let resp;
    try {
      resp = await paapiRequest(body);
    } catch (e) {
      console.error("[amazon-objects] query failed:", q, e.message);
      continue;
    }

    const items = resp?.SearchResult?.Items || [];
    for (const it of items) {
      const asin = it?.ASIN;
      if (!asin || seenAsin.has(asin)) continue;
      if (!isGoodCandidate(it)) continue;

      const title = it.ItemInfo?.Title?.DisplayValue || "Untitled";
      const price = eurPrice(it);
      const img = it?.Images?.Primary?.Medium?.URL || null;

      // Use PAAPI detail page url if available; if not, fallback (still with tag)
      // Note: PAAPI often returns a DetailPageURL; keep it when present.
      const detailUrl = it?.DetailPageURL || `https://www.amazon.it/dp/${asin}/?tag=${PARTNER_TAG}`;

      picks.push({
        fingerprint: sha1(`amazon|${asin}`),
        source: "Amazon",
        asin,
        title,
        link: detailUrl,
        price_eur: price,
        image: img,
        published_at: new Date().toISOString(),
        micro_judgment: null
      });

      seenAsin.add(asin);
      if (picks.length >= 4) break;
    }
  }

  if (picks.length === 0) {
    console.log("[amazon-objects] No new objects selected. No changes.");
    return;
  }

  const merged = [...existing, ...picks].sort((a, b) => {
    const da = new Date(a.published_at).getTime();
    const db = new Date(b.published_at).getTime();
    return db - da;
  });

  saveObjects(merged);
  console.log(`[amazon-objects] Added ${picks.length} objects.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
