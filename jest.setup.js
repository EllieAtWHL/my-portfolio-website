import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Polyfill for Web APIs in Jest environment
import { TextEncoder, TextDecoder } from 'util'

// Mock Web APIs that aren't available in Node.js test environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// whatwg-fetch's Response polyfill predates the Response.json() static
// method, which NextResponse.json() (used throughout middleware/route
// handlers) relies on. Without this, any test that exercises a
// NextResponse.json() call fails with "Response.json is not a function".
if (typeof Response !== 'undefined' && typeof Response.json !== 'function') {
  Response.json = (data, init = {}) => {
    const headers = new Headers(init.headers)
    headers.set('content-type', 'application/json')
    return new Response(JSON.stringify(data), { ...init, headers })
  }
}

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_SUPABASE_DEV_URL = 'https://test-dev.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_DEV_ANON_KEY = 'test-dev-anon-key'
