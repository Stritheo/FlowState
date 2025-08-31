import { Platform, ViewStyle } from 'react-native';

interface ShadowProps {
  shadowColor?: string;
  shadowOffset?: {
    width: number;
    height: number;
  };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

interface WebShadowStyle {
  boxShadow?: string;
}

interface NativeShadowStyle {
  shadowColor?: string;
  shadowOffset?: {
    width: number;
    height: number;
  };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

export function createShadowStyle(shadowProps: ShadowProps): WebShadowStyle | NativeShadowStyle {
  if (Platform.OS === 'web') {
    // Convert to boxShadow for web
    const {
      shadowColor = '#000',
      shadowOffset = { width: 0, height: 2 },
      shadowOpacity = 0.25,
      shadowRadius = 3.84,
    } = shadowProps;

    // Convert shadowColor with opacity to RGBA
    let color = shadowColor;
    if (shadowColor.startsWith('#')) {
      // Convert hex to rgba
      const hex = shadowColor.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      color = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`;
    } else if (shadowColor.startsWith('rgba')) {
      // Already rgba, multiply alpha by shadowOpacity
      color = shadowColor.replace(/rgba\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/, (match, r, g, b, a) => {
        return `rgba(${r}, ${g}, ${b}, ${parseFloat(a) * shadowOpacity})`;
      });
    } else if (shadowColor.startsWith('rgb')) {
      // Convert rgb to rgba
      color = shadowColor.replace('rgb', 'rgba').replace(')', `, ${shadowOpacity})`);
    }

    const boxShadow = `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px ${color}`;
    
    return { boxShadow };
  } else {
    // Return original shadow props for native
    return shadowProps;
  }
}

// Helper function to merge shadow styles with other styles
export function mergeWithShadow<T extends ViewStyle>(
  baseStyle: T,
  shadowProps: ShadowProps
): T & (WebShadowStyle | NativeShadowStyle) {
  const shadowStyle = createShadowStyle(shadowProps);
  return { ...baseStyle, ...shadowStyle } as T & (WebShadowStyle | NativeShadowStyle);
}