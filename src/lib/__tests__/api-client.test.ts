import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { callAdminApi, createEntityAndReload } from '../api-client';

describe('API Client Utils', () => {
  let fetchMock: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    fetchMock.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('callAdminApi', () => {
    it('should call POST endpoint successfully', async () => {
      const mockResponse = { data: { id: 1 }, success: true };
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await callAdminApi('test-endpoint', 'POST', { name: 'Test' });

      expect(fetchMock).toHaveBeenCalledWith('/api/admin/test-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should call GET endpoint successfully', async () => {
      const mockResponse = { data: [{ id: 1 }, { id: 2 }] };
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await callAdminApi('test-endpoint', 'GET');

      expect(fetchMock).toHaveBeenCalledWith('/api/admin/test-endpoint', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle error response', async () => {
      const mockResponse = { error: 'Test error' };
      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => mockResponse
      });

      await expect(callAdminApi('test-endpoint', 'POST')).rejects.toThrow('Test error');
    });

    it('should handle error response with default message', async () => {
      const mockResponse = {};
      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => mockResponse
      });

      await expect(callAdminApi('test-endpoint', 'POST')).rejects.toThrow('Failed to POST test-endpoint');
    });

    it('should handle network error', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(callAdminApi('test-endpoint', 'POST')).rejects.toThrow('Network error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('API call error for test-endpoint:', expect.any(Error));
    });

    it('should not include body for GET requests', async () => {
      const mockResponse = { data: [] };
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      await callAdminApi('test-endpoint', 'GET');

      expect(fetchMock).toHaveBeenCalledWith('/api/admin/test-endpoint', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      });
    });

    it('should include body for POST requests', async () => {
      const mockResponse = { data: { id: 1 } };
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      await callAdminApi('test-endpoint', 'POST', { name: 'Test' });

      expect(fetchMock).toHaveBeenCalledWith('/api/admin/test-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test' }),
      });
    });
  });

  describe('createEntityAndReload', () => {
    let setDataMock: jest.Mock;

    beforeEach(() => {
      setDataMock = jest.fn();
    });

    it('should create entity and reload data successfully', async () => {
      const createResponse = { data: { id: 1 }, success: true };
      const reloadResponse = { data: [{ id: 1 }, { id: 2 }] };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => reloadResponse
        });

      await createEntityAndReload('test-endpoint', { name: 'Test' }, 'reload-endpoint', setDataMock);

      expect(fetchMock).toHaveBeenCalledWith('/api/admin/test-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test' }),
      });
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/reload-endpoint', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      });
      expect(setDataMock).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
      expect(consoleLogSpy).toHaveBeenCalledWith('Test Endpoint created successfully');
    });

    it('should handle create error', async () => {
      fetchMock.mockRejectedValue(new Error('Create error'));

      await expect(
        createEntityAndReload('test-endpoint', { name: 'Test' }, 'reload-endpoint', setDataMock)
      ).rejects.toThrow('Create error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating test-endpoint:', expect.any(Error));
    });

    it('should handle reload error', async () => {
      const createResponse = { data: { id: 1 }, success: true };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createResponse
        })
        .mockRejectedValue(new Error('Reload error'));

      await expect(
        createEntityAndReload('test-endpoint', { name: 'Test' }, 'reload-endpoint', setDataMock)
      ).rejects.toThrow('Reload error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating test-endpoint:', expect.any(Error));
    });

    it('should not call setData if reload response has no data', async () => {
      const createResponse = { data: { id: 1 }, success: true };
      const reloadResponse = { success: true };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => reloadResponse
        });

      await createEntityAndReload('test-endpoint', { name: 'Test' }, 'reload-endpoint', setDataMock);

      expect(setDataMock).not.toHaveBeenCalled();
    });

    it('should capitalize endpoint name for log message', async () => {
      const createResponse = { data: { id: 1 }, success: true };
      const reloadResponse = { data: [{ id: 1 }] };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => reloadResponse
        });

      await createEntityAndReload('player-stats', { name: 'Test' }, 'reload-endpoint', setDataMock);

      expect(consoleLogSpy).toHaveBeenCalledWith('Player Stats created successfully');
    });
  });
});
