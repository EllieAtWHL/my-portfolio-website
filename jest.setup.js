import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Polyfill for Web APIs in Jest environment
import { TextEncoder, TextDecoder } from 'util'

// Mock Web APIs that aren't available in Node.js test environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
