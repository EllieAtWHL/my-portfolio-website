import { config } from '@/middleware'

describe('middleware config.matcher', () => {
  it('scopes the auth middleware to the routes that consume the session', () => {
    expect(config.matcher).toEqual([
      '/spurs-women/admin/:path*',
      '/api/admin/:path*',
      '/spurs-women/profile/:path*',
    ])
  })
})
