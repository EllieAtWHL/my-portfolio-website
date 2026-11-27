import { test, expect, type APIRequestContext } from '@playwright/test';

// Public read-only MCP server (WEB-249). Pure HTTP - no browser involved - so it
// runs once rather than per browser project. Kept to a handful of calls: the
// endpoint is rate-limited (in-memory, per IP) and this suite shares that
// budget with any other run against the same server.

// MCP responds over Streamable HTTP, which may frame a single JSON-RPC
// response as a server-sent event; accept either framing.
async function rpc(request: APIRequestContext, method: string, params: Record<string, unknown> = {}) {
  const response = await request.post('/spurs-women/mcp', {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': '2025-06-18',
    },
    data: { jsonrpc: '2.0', id: 1, method, params },
  });
  expect(response.status()).toBe(200);

  const body = await response.text();
  const dataLine = body.split('\n').find((line) => line.startsWith('data: '));
  return JSON.parse(dataLine ? dataLine.slice('data: '.length) : body);
}

test.describe('Spurs Women MCP server', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'HTTP-only checks run once, in the chromium project');

  test('initializes and lists only read tools', async ({ request }) => {
    const init = await rpc(request, 'initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'playwright', version: '0' },
    });
    expect(init.result.serverInfo.name).toBe('spurs-women');

    const list = await rpc(request, 'tools/list');
    const names: string[] = list.result.tools.map((tool: { name: string }) => tool.name);

    expect(names).toEqual(expect.arrayContaining(['get_match', 'search_players', 'list_seasons', 'get_team']));
    for (const name of names) {
      expect(name).toMatch(/^(get|list|search)_/);
    }
  });

  test('answers a tool call with real data', async ({ request }) => {
    const result = await rpc(request, 'tools/call', { name: 'list_seasons', arguments: {} });

    expect(result.result.isError).toBeFalsy();
    const seasons = JSON.parse(result.result.content[0].text);
    expect(seasons.length).toBeGreaterThan(0);
    expect(seasons[0]).toEqual(expect.objectContaining({ id: expect.any(String), name: expect.any(String) }));
  });
});
