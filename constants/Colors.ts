/**
 * Empowering colour palette designed for personal data ownership and flow states.
 * Colours inspire confidence, clarity, and focus while maintaining accessibility.
 */

// Primary empowerment colours
const primaryEmpowerment = '#6366F1'; // Confident indigo
const primaryEmpowermentDark = '#8B5CF6'; // Rich purple

// Element-specific colours
const energyColor = '#FF7B54'; // Sunset orange for energy elements
const focusColor = '#4ECDC4'; // Mint green for focus elements
const actionColor = '#0891B2'; // Teal blue for action buttons

// Flow state colours (based on context)
const flowActive = focusColor; // Use focus color for flow state (balanced state)
const flowBuilding = energyColor; // Use energy color for high energy states
const flowLow = '#45B7D1'; // Blue for low energy/focus (1-2)

// Keep action color reference for backward compatibility
const actionTeal = actionColor;

// Neutral empowerment tones
const empowermentGrey = '#64748B'; // Professional slate
const softBackground = '#F8FAFC'; // Clean off-white
const deepBackground = '#0F172A'; // Deep professional navy

export const Colors = {
  light: {
    text: '#1E293B',
    background: softBackground,
    tint: primaryEmpowerment,
    icon: empowermentGrey,
    tabIconDefault: empowermentGrey,
    tabIconSelected: primaryEmpowerment,
    
    // Flow state colours
    flowActive: flowActive,
    flowBuilding: flowBuilding,
    flowLow: flowLow,
    
    // Action button colour
    actionTeal: actionTeal,
    
    // Element-specific colours
    energyColor: energyColor,
    focusColor: focusColor,
    actionColor: actionColor,
    
    // UI enhancement colours
    cardBackground: '#FFFFFF',
    border: '#E2E8F0',
    success: flowActive,
    warning: flowBuilding,
    error: flowLow,
    subtle: '#94A3B8',
    
    // Text contrast colors
    textPrimary: '#1E293B',      // High contrast for headers
    textSecondary: '#475569',    // Medium contrast for body text
    textTertiary: '#64748B',     // Lower contrast for labels
    textPlaceholder: '#94A3B8',  // Placeholder text
  },
  dark: {
    text: '#F1F5F9',
    background: deepBackground,
    tint: primaryEmpowermentDark,
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: primaryEmpowermentDark,
    
    // Flow state colours
    flowActive: flowActive,
    flowBuilding: flowBuilding,
    flowLow: flowLow,
    
    // Action button colour
    actionTeal: actionTeal,
    
    // Element-specific colours
    energyColor: energyColor,
    focusColor: focusColor,
    actionColor: actionColor,
    
    // UI enhancement colours
    cardBackground: '#1E293B',
    border: '#334155',
    success: '#4ECDC4',
    warning: '#FF6B6B',
    error: '#45B7D1',
    subtle: '#64748B',
    
    // Text contrast colors
    textPrimary: '#F8FAFC',      // High contrast for headers
    textSecondary: '#E2E8F0',    // Medium contrast for body text
    textTertiary: '#CBD5E1',     // Lower contrast for labels
    textPlaceholder: '#94A3B8',  // Placeholder text
  },
};
