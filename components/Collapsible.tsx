import { PropsWithChildren, useState, useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Animated } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import useColorScheme from '@/hooks/useColorScheme';

interface CollapsibleProps extends PropsWithChildren {
  title: string;
  expanded?: boolean;
  onToggle?: () => void;
  summary?: string;
}

export function Collapsible({ children, title, expanded, onToggle, summary }: CollapsibleProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const theme = useColorScheme() ?? 'light';
  
  
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const summaryOpacityAnim = useRef(new Animated.Value(1)).current;
  
  const isControlled = expanded !== undefined;
  const isOpen = isControlled ? expanded : internalIsOpen;

  // Initialize animation values based on initial state
  useEffect(() => {
    if (isOpen && contentHeight > 0) {
      heightAnim.setValue(contentHeight);
      opacityAnim.setValue(1);
      summaryOpacityAnim.setValue(0);
    } else if (!isOpen) {
      heightAnim.setValue(0);
      opacityAnim.setValue(0);
      summaryOpacityAnim.setValue((summary && summary.trim().length > 0) ? 1 : 0);
    }
  }, []); // Only run on mount
  
  const handleToggle = onToggle || (() => {
    if (!isControlled) {
      setInternalIsOpen((value) => !value);
    }
  });

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(heightAnim, {
          toValue: contentHeight,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(summaryOpacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(heightAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(summaryOpacityAnim, {
          toValue: (summary && summary.trim().length > 0) ? 1 : 0,
          duration: 150,
          delay: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isOpen, contentHeight, heightAnim, opacityAnim, summaryOpacityAnim, summary]);

  const handleContentLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) {
      const wasUninitialized = contentHeight === 0;
      setContentHeight(height);
      
      // If this is the first measurement and the item should be open, set it up immediately
      if (isOpen && wasUninitialized) {
        heightAnim.setValue(height);
        opacityAnim.setValue(1);
        summaryOpacityAnim.setValue(0);
      }
    }
  };

  return (
    <ThemedView>
      <TouchableOpacity
        style={styles.heading}
        onPress={handleToggle}
        activeOpacity={0.8}>
        <IconSymbol
          name={isOpen ? "chevron.down" : "chevron.right"}
          size={18}
          weight="medium"
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
        />

        <ThemedText type="defaultSemiBold" style={styles.title}>{title}</ThemedText>
      </TouchableOpacity>
      
      {summary && summary.trim().length > 0 ? (
        <Animated.View style={{ opacity: summaryOpacityAnim }}>
          <ThemedView style={[
            styles.summaryContainer,
            { backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)' }
          ]}>
            <ThemedText style={styles.summaryText}>
              {String(summary).trim()}
            </ThemedText>
          </ThemedView>
        </Animated.View>
      ) : null}
      
      <Animated.View 
        style={[
          styles.animatedContainer,
          { 
            height: heightAnim,
            opacity: opacityAnim,
          }
        ]}
      >
        <ThemedView 
          style={styles.content}
          onLayout={handleContentLayout}
        >
          {children}
        </ThemedView>
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
  animatedContainer: {
    overflow: 'hidden',
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
});