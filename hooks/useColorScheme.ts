import { useColorScheme as _useColorScheme } from 'react-native';

// This hook returns 'light' | 'dark' | null
export default function useColorScheme() {
	return _useColorScheme();
}