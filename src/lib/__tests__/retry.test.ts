import { retryWithBackoff } from '../retry';

describe('retryWithBackoff', () => {
  it('returns the result on the first successful attempt without retrying', async () => {
    const fn = jest.fn().mockResolvedValue('ok');

    const result = await retryWithBackoff(fn);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries after a failure and returns the result once it succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce('ok');

    const result = await retryWithBackoff(fn, { baseDelayMs: 1 });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('stops after the configured number of attempts and throws the last error', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('first'))
      .mockRejectedValueOnce(new Error('second'))
      .mockRejectedValueOnce(new Error('third'));

    await expect(retryWithBackoff(fn, { attempts: 3, baseDelayMs: 1 })).rejects.toThrow('third');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('defaults to 3 attempts when not specified', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));

    await expect(retryWithBackoff(fn, { baseDelayMs: 1 })).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('waits with exponential backoff between attempts', async () => {
    jest.useFakeTimers();
    try {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('first'))
        .mockRejectedValueOnce(new Error('second'))
        .mockResolvedValueOnce('ok');

      const promise = retryWithBackoff(fn, { attempts: 3, baseDelayMs: 100 });

      await Promise.resolve(); // let the first attempt's rejection settle
      expect(fn).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(100); // first backoff: 100ms
      expect(fn).toHaveBeenCalledTimes(2);

      await jest.advanceTimersByTimeAsync(200); // second backoff: 200ms
      expect(fn).toHaveBeenCalledTimes(3);

      await expect(promise).resolves.toBe('ok');
    } finally {
      jest.useRealTimers();
    }
  });
});
