import { PropsWithChildren, useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleProps extends PropsWithChildren {
  title: string;
  expanded?: boolean;
  onToggle?: () => void;
  summary?: string;
}

export function Collapsible({ children, title, expanded, onToggle, summary }: CollapsibleProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const theme = useColorScheme() ?? 'light';
  
  const isOpen = expanded !== undefined ? expanded : internalIsOpen;
  
  const rotateAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  const heightAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  const opacityAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  
  const handleToggle = onToggle || (() => setInternalIsOpen((value) => !value));

  useEffect(() => {
    // Animate rotation
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate content visibility
    if (isOpen) {
      Animated.parallel([
        Animated.timing(heightAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(heightAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isOpen]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <ThemedView>
      <TouchableOpacity
        style={styles.heading}
        onPress={handleToggle}
        activeOpacity={0.8}>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <IconSymbol
            name="chevron.right"
            size={18}
            weight="medium"
            color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
          />
        </Animated.View>

        <ThemedText type="defaultSemiBold" style={styles.title}>{title}</ThemedText>
      </TouchableOpacity>
      
      {!isOpen && summary && (
        <ThemedView style={[
          styles.summaryContainer,
          { backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)' }
        ]}>
          <ThemedText style={styles.summaryText}>{summary}</ThemedText>
        </ThemedView>
      )}
      
      <Animated.View
        style={[
          styles.content,
          {
            maxHeight: heightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1000], // Large enough value to accommodate content
            }),
            opacity: opacityAnim,
            overflow: 'hidden',
          },
        ]}
      >
        <ThemedView>{children}</ThemedView>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  title: {
    flex: 1,
  },
  summaryContainer: {
    marginLeft: 24,
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
});
