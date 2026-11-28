import { NextResponse, type NextRequest } from 'next/server';
import { handleApiError, handleApiSuccess } from '@/lib/admin-api';
import type { ServiceResult } from './crud';
import { AdminServiceError } from './errors';

type AdminWriteService = (input: unknown) => Promise<ServiceResult>;

/**
 * Wraps an admin write service as a route handler, so every /api/admin/*
 * POST/PUT/DELETE answers the same way:
 *
 * - 200 `{ data, message, success, warnings }` on success
 * - 400 `{ error, code: 'VALIDATION_ERROR' }` for invalid input (nothing written)
 * - 404 `{ error, code: 'NOT_FOUND' }` when the row doesn't exist
 * - 500 for anything unexpected
 *
 * Auth, the CSRF Origin check and rate limiting happen before this, in
 * src/lib/supabase/middleware.ts.
 */
export function adminWriteRoute(service: AdminWriteService, successMessage: string) {
  return async function handler(request: NextRequest) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be JSON', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    try {
      const { data, warnings } = await service(body);
      return NextResponse.json({ ...handleApiSuccess(data, successMessage), warnings });
    } catch (error) {
      if (error instanceof AdminServiceError) {
        return NextResponse.json(
          { error: error.message, code: error.status === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR' },
          { status: error.status }
        );
      }
      return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
    }
  };
}
