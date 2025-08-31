import { useColorScheme as _useColorScheme } from 'react-native';
import { Platform } from 'react-native';

// This hook returns 'light' | 'dark' | null
export default function useColorScheme() {
  if (Platform.OS === 'web') {
    // For web, use media query to detect color scheme
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } catch (error) {
      console.warn('Could not detect color scheme, defaulting to light');
    }
    return 'light';
  }
  
  try {
    return _useColorScheme() || 'light';
  } catch (error) {
    console.warn('useColorScheme hook failed, defaulting to light');
    return 'light';
  }
}