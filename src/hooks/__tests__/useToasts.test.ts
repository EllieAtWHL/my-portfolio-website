import { act, renderHook } from '@testing-library/react';
import { useToasts } from '../useToasts';

describe('useToasts', () => {
  it('starts with no toasts', () => {
    const { result } = renderHook(() => useToasts());
    expect(result.current.toasts).toEqual([]);
  });

  it('stacks toasts rather than replacing the previous one', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.push('Attacking K of hearts for 10 damage');
    });
    act(() => {
      result.current.push('K of hearts is attacking for 15', 'error');
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0]).toMatchObject({ text: 'Attacking K of hearts for 10 damage', tone: 'info' });
    expect(result.current.toasts[1]).toMatchObject({ text: 'K of hearts is attacking for 15', tone: 'error' });
  });

  it('defaults to the info tone and a 3000ms duration', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.push('Healing 2 cards from the discard pile');
    });

    expect(result.current.toasts[0]).toMatchObject({ tone: 'info', duration: 3000 });
  });

  it('assigns each pushed toast a distinct, stable id', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.push('first');
      result.current.push('second');
    });

    const [first, second] = result.current.toasts;
    expect(first.id).not.toEqual(second.id);
  });

  it('removes only the dismissed toast', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.push('first');
      result.current.push('second');
    });
    const idToRemove = result.current.toasts[0].id;

    act(() => {
      result.current.dismiss(idToRemove);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].text).toBe('second');
  });
});
