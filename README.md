
KETOGO — Automation A (Scheduler)

What this does:
- Adds a daily scheduler (pg_cron)
- Calls fetch-rss once per day
- Supports quiet days (no new content)
- Logs each run

How to use:
1. Copy supabase/ into your project
2. Replace YOUR_PROJECT_ID and YOUR_SCHEDULER_SECRET
3. Run the SQL migration in Supabase
4. Deploy the Edge Function

No UI. No manual steps. Silence is a valid outcome.
