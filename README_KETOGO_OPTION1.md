KETOGO (Option 1) — GitHub Actions + GitHub Pages (no Supabase)

What happens daily:
- GitHub Actions runs `npm run daily:run`
- Collects from deterministic RSS feeds (same list as original project)
- Applies strict heuristic filter (conservative)
- If new approved items exist: appends to `public/data/observations.json`, commits & pushes
- Builds and deploys GitHub Pages

Setup:
1) In GitHub repo: Settings → Pages → Source: GitHub Actions
2) Add your custom domain as needed (CNAME already provided in public/CNAME)
3) The site reads content from `/data/observations.json`

Notes:
- This version intentionally rejects most items.
- Quiet days are expected.
