import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'primary' | 'secondary' | 'tertiary';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const getColorType = () => {
    switch (type) {
      case 'primary':
        return 'textPrimary';
      case 'secondary':
        return 'textSecondary';
      case 'tertiary':
        return 'textTertiary';
      default:
        return 'text';
    }
  };
  
  const color = useThemeColor({ light: lightColor, dark: darkColor }, getColorType());

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'primary' ? styles.primary : undefined,
        type === 'secondary' ? styles.secondary : undefined,
        type === 'tertiary' ? styles.tertiary : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
  primary: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  secondary: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  tertiary: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    opacity: 0.8,
  },
});
