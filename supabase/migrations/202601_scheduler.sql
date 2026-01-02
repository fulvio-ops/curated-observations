
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists editorial_runs (
  id bigint generated always as identity primary key,
  run_date date not null unique,
  started_at timestamptz default now(),
  finished_at timestamptz,
  collected_count int default 0,
  approved_count int default 0,
  status text
);

select cron.schedule(
  'ketogo-daily-fetch',
  '10 5 * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/fetch-rss',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SCHEDULER_SECRET'
    )
  );
  $$
);
