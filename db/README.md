# The profile database

One table, one row per career. The game works without it (sync codes move a
career between devices by hand); with it, every device holding the same career
converges automatically — on boot it pulls the row, merges, and pushes the
merge back, and every save schedules a debounced push.

## Why it is not bundled

IGNITE RALLY is a static, offline-first page on GitHub Pages. Pages cannot host
a database, and the database needs an account only the repository owner can
create. Everything else — the sync engine, the merge rules, the transport, the
UI — is already in the game and dormant until the two config values below are
filled in.

## Five-minute setup (Supabase free tier, or any PostgREST endpoint)

1. Create a project at supabase.com (free tier is plenty: one row per player,
   a few KB each).
2. In the SQL editor, run:

```sql
create table public.ignite_profiles (
  id         text primary key,          -- the profile's 26-char secret syncId
  data       jsonb not null,            -- the whole career snapshot
  updated_at timestamptz default now()
);

alter table public.ignite_profiles enable row level security;

-- The id IS the credential: 130 bits of randomness, generated on-device,
-- never listed, never enumerable (RLS blocks selects without an exact id
-- match only insofar as the client always queries by id — see the note on
-- the trust model below). Anyone holding a row's id may read and write that
-- row; nobody can discover ids.
create policy "sync by capability id"
  on public.ignite_profiles
  for all
  to anon
  using (true)
  with check (true);
```

3. Project Settings → API: copy the **Project URL** and the **anon public**
   key into `index.html`:

```js
window.IGNITE_SYNC = {
  url: 'https://YOURPROJECT.supabase.co',
  key: 'eyJ...anon key...',
};
```

4. Commit, deploy. The profile panel's sync section switches from
   `CLOUD OFF` to `CLOUD READY`, and careers start converging.

## The trust model, honestly

This is a **capability-id** scheme, not user authentication. A profile's
`syncId` is 26 characters (~130 bits) minted by `crypto.getRandomValues` on
the device; whoever holds it can read and write that one row. That is the
same trust model as the sync code itself — a secret you deliberately carry to
your other device — and it is the strongest model available without adding
accounts, passwords, and email to a toy racer.

What it does NOT protect against: someone you gave your sync code to can keep
writing to your row. The merge rules mean they still cannot *erase* your
progress (progression merges by best-of; see `src/sync.js`), only add to it.

With the policy above, the anon key technically permits scanning the table if
someone extracts it from the page — ids are unguessable but a full table scan
would list rows. If that matters to you, tighten reads to exact-id lookups by
replacing the policy with a Postgres function keyed on the id, or simply note
that the data at stake is rally stars.

## What travels

Everything under the profile's storage prefix (`ir-p<id>-*`): career results,
stars, credits, owned cars, per-car upgrade levels, mission medals — plus the
profile's name and colour. World-editor scenes live under the same prefix, so
they travel too, and so does the editor's DRAFT: every edit marks the row
dirty (debounced — one push per burst of strokes), so work-in-progress reaches
the database within seconds of the stroke, and a push still inside its
debounce window is flushed with a keepalive request when the tab hides or
closes. Device-wide settings (steering scheme, sensitivity,
difficulty) deliberately stay per-device: how you steer on a phone is not how
you steer at a desk.

## Merge rules (why sync can never lose a career)

Per-world results keep the best of both sides (most stars, best place,
highest score). Credits keep the max. Owned cars and upgrade levels union.
Selected car and cosmetics follow the newer save. Saved scenes union by name
(same name: the newer copy wins whole), and the editor draft is a document
too — the newer draft wins whole, never a splice of two devices' drafts.
Merging A into B and B into A yield the same career, so the order devices
come online in cannot matter — and importing the same code twice is a no-op.
