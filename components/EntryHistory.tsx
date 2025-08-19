import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, Text, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { Collapsible } from './Collapsible';
import { DataExport } from './DataExport';
import { databaseService, DailyEntry } from '../services/database';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { calculateFlowState, isInFlowState, getEnergyColor, getFocusColor, getActionColor } from '../utils/flowState';
import { InfoTooltip } from './InfoTooltip';
import { getGeneralScaleGuidance } from '../utils/scaleGuidance';
import { exportService, ExportOptions } from '../services/exportService';
import { formatDateShort, getWeekStart, getWeekEnd, getDateNDaysAgo, getDateNMonthsAgo } from '../utils/dateUtils';

type TimeRange = 'week' | 'month';

interface WeeklyGroup {
  weekStart: string;
  weekEnd: string;
  entries: DailyEntry[];
  isCollapsed: boolean;
}

interface EntryHistoryProps {
  onEntrySelect?: (entry: DailyEntry) => void;
}

export function EntryHistory({ onEntrySelect }: EntryHistoryProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [weeklyGroups, setWeeklyGroups] = useState<WeeklyGroup[]>([]);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const allEntries = await databaseService.getAllEntries();
      setEntries(allEntries);
      groupEntriesByWeek(allEntries);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectExport = async () => {
    try {
      // Get all entries for export
      const allEntries = await databaseService.getAllEntries();
      
      if (allEntries.length === 0) {
        Alert.alert('No Data', 'No tracking entries found to export.');
        return;
      }

      // Get date range from all entries
      const sortedEntries = allEntries.sort((a, b) => a.date.localeCompare(b.date));
      const startDate = sortedEntries[0].date;
      const endDate = sortedEntries[sortedEntries.length - 1].date;

      // Create export options for all data
      const exportOptions: ExportOptions = {
        startDate,
        endDate,
        includeNotes: false, // Don't include notes by default for privacy
        anonymize: false, // Don't anonymize by default 
        analysisFormat: true // Use analysis format for better data structure
      };

      // Export the data
      const result = await exportService.exportData(exportOptions);
      
      if (result.success && result.filePath) {
        // Share the export file
        const shared = await exportService.shareExport(result.filePath);
        if (!shared) {
          Alert.alert('Export Complete', `Data exported successfully!\nFile saved to: ${result.filePath}`);
        }
      } else {
        Alert.alert('Export Failed', result.error || 'Unable to export data');
      }
    } catch (error) {
      console.error('Direct export failed:', error);
      Alert.alert('Export Error', 'Failed to export data. Please try again.');
    }
  };

  const groupEntriesByWeek = (allEntries: DailyEntry[]) => {
    const groups: WeeklyGroup[] = [];
    
    allEntries.forEach((entry) => {
      const entryDate = new Date(entry.date);
      const weekStart = getWeekStart(entryDate);
      const weekEnd = getWeekEnd(weekStart);
      
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      let existingGroup = groups.find(g => g.weekStart === weekStartStr);
      if (!existingGroup) {
        // Preserve existing collapse state if group already exists in state
        const existingWeekGroup = weeklyGroups.find(g => g.weekStart === weekStartStr);
        existingGroup = {
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          entries: [],
          isCollapsed: existingWeekGroup?.isCollapsed ?? false
        };
        groups.push(existingGroup);
      }
      
      existingGroup.entries.push(entry);
    });
    
    groups.forEach(group => {
      group.entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    
    // Sort groups by week start date (most recent first)
    groups.sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
    
    setWeeklyGroups(groups);
  };

  const toggleWeekCollapse = (weekStart: string) => {
    setWeeklyGroups(prev => 
      prev.map(group => 
        group.weekStart === weekStart 
          ? { ...group, isCollapsed: !group.isCollapsed }
          : group
      )
    );
  };

  const getFilteredEntries = () => {
    const startDate = timeRange === 'week' 
      ? getDateNDaysAgo(7)
      : getDateNMonthsAgo(1);
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate;
    });
  };

  const calculateSummaryStats = () => {
    const filteredEntries = getFilteredEntries();
    
    if (filteredEntries.length === 0) {
      return {
        avgEnergy: 0,
        avgFocus: 0,
        flowPercentage: 0,
        totalDays: 0
      };
    }
    
    const totalEnergy = filteredEntries.reduce((sum, entry) => sum + entry.energy_level, 0);
    const totalFocus = filteredEntries.reduce((sum, entry) => sum + entry.focus_level, 0);
    const flowDays = filteredEntries.filter(entry => 
      isInFlowState(entry.energy_level, entry.focus_level)
    ).length;
    
    return {
      avgEnergy: Number((totalEnergy / filteredEntries.length).toFixed(1)),
      avgFocus: Number((totalFocus / filteredEntries.length).toFixed(1)),
      flowPercentage: Math.round((flowDays / filteredEntries.length) * 100),
      totalDays: filteredEntries.length
    };
  };

  const formatDate = formatDateShort;

  const generateWeeklySummary = (entries: DailyEntry[]) => {
    if (entries.length === 0) return '';
    
    const avgEnergy = (entries.reduce((sum, entry) => sum + entry.energy_level, 0) / entries.length).toFixed(1);
    const avgFocus = (entries.reduce((sum, entry) => sum + entry.focus_level, 0) / entries.length).toFixed(1);
    const flowDays = entries.filter(entry => isInFlowState(entry.energy_level, entry.focus_level)).length;
    
    return `${entries.length} entries • Avg Energy: ${avgEnergy} • Avg Focus: ${avgFocus} • Flow Days: ${flowDays}`;
  };

  const getEnergyColorForLevel = (energy: number, focus: number) => {
    return colors[getEnergyColor()];
  };

  const getFocusColorForLevel = (energy: number, focus: number) => {
    return colors[getFocusColor()];
  };

  const getWeeklyTrends = () => {
    const filteredEntries = getFilteredEntries();
    if (filteredEntries.length === 0) return { weeklyData: [], correlation: null };
    
    const dataLength = timeRange === 'week' ? 7 : 30;
    const trendData = filteredEntries.slice(0, dataLength).reverse();
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 80;
    const maxBarHeight = 80;
    
    const weeklyData = trendData.map((entry, index) => {
      const energyHeight = (entry.energy_level / 10) * maxBarHeight;
      const focusHeight = (entry.focus_level / 10) * maxBarHeight;
      const flowStateResult = calculateFlowState(entry.energy_level, entry.focus_level);
      const isFlowState = flowStateResult.state === 'flow';
      
      return {
        date: new Date(entry.date).getDate(),
        dayName: new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' }),
        energy: entry.energy_level,
        focus: entry.focus_level,
        energyHeight,
        focusHeight,
        isFlowState,
        x: (index / Math.max(trendData.length - 1, 1)) * chartWidth,
      };
    });

    const energyLevels = filteredEntries.map(e => e.energy_level);
    const focusLevels = filteredEntries.map(e => e.focus_level);
    const correlation = calculateCorrelation(energyLevels, focusLevels);
    
    return { weeklyData, correlation };
  };

  const calculateCorrelation = (x: number[], y: number[]) => {
    if (x.length !== y.length || x.length === 0) return null;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);
    
    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return isNaN(correlation) ? null : correlation;
  };

  const renderTimeRangeSelector = () => {
    const stats = calculateSummaryStats();
    
    return (
      <View style={[styles.timeRangeContainer, { backgroundColor: colors.cardBackground }]}>
        <View style={[styles.timeRangeTabs, { backgroundColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.timeRangeTab,
              timeRange === 'week' && styles.timeRangeTabActive,
              { backgroundColor: timeRange === 'week' ? colors[getActionColor()] : 'transparent' }
            ]}
            onPress={() => setTimeRange('week')}
          >
            <ThemedText style={[
              styles.timeRangeTabText,
              { color: timeRange === 'week' ? '#FFFFFF' : colors.textPrimary },
              timeRange === 'week' && styles.timeRangeTabTextActive
            ]}>
              Week
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeRangeTab,
              timeRange === 'month' && styles.timeRangeTabActive,
              { backgroundColor: timeRange === 'month' ? colors[getActionColor()] : 'transparent' }
            ]}
            onPress={() => setTimeRange('month')}
          >
            <ThemedText style={[
              styles.timeRangeTabText,
              { color: timeRange === 'month' ? '#FFFFFF' : colors.textPrimary },
              timeRange === 'month' && styles.timeRangeTabTextActive
            ]}>
              Month
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: colors.textPrimary }]}>{stats.avgEnergy}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Energy</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: colors.textPrimary }]}>{stats.avgFocus}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Focus</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: colors.textPrimary }]}>{stats.flowPercentage}%</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Flow</ThemedText>
          </View>
        </View>
      </View>
    );
  };

  const renderTrendChart = () => {
    const { weeklyData, correlation } = getWeeklyTrends();
    
    if (weeklyData.length === 0) return null;

    return (
      <View style={[styles.trendsSection, { backgroundColor: colors.cardBackground }]}>
        <ThemedText style={[styles.trendsTitle, { color: colors.textPrimary }]}>{timeRange === 'week' ? 'Weekly' : 'Monthly'} Trends</ThemedText>
        
        {/* Energy/Focus Pattern Chart */}
        <View style={styles.chartContainer}>
          <ThemedText style={[styles.chartTitle, { color: colors.textPrimary }]}>State Patterns</ThemedText>
          <View style={styles.chartHeader}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors[getEnergyColor()] }]} />
              <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>Energy</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors[getFocusColor()] }]} />
              <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>Focus</ThemedText>
            </View>
          </View>
          
          <View style={styles.chart}>
            {weeklyData.map((day, index) => (
              <View key={index} style={styles.barGroup}>
                <View style={styles.bars}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: day.energyHeight, 
                        backgroundColor: colors[getEnergyColor()],
                        marginRight: 2 
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: day.focusHeight, 
                        backgroundColor: colors[getFocusColor()] 
                      }
                    ]} 
                  />
                </View>
                <ThemedText style={[styles.dayLabel, { color: colors.textTertiary }]}>{day.dayName}</ThemedText>
                {calculateFlowState(day.energy, day.focus).state === 'flow' && (
                  <ThemedText style={styles.flowIndicator}>💎</ThemedText>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Flow State Calendar */}
        <View style={styles.calendarContainer}>
          <ThemedText style={[styles.calendarTitle, { color: colors.textPrimary }]}>Days in Flow</ThemedText>
          <ThemedText style={[styles.flowStateSummary, { color: colors.textSecondary }]}>
            {weeklyData.filter(day => calculateFlowState(day.energy, day.focus).state === 'flow').length} days this {timeRange}
          </ThemedText>
          <View style={styles.calendar}>
            {weeklyData.map((day, index) => (
              <View 
                key={index} 
                style={[
                  styles.calendarDay,
                  {
                    backgroundColor: (() => {
                      const flowState = calculateFlowState(day.energy, day.focus);
                      return colors[flowState.color] + '40';
                    })()
                  }
                ]}
              >
                <ThemedText style={[styles.calendarDayText, { color: colors.textPrimary }]}>{day.date}</ThemedText>
                <ThemedText style={styles.calendarDayEmoji}>
                  {calculateFlowState(day.energy, day.focus).emoji}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Correlation Display */}
        {correlation !== null && (
          <View style={styles.correlationContainer}>
            <ThemedText style={[styles.correlationTitle, { color: colors.textPrimary }]}>Energy-Focus Correlation</ThemedText>
            <View style={[styles.correlationBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.correlationFill,
                  { 
                    width: `${Math.abs(correlation) * 100}%`,
                    backgroundColor: correlation > 0.3 
                      ? colors.flowActive 
                      : correlation < -0.3 
                      ? colors.flowLow 
                      : colors.flowBuilding
                  }
                ]} 
              />
            </View>
            <ThemedText style={[styles.correlationText, { color: colors.textSecondary }]}>
              {correlation > 0.3 
                ? '💪 Strong positive pattern' 
                : correlation < -0.3 
                ? '⚡ Inverse relationship'
                : '🔄 Variable pattern'}
            </ThemedText>
          </View>
        )}
      </View>
    );
  };

  // Animate entries when loaded
  useEffect(() => {
    if (!isLoading && entries.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, entries.length]);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: colors.textPrimary }]}>Entry History</ThemedText>
        </View>
        <ThemedText style={styles.loadingText}>Loading entries...</ThemedText>
      </ThemedView>
    );
  }

  if (entries.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: colors.textPrimary }]}>Entry History</ThemedText>
        </View>
        <ThemedText style={styles.emptyText}>No entries yet. Start tracking your daily clarity!</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 36) }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title}>Entry History</ThemedText>
        </View>
        <View style={styles.headerInfo}>
          <InfoTooltip 
            title={getGeneralScaleGuidance().title}
            content={getGeneralScaleGuidance().content}
            size={18}
          />
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{
          paddingBottom: 140 + (insets.bottom || 20)
        }}
        showsVerticalScrollIndicator={false}
      >
        {renderTimeRangeSelector()}
        {renderTrendChart()}
        
        {weeklyGroups.map((group, groupIndex) => (
          <Animated.View 
            key={group.weekStart}
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Collapsible
              title={`Week of ${formatDate(group.weekStart)} - ${formatDate(group.weekEnd)}`}
              expanded={!group.isCollapsed}
              onToggle={() => toggleWeekCollapse(group.weekStart)}
              summary={generateWeeklySummary(group.entries)}
            >
              {group.entries.map((entry, entryIndex) => (
                <TouchableOpacity
                  key={entry.id}
                  style={[
                    styles.entryCard,
                    { 
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      shadowColor: colors.text,
                      marginBottom: entryIndex === group.entries.length - 1 ? 0 : 12,
                    }
                  ]}
                  onPress={() => onEntrySelect?.(entry)}
                >
                  <View style={styles.entryHeader}>
                    <ThemedText style={[styles.entryDate, { color: colors.textPrimary }]}>{formatDate(entry.date)}</ThemedText>
                  </View>
                  
                  <View style={styles.levelsContainer}>
                    <View style={styles.levelItem}>
                      <ThemedText style={[styles.levelLabel, { color: colors.textTertiary }]}>Energy</ThemedText>
                      <View style={[styles.levelBadge, { backgroundColor: getEnergyColorForLevel(entry.energy_level, entry.focus_level) }]}>
                        <ThemedText style={styles.levelValue}>{entry.energy_level}</ThemedText>
                      </View>
                    </View>
                    
                    <View style={styles.levelItem}>
                      <ThemedText style={[styles.levelLabel, { color: colors.textTertiary }]}>Focus</ThemedText>
                      <View style={[styles.levelBadge, { backgroundColor: getFocusColorForLevel(entry.energy_level, entry.focus_level) }]}>
                        <ThemedText style={styles.levelValue}>{entry.focus_level}</ThemedText>
                      </View>
                    </View>
                  </View>

                  {entry.notes && entry.notes.trim() && (
                    <View style={styles.notesContainer}>
                      <ThemedText style={styles.notesLabel}>Notes:</ThemedText>
                      <ThemedText style={[styles.entryNotes, { color: colors.textSecondary }]} numberOfLines={3}>
                        {entry.notes.trim()}
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </Collapsible>
          </Animated.View>
        ))}
      </ScrollView>
      
      {/* Floating Export Button */}
      <View style={[
        styles.floatingButtonContainer, 
        { 
          paddingBottom: Math.max((insets.bottom || 0) + 20, 100),
          marginBottom: 0
        }
      ]}>
        <Animated.View style={{ transform: [{ scale: fadeAnim }] }}>
          <TouchableOpacity
            style={[
              styles.floatingExportButton,
              { backgroundColor: colors[getActionColor()] }
            ]}
            onPress={() => {
              Animated.sequence([
                Animated.timing(fadeAnim, {
                  toValue: 0.95,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 100,
                  useNativeDriver: true,
                }),
              ]).start();
              
              // Show action sheet for export options
              Alert.alert(
                'Export Data',
                'Choose export option:',
                [
                  {
                    text: 'Quick Export (All Data)',
                    onPress: handleDirectExport,
                  },
                  {
                    text: 'Advanced Export...',
                    onPress: () => setShowExport(true),
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                ],
                { cancelable: true }
              );
            }}
          >
            <Text style={[styles.floatingExportButtonText, { color: '#FFFFFF' }]}>📊 Export Data</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      <Modal
        visible={showExport}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <DataExport onClose={() => setShowExport(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 40,
  },
  headerInfo: {
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 998,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(248, 250, 252, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.5)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingExportButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingExportButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  entryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  entryHeader: {
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  levelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  levelItem: {
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  levelValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.7,
  },
  entryNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  trendsSection: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  trendsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContainer: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
    paddingBottom: 10,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 12,
    borderRadius: 6,
    minHeight: 8,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  flowIndicator: {
    fontSize: 12,
    marginTop: 2,
  },
  calendarContainer: {
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  flowStateSummary: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  calendar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calendarDay: {
    width: 40,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarDayEmoji: {
    fontSize: 16,
    marginTop: 2,
  },
  correlationContainer: {
    alignItems: 'center',
  },
  correlationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  correlationBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  correlationFill: {
    height: '100%',
    borderRadius: 4,
  },
  correlationText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  timeRangeContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  timeRangeTabs: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  timeRangeTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  timeRangeTabActive: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeRangeTabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeRangeTabTextActive: {
    color: '#FFFFFF',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});