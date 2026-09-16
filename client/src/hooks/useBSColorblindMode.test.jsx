import { act, renderHook } from '@testing-library/react';
import useBSColorblindMode, {
  BS_COLORBLIND_STORAGE_KEY,
  readBSColorblindMode,
} from './useBSColorblindMode';

describe('useBSColorblindMode', () => {
  beforeEach(() => localStorage.clear());

  it('initializes from the persisted preference', () => {
    localStorage.setItem(BS_COLORBLIND_STORAGE_KEY, 'true');
    const { result } = renderHook(() => useBSColorblindMode());
    expect(result.current.colorblindMode).toBe(true);
    expect(readBSColorblindMode()).toBe(true);
  });

  it('persists toggles and synchronizes all mounted Battleship surfaces', () => {
    const { result } = renderHook(() => ({
      first: useBSColorblindMode(),
      second: useBSColorblindMode(),
    }));

    act(() => result.current.first.toggleColorblindMode());

    expect(result.current.first.colorblindMode).toBe(true);
    expect(result.current.second.colorblindMode).toBe(true);
    expect(localStorage.getItem(BS_COLORBLIND_STORAGE_KEY)).toBe('true');
  });
});
