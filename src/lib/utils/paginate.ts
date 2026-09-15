import type { PostgrestError } from '@supabase/supabase-js';

// Pages through a Supabase query past PostgREST's 1000-row-per-request cap, which
// silently truncates (rather than erroring on) a plain select() over a table that's
// grown past that size - see WEB-167. Generic over the query itself (via a
// from/to-driven fetchPage callback) so it works with either the public `supabase`
// client or the admin `supabaseAdmin` one, and over whatever row shape the caller's
// query selects.
//
// Not safe under concurrent writes to the table being paged: .range() is plain
// OFFSET/LIMIT, not a DB snapshot or keyset cursor, so an insert/delete on the table
// between two page requests shifts every later row's offset - silently skipping or
// duplicating a row across that page boundary. Each call site's own ordering (e.g.
// created_at + id) only makes a *single* read's row order deterministic; it doesn't
// make separate sequential reads consistent with each other. Accepted here rather
// than switching to keyset pagination, given every /api/admin/* route this feeds is
// restricted to the single ADMIN_EMAIL account, making the write-during-read window
// this needs already-in-flight concurrent admin requests, not just concurrent users.
export async function fetchAllPaginated<T>(
  // PromiseLike, not Promise: Supabase's query builder is thenable (awaitable) but
  // isn't a real Promise instance, so passing e.g. `supabase.from(...).range(from, to)`
  // directly (the normal calling convention throughout this codebase) needs the wider type.
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>,
  pageSize = 1000
): Promise<{ data: T[]; error: PostgrestError | null }> {
  const results: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data: page, error } = await fetchPage(from, from + pageSize - 1);

    if (error) {
      return { data: results, error };
    }

    results.push(...(page ?? []));
    if (!page || page.length < pageSize) break;
  }

  return { data: results, error: null };
}
