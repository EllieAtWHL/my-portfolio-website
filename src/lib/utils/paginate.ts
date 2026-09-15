// Pages through a Supabase query past PostgREST's 1000-row-per-request cap, which
// silently truncates (rather than erroring on) a plain select() over a table that's
// grown past that size - see WEB-167. Generic over the query itself (via a
// from/to-driven fetchPage callback) so it works with either the public `supabase`
// client or the admin `supabaseAdmin` one, and over whatever row shape the caller's
// query selects.
export async function fetchAllPaginated<T>(
  // PromiseLike, not Promise: Supabase's query builder is thenable (awaitable) but
  // isn't a real Promise instance, so passing e.g. `supabase.from(...).range(from, to)`
  // directly (the normal calling convention throughout this codebase) needs the wider type.
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000
): Promise<{ data: T[]; error: { message: string } | null }> {
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
