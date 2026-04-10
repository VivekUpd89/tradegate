alter table reviews add column if not exists checklist_hits jsonb not null default '[]'::jsonb;
alter table reviews add column if not exists checklist_misses jsonb not null default '[]'::jsonb;
alter table reviews add column if not exists guardrails jsonb not null default '[]'::jsonb;
alter table reviews add column if not exists checklist_score int not null default 0;
alter table reviews add column if not exists execution_readiness int not null default 0;
alter table reviews add column if not exists override_reason text;
alter table reviews add column if not exists override_executed boolean not null default false;