import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Admin API Utils', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let handleApiError: (error: unknown, defaultMessage?: string) => { error: string; code: string };
  let handleApiSuccess: (data: unknown, message?: string) => { data: unknown; message: string; success: boolean };
  const originalEnv = process.env;

  beforeEach(async () => {
    // Set up environment variables before importing admin-api
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    jest.resetModules();
    
    const adminApiModule = await import('../admin-api');
    handleApiError = adminApiModule.handleApiError;
    handleApiSuccess = adminApiModule.handleApiSuccess;
    
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.env = originalEnv;
    jest.resetModules();
  });

  describe('handleApiError', () => {
    it('should handle error with message', () => {
      const error = new Error('Test error');
      const result = handleApiError(error);

      expect(result).toEqual({
        error: 'Test error',
        code: 'UNKNOWN_ERROR'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Admin API error:', error);
    });

    it('should handle error with code', () => {
      const error = { message: 'Test error', code: 'TEST_ERROR' };
      const result = handleApiError(error);

      expect(result).toEqual({
        error: 'Test error',
        code: 'TEST_ERROR'
      });
    });

    it('should handle error without message', () => {
      const error = {};
      const result = handleApiError(error);

      expect(result).toEqual({
        error: 'Operation failed',
        code: 'UNKNOWN_ERROR'
      });
    });

    it('should use custom default message', () => {
      const error = new Error('Test error');
      const result = handleApiError(error, 'Custom error message');

      expect(result).toEqual({
        error: 'Test error',
        code: 'UNKNOWN_ERROR'
      });
    });

    it('should use custom default message when error has no message', () => {
      const error = {};
      const result = handleApiError(error, 'Custom error message');

      expect(result).toEqual({
        error: 'Custom error message',
        code: 'UNKNOWN_ERROR'
      });
    });

    it('should handle null error', () => {
      const result = handleApiError(null);

      expect(result).toEqual({
        error: 'Operation failed',
        code: 'UNKNOWN_ERROR'
      });
    });

    it('should handle string error', () => {
      const result = handleApiError('String error');

      expect(result).toEqual({
        error: 'Operation failed',
        code: 'UNKNOWN_ERROR'
      });
    });
  });

  describe('handleApiSuccess', () => {
    it('should handle success with data', () => {
      const data = { id: 1, name: 'Test' };
      const result = handleApiSuccess(data);

      expect(result).toEqual({
        data,
        message: 'Operation successful',
        success: true
      });
    });

    it('should handle success with custom message', () => {
      const data = { id: 1, name: 'Test' };
      const result = handleApiSuccess(data, 'Custom success message');

      expect(result).toEqual({
        data,
        message: 'Custom success message',
        success: true
      });
    });

    it('should handle success with null data', () => {
      const result = handleApiSuccess(null);

      expect(result).toEqual({
        data: null,
        message: 'Operation successful',
        success: true
      });
    });

    it('should handle success with array data', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = handleApiSuccess(data);

      expect(result).toEqual({
        data,
        message: 'Operation successful',
        success: true
      });
    });
  });
});
