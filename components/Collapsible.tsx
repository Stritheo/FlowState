import { PropsWithChildren, useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';


interface CollapsibleProps extends PropsWithChildren {
  title: string;
  expanded?: boolean;
  onToggle?: () => void;
  summary?: string;
}

export function Collapsible({ children, title, expanded, onToggle, summary }: CollapsibleProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const theme = useColorScheme() ?? 'light';
  
  useEffect(() => {
    if (expanded !== undefined) {
      setInternalIsOpen(expanded);
    }
  }, [expanded]);
  
  const isOpen = expanded !== undefined ? expanded : internalIsOpen;
  const handleToggle = onToggle || (() => setInternalIsOpen((value) => !value));

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
      
      {!isOpen && summary && (
        <ThemedView style={[
          styles.summaryContainer,
          { backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)' }
        ]}>
          <ThemedText style={styles.summaryText}>{summary}</ThemedText>
        </ThemedView>
      )}
      
      {isOpen && (
        <ThemedView style={styles.content}>
          {children}
        </ThemedView>
      )}
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
