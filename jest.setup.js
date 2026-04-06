import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Polyfill for Web APIs in Jest environment
import { TextEncoder, TextDecoder } from 'util'

// Mock Web APIs that aren't available in Node.js test environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_SUPABASE_DEV_URL = 'https://test-dev.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_DEV_ANON_KEY = 'test-dev-anon-key'
