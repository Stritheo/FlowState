import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, StyleSheet, Alert, Share } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from '../constants/Colors';
import useColorScheme from '@/hooks/useColorScheme';
import logger, { LogEntry } from '../utils/logger';

interface DebugLoggerProps {
  visible: boolean;
  onClose: () => void;
}

export function DebugLogger({ visible, onClose }: DebugLoggerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LogEntry['level'] | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<LogEntry['category'] | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);

  // Update logs periodically
  useEffect(() => {
    if (!visible) return;

    const updateLogs = () => {
      const newLogs = logger.getLogs(
        selectedCategory === 'all' ? undefined : selectedCategory,
        selectedLevel === 'all' ? undefined : selectedLevel,
        undefined,
        100 // Limit to last 100 logs
      );
      setLogs(newLogs);
    };

    updateLogs();
    const interval = setInterval(updateLogs, 1000); // Update every second

    return () => clearInterval(interval);
  }, [visible, selectedLevel, selectedCategory]);

  const clearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            logger.clearLogs();
            setLogs([]);
          }
        }
      ]
    );
  };

  const exportLogs = async () => {
    try {
      const exportData = logger.exportLogs(
        selectedCategory === 'all' ? undefined : selectedCategory,
        selectedLevel === 'all' ? undefined : selectedLevel
      );
      
      await Share.share({
        message: exportData,
        title: 'FlowState Debug Logs'
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export logs');
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return '#ef4444';
      case 'warn': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'debug': return '#6b7280';
      default: return colors.textPrimary;
    }
  };

  const getCategoryColor = (category: LogEntry['category']) => {
    switch (category) {
      case 'scroll': return '#10b981';
      case 'ui': return '#8b5cf6';
      case 'data': return '#f59e0b';
      case 'interaction': return '#3b82f6';
      case 'navigation': return '#ef4444';
      default: return colors.textSecondary;
    }
  };

  const renderLogEntry = (log: LogEntry, index: number) => (
    <View key={index} style={[styles.logEntry, { borderBottomColor: colors.border }]}>
      <View style={styles.logHeader}>
        <ThemedText style={[styles.timestamp, { color: colors.textTertiary }]}>
          {new Date(log.timestamp).toLocaleTimeString()}
        </ThemedText>
        <View style={styles.logBadges}>
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor(log.level) }]}>
            <ThemedText style={styles.badgeText}>{log.level.toUpperCase()}</ThemedText>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(log.category) }]}>
            <ThemedText style={styles.badgeText}>{log.category}</ThemedText>
          </View>
          {log.component && (
            <View style={[styles.componentBadge, { backgroundColor: colors.textTertiary }]}>
              <ThemedText style={styles.badgeText}>{log.component}</ThemedText>
            </View>
          )}
        </View>
      </View>
      
      <ThemedText style={[styles.logMessage, { color: colors.textPrimary }]}>
        {log.message}
      </ThemedText>
      
      {log.data && (
        <View style={[styles.logData, { backgroundColor: colors.border + '20' }]}>
          <ThemedText style={[styles.logDataText, { color: colors.textSecondary }]}>
            {JSON.stringify(log.data, null, 2)}
          </ThemedText>
        </View>
      )}
      
      {log.stackTrace && (
        <View style={[styles.logStack, { backgroundColor: '#fef2f2' }]}>
          <ThemedText style={[styles.logStackText, { color: '#dc2626' }]}>
            {log.stackTrace}
          </ThemedText>
        </View>
      )}
    </View>
  );

  const stats = logger.getLogStats();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.title}>Debug Logger</ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText style={[styles.closeText, { color: colors.textPrimary }]}>✕</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={[styles.stats, { backgroundColor: colors.cardBackground }]}>
          <ThemedText style={[styles.statsText, { color: colors.textSecondary }]}>
            Total: {stats.total} | Errors: {stats.byLevel.error || 0} | Warnings: {stats.byLevel.warn || 0} | 
            Scroll: {stats.byCategory.scroll || 0} | UI: {stats.byCategory.ui || 0}
          </ThemedText>
        </View>

        {/* Filters */}
        <View style={[styles.filters, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.filterRow}>
            <ThemedText style={[styles.filterLabel, { color: colors.textPrimary }]}>Level:</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
              {['all', 'error', 'warn', 'info', 'debug'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.filterChip,
                    { backgroundColor: selectedLevel === level ? colors.tint : colors.border },
                  ]}
                  onPress={() => setSelectedLevel(level as LogEntry['level'] | 'all')}
                >
                  <ThemedText
                    style={[
                      styles.filterChipText,
                      { color: selectedLevel === level ? '#FFFFFF' : colors.textPrimary }
                    ]}
                  >
                    {level}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <ThemedText style={[styles.filterLabel, { color: colors.textPrimary }]}>Category:</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
              {['all', 'scroll', 'ui', 'data', 'interaction', 'navigation', 'general'].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterChip,
                    { backgroundColor: selectedCategory === category ? colors.tint : colors.border },
                  ]}
                  onPress={() => setSelectedCategory(category as LogEntry['category'] | 'all')}
                >
                  <ThemedText
                    style={[
                      styles.filterChipText,
                      { color: selectedCategory === category ? '#FFFFFF' : colors.textPrimary }
                    ]}
                  >
                    {category}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.actions, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={exportLogs}
          >
            <ThemedText style={styles.actionButtonText}>Export Logs</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
            onPress={clearLogs}
          >
            <ThemedText style={styles.actionButtonText}>Clear Logs</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Logs */}
        <ScrollView 
          style={styles.logsList}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={true}
        >
          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                No logs match the current filters
              </ThemedText>
            </View>
          ) : (
            logs.map((log, index) => renderLogEntry(log, index))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  stats: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filters: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 80,
  },
  filterOptions: {
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logsList: {
    flex: 1,
  },
  logEntry: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
  logBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  componentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  logData: {
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  logDataText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  logStack: {
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  logStackText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
});