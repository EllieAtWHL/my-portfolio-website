/**
 * @jest-environment node
 */
import type { NextRequest } from 'next/server';
import { adminWriteRoute } from '../route-handler';
import { AdminServiceError } from '../errors';

jest.mock('@/lib/admin-api', () => ({
  handleApiSuccess: (data: unknown, message: string) => ({ data, message, success: true }),
  handleApiError: (error: unknown) => ({ error: (error as Error).message, code: 'UNKNOWN_ERROR' }),
}));

const request = (body: string) => new Request('http://localhost/api/admin/matches', { method: 'POST', body }) as unknown as NextRequest;

describe('adminWriteRoute', () => {
  it('passes the parsed body to the service and returns its data and warnings', async () => {
    const service = jest.fn().mockResolvedValue({ data: [{ id: 1 }], warnings: ['careful'] });
    const response = await adminWriteRoute(service, 'Saved')(request('{"a":1}'));

    expect(service).toHaveBeenCalledWith({ a: 1 });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [{ id: 1 }], message: 'Saved', success: true, warnings: ['careful'] });
  });

  it('answers a non-JSON body with a 400, without calling the service', async () => {
    const service = jest.fn();
    const response = await adminWriteRoute(service, 'Saved')(request('not json'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Request body must be JSON', code: 'VALIDATION_ERROR' });
    expect(service).not.toHaveBeenCalled();
  });

  it.each([
    [400, 'VALIDATION_ERROR'],
    [404, 'NOT_FOUND'],
  ] as const)('passes an AdminServiceError through with status %i', async (status, code) => {
    const service = jest.fn().mockRejectedValue(new AdminServiceError('nope', status));
    const response = await adminWriteRoute(service, 'Saved')(request('{}'));

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: 'nope', code });
  });

  it('answers anything unexpected with a 500', async () => {
    const service = jest.fn().mockRejectedValue(new Error('boom'));
    const response = await adminWriteRoute(service, 'Saved')(request('{}'));

    expect(response.status).toBe(500);
  });
});
