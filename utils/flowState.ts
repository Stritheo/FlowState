export interface FlowStateResult {
  state: 'flow' | 'high-energy' | 'low-energy' | 'building-focus';
  label: string;
  color: 'flowActive' | 'flowBuilding' | 'flowLow';
}

export function getEnergyColor(): 'energyColor' {
  return 'energyColor';
}

export function getFocusColor(): 'focusColor' {
  return 'focusColor';
}

export function getActionColor(): 'actionColor' {
  return 'actionColor';
}

export function calculateFlowState(energy: number, focus: number): FlowStateResult {
  // Flow State: Both energy AND focus are in the 3-5 range
  if (energy >= 3 && energy <= 5 && focus >= 3 && focus <= 5) {
    return {
      state: 'flow',
      label: 'Flow State',
      color: 'flowActive'
    };
  }
  
  // High Energy: Energy is 6-7 (regardless of focus)
  if (energy >= 6) {
    return {
      state: 'high-energy',
      label: 'High Energy',
      color: 'flowBuilding'
    };
  }
  
  // Low Energy: Energy is 1-2 (regardless of focus)
  if (energy <= 2) {
    return {
      state: 'low-energy',
      label: 'Low Energy',
      color: 'flowLow'
    };
  }
  
  // Building Focus: All other combinations (energy 3-5 but focus outside 3-5)
  return {
    state: 'building-focus',
    label: 'Building Focus',
    color: 'flowActive'
  };
}

export function getFlowStateColor(energy: number, focus: number): 'flowActive' | 'flowBuilding' | 'flowLow' {
  return calculateFlowState(energy, focus).color;
}

export function isInFlowState(energy: number, focus: number): boolean {
  return calculateFlowState(energy, focus).state === 'flow';
}