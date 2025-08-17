import { calculateFlowState, isInFlowState, getFlowStateColor, getEnergyColor, getFocusColor, getActionColor } from '../flowState';

describe('Flow State Calculations', () => {
  describe('calculateFlowState', () => {
    test('should return flow state when both energy and focus are 3-5', () => {
      expect(calculateFlowState(3, 3)).toEqual({
        state: 'flow',
        emoji: '💎',
        label: 'Flow State',
        color: 'flowActive'
      });
      
      expect(calculateFlowState(4, 5)).toEqual({
        state: 'flow',
        emoji: '💎',
        label: 'Flow State',
        color: 'flowActive'
      });
      
      expect(calculateFlowState(5, 4)).toEqual({
        state: 'flow',
        emoji: '💎',
        label: 'Flow State',
        color: 'flowActive'
      });
    });

    test('should return high energy when energy is 6-7', () => {
      expect(calculateFlowState(6, 2)).toEqual({
        state: 'high-energy',
        emoji: '⚡',
        label: 'High Energy',
        color: 'flowBuilding'
      });
      
      expect(calculateFlowState(7, 5)).toEqual({
        state: 'high-energy',
        emoji: '⚡',
        label: 'High Energy',
        color: 'flowBuilding'
      });
    });

    test('should return low energy when energy is 1-2', () => {
      expect(calculateFlowState(1, 4)).toEqual({
        state: 'low-energy',
        emoji: '💤',
        label: 'Low Energy',
        color: 'flowLow'
      });
      
      expect(calculateFlowState(2, 6)).toEqual({
        state: 'low-energy',
        emoji: '💤',
        label: 'Low Energy',
        color: 'flowLow'
      });
    });

    test('should return building focus for other combinations', () => {
      expect(calculateFlowState(3, 2)).toEqual({
        state: 'building-focus',
        emoji: '🎯',
        label: 'Building Focus',
        color: 'flowActive'
      });
      
      expect(calculateFlowState(4, 6)).toEqual({
        state: 'building-focus',
        emoji: '🎯',
        label: 'Building Focus',
        color: 'flowActive'
      });
      
      expect(calculateFlowState(5, 1)).toEqual({
        state: 'building-focus',
        emoji: '🎯',
        label: 'Building Focus',
        color: 'flowActive'
      });
    });
  });

  describe('isInFlowState', () => {
    test('should return true only when both energy and focus are 3-5', () => {
      expect(isInFlowState(3, 3)).toBe(true);
      expect(isInFlowState(4, 5)).toBe(true);
      expect(isInFlowState(5, 4)).toBe(true);
      
      expect(isInFlowState(6, 4)).toBe(false);
      expect(isInFlowState(4, 6)).toBe(false);
      expect(isInFlowState(2, 4)).toBe(false);
      expect(isInFlowState(4, 2)).toBe(false);
    });
  });

  describe('getFlowStateColor', () => {
    test('should return correct color keys', () => {
      expect(getFlowStateColor(4, 4)).toBe('flowActive'); // Flow state
      expect(getFlowStateColor(6, 4)).toBe('flowBuilding'); // High energy
      expect(getFlowStateColor(2, 4)).toBe('flowLow'); // Low energy
      expect(getFlowStateColor(3, 6)).toBe('flowActive'); // Building focus
    });
  });

  describe('Element-specific color functions', () => {
    test('should return correct color keys for elements', () => {
      expect(getEnergyColor()).toBe('energyColor');
      expect(getFocusColor()).toBe('focusColor');
      expect(getActionColor()).toBe('actionColor');
    });
  });
});