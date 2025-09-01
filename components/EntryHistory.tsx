import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { Collapsible } from './Collapsible';
import { DataExport } from './DataExport';
import { databaseService, DailyEntry } from '../services/database';
import { Colors } from '../constants/Colors';
import useColorScheme from '@/hooks/useColorScheme';
import { calculateFlowState, isInFlowState, getActionColor } from '../utils/flowState';
import { InfoTooltip } from './InfoTooltip';
import { getGeneralScaleGuidance } from '../utils/scaleGuidance';
import { exportService, ExportOptions } from '../services/exportService';
import { formatDateShort, getDateNDaysAgo, getDateNMonthsAgo } from '../utils/dateUtils';
import { createShadowStyle } from '../utils/shadowUtils';
import { logScrollEvent, logUIInteraction, logError, logInfo } from '../utils/logger';

type TimeRange = 'week' | 'month';

interface DailyGroup {
  date: string;
  entries: DailyEntry[];
  isCollapsed: boolean;
}

interface EntryHistoryProps {
  onEntrySelect?: (entry: DailyEntry) => void;
}

export function EntryHistory({ onEntrySelect }: EntryHistoryProps) {
  const DEBUG_MODE = true;
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [dailyGroups, setDailyGroups] = useState<DailyGroup[]>([]);
  
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
      groupEntriesByDay(allEntries);
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

  const groupEntriesByDay = (allEntries: DailyEntry[]) => {
    const groups: DailyGroup[] = [];
    
    allEntries.forEach((entry) => {
      let existingGroup = groups.find(g => g.date === entry.date);
      if (!existingGroup) {
        // Preserve existing collapse state if group already exists in state
        const existingDayGroup = dailyGroups.find(g => g.date === entry.date);
        existingGroup = {
          date: entry.date,
          entries: [],
          isCollapsed: existingDayGroup?.isCollapsed ?? true // Collapsed by default
        };
        groups.push(existingGroup);
      }
      
      existingGroup.entries.push(entry);
    });
    
    groups.forEach(group => {
      // Sort entries by created_at timestamp (most recent first)
      group.entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });
    
    // Sort groups by date (most recent first)
    groups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setDailyGroups(groups);
  };

  const toggleDayCollapse = (date: string) => {
    setDailyGroups(prev => 
      prev.map(group => 
        group.date === date 
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
  
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return 'Unknown';
    }
  };

  const generateDailySummary = (entries: DailyEntry[]) => {
    if (DEBUG_MODE) console.log('[DEBUG] generateDailySummary called with entries:', entries.length);
    
    if (entries.length === 0) {
      if (DEBUG_MODE) console.log('[DEBUG] generateDailySummary returning empty string');
      return '';
    }
    
    const avgEnergy = (entries.reduce((sum, entry) => sum + entry.energy_level, 0) / entries.length).toFixed(1);
    const avgFocus = (entries.reduce((sum, entry) => sum + entry.focus_level, 0) / entries.length).toFixed(1);
    const flowEntries = entries.filter(entry => isInFlowState(entry.energy_level, entry.focus_level)).length;
    
    if (DEBUG_MODE) {
      console.log('[DEBUG] generateDailySummary variables:');
      console.log('  - entries.length:', entries.length, typeof entries.length);
      console.log('  - avgEnergy:', avgEnergy, typeof avgEnergy);
      console.log('  - avgFocus:', avgFocus, typeof avgFocus);
      console.log('  - flowEntries:', flowEntries, typeof flowEntries);
    }
    
    const summary = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} • Avg Energy: ${avgEnergy} • Avg Focus: ${avgFocus} • Flow: ${flowEntries}/${entries.length}`;
    
    if (DEBUG_MODE) {
      console.log('[DEBUG] generateDailySummary result:', summary, typeof summary);
    }
    
    return summary;
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
      
      const entryDate = new Date(entry.date);
      return {
        date: entryDate.getDate(),
        dayName: entryDate.toLocaleDateString('en-US', { weekday: 'short' }),
        monthName: entryDate.toLocaleDateString('en-US', { month: 'short' }),
        fullDate: entryDate,
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
          <View style={[styles.statCard, { backgroundColor: colors.border + '20' }]}>
            <ThemedText style={[styles.statValue, { color: colors.textPrimary }]}>{stats.avgEnergy || 0}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Energy</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.border + '20' }]}>
            <ThemedText style={[styles.statValue, { color: colors.textPrimary }]}>{stats.avgFocus || 0}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Focus</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.border + '20' }]}>
            <ThemedText style={[styles.statValue, { color: colors.textPrimary }]}>{stats.flowPercentage || 0}%</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Flow %</ThemedText>
          </View>
        </View>
      </View>
    );
  };

  const renderLineChart = (data: any[], width: number) => {
    if (data.length === 0) return null;
    
    const chartHeight = 280;
    const paddingTop = 20;
    const paddingBottom = 40;
    const paddingX = 20;
    const actualChartHeight = chartHeight - paddingTop - paddingBottom;
    
    // Calculate positions for line chart
    const maxValue = 7;
    const minValue = 1;
    const range = maxValue - minValue;
    
    const energyPoints = data.map((point, index) => ({
      x: paddingX + (index / Math.max(data.length - 1, 1)) * (width - 2 * paddingX),
      y: paddingTop + ((maxValue - (point.energy + 0.1)) / range) * actualChartHeight
    }));
    
    const focusPoints = data.map((point, index) => ({
      x: paddingX + (index / Math.max(data.length - 1, 1)) * (width - 2 * paddingX),
      y: paddingTop + ((maxValue - (point.focus - 0.1)) / range) * actualChartHeight
    }));
    
    
    return (
      <View style={[styles.lineChart, { width, height: chartHeight }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          {[7, 6, 5, 4, 3, 2, 1].map(value => (
            <ThemedText key={value} style={[styles.yAxisLabel, { color: colors.textTertiary }]}>
              {value}
            </ThemedText>
          ))}
        </View>
        
        {/* Chart area */}
        <View style={[styles.chartArea, { width: width - 40, height: chartHeight }]}>
          {/* Grid lines */}
          <View style={styles.gridLines}>
            {[7, 6, 5, 4, 3, 2, 1].map(value => (
              <View 
                key={value} 
                style={[
                  styles.gridLine, 
                  { 
                    backgroundColor: colors.border + '40',
                    top: paddingTop + ((maxValue - value) / range) * actualChartHeight 
                  }
                ]} 
              />
            ))}
          </View>
          
          {/* Data points and lines */}
          <View style={styles.dataOverlay}>
            {/* Energy line */}
            {energyPoints.length > 1 && energyPoints.map((point, index) => {
              if (index === energyPoints.length - 1) return null;
              const nextPoint = energyPoints[index + 1];
              const lineLength = Math.sqrt(Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2));
              const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;
              
              return (
                <View
                  key={`energy-line-${index}`}
                  style={[
                    styles.chartLine,
                    {
                      position: 'absolute',
                      left: point.x,
                      top: point.y,
                      width: lineLength,
                      backgroundColor: '#FF9500',
                      transform: [{ rotate: `${angle}deg` }],
                    }
                  ]}
                />
              );
            })}
            
            {/* Focus line */}
            {focusPoints.length > 1 && focusPoints.map((point, index) => {
              if (index === focusPoints.length - 1) return null;
              const nextPoint = focusPoints[index + 1];
              const lineLength = Math.sqrt(Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2));
              const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;
              
              return (
                <View
                  key={`focus-line-${index}`}
                  style={[
                    styles.chartLine,
                    {
                      position: 'absolute',
                      left: point.x,
                      top: point.y,
                      width: lineLength,
                      backgroundColor: '#0891B2',
                      transform: [{ rotate: `${angle}deg` }],
                    }
                  ]}
                />
              );
            })}
            
            {/* Energy points */}
            {energyPoints.map((point, index) => (
              <View
                key={`energy-point-${index}`}
                style={[
                  styles.dataPoint,
                  {
                    position: 'absolute',
                    left: point.x - 4,
                    top: point.y - 4,
                    backgroundColor: '#FF9500',
                  }
                ]}
              />
            ))}
            
            {/* Focus points */}
            {focusPoints.map((point, index) => (
              <View
                key={`focus-point-${index}`}
                style={[
                  styles.dataPoint,
                  {
                    position: 'absolute',
                    left: point.x - 4,
                    top: point.y - 4,
                    backgroundColor: '#0891B2',
                  }
                ]}
              />
            ))}
            
            {/* Flow state diamonds */}
            {data.map((day, index) => {
              if (!day.isFlowState) return null;
              const x = paddingX + (index / Math.max(data.length - 1, 1)) * (width - 2 * paddingX);
              return (
                <ThemedText
                  key={`diamond-${index}`}
                  style={[
                    styles.flowDiamond,
                    {
                      position: 'absolute',
                      left: x - 8,
                      top: chartHeight - 50,
                      color: colors.flowActive,
                    }
                  ]}
                >
                  ◆
                </ThemedText>
              );
            })}
          </View>
          
          {/* X-axis labels */}
          <View style={[styles.xAxisLabels, { top: chartHeight - 25 }]}>
            {data.map((day, index) => {
              const x = paddingX + (index / Math.max(data.length - 1, 1)) * (width - 2 * paddingX);
              return (
                <ThemedText
                  key={`x-label-${index}`}
                  style={[
                    styles.xAxisLabel,
                    {
                      position: 'absolute',
                      left: x - 20,
                      color: colors.textTertiary,
                    }
                  ]}
                >
                  {timeRange === 'week' ? (day.dayName || '') : (day.date ? String(day.date) : '')}
                </ThemedText>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderTrendChart = () => {
    const { weeklyData, correlation } = getWeeklyTrends();
    
    if (weeklyData.length === 0) return null;
    
    // Calculate chart width for horizontal scrolling
    const screenWidth = Dimensions.get('window').width;
    const dayWidth = 44; // 40px + 4px margins
    const chartWidth = timeRange === 'month' ? weeklyData.length * dayWidth : screenWidth - 80;
    const snapInterval = screenWidth * 0.75; // Show ~1.5 weeks at a time

    return (
      <View style={[styles.trendsSection, { backgroundColor: colors.cardBackground }]}>
        <ThemedText style={[styles.trendsTitle, { color: colors.textPrimary }]}>{timeRange === 'week' ? 'Weekly' : 'Monthly'} Trends</ThemedText>
        
        {/* Line Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF9500' }]} />
              <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>Energy</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#0891B2' }]} />
              <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>Focus</ThemedText>
            </View>
          </View>
          
          {timeRange === 'month' ? (
            <ScrollView 
              horizontal
              style={styles.lineChartScrollView}
              contentContainerStyle={[styles.lineChartContent, { width: Math.max(chartWidth, weeklyData.length * 50) }]}
              showsHorizontalScrollIndicator={true}
              snapToInterval={snapInterval}
              decelerationRate="fast"
              onScroll={(event) => {
                const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                logScrollEvent('EntryHistory', 'chart_horizontal_scroll', {
                  offsetX: contentOffset.x,
                  contentWidth: contentSize.width,
                  visibleWidth: layoutMeasurement.width,
                  scrollableWidth: contentSize.width - layoutMeasurement.width,
                  scrollProgress: contentOffset.x / Math.max(1, contentSize.width - layoutMeasurement.width)
                });
              }}
            >
              {renderLineChart(weeklyData, Math.max(chartWidth, weeklyData.length * 50))}
            </ScrollView>
          ) : (
            <View style={styles.lineChartContainer}>
              {renderLineChart(weeklyData, chartWidth)}
            </View>
          )}
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
                ? 'Strong positive pattern' 
                : correlation < -0.3 
                ? 'Inverse relationship'
                : 'Variable pattern'}
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
    if (DEBUG_MODE) console.log('[DEBUG] Rendering loading state');
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
    if (DEBUG_MODE) console.log('[DEBUG] Rendering empty state');
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: colors.textPrimary }]}>Entry History</ThemedText>
        </View>
        <ThemedText style={styles.emptyText}>No entries yet. Start tracking your daily clarity!</ThemedText>
      </ThemedView>
    );
  }

  if (DEBUG_MODE) {
    console.log('[DEBUG] Rendering main component with:', {
      entriesCount: entries.length,
      dailyGroupsCount: dailyGroups.length,
      timeRange: timeRange
    });
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
          paddingBottom: 60 + (insets.bottom || 20)
        }}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
          logScrollEvent('EntryHistory', 'main_scroll', {
            offsetY: contentOffset.y,
            contentHeight: contentSize.height,
            visibleHeight: layoutMeasurement.height,
            scrollableHeight: contentSize.height - layoutMeasurement.height,
            scrollProgress: contentOffset.y / Math.max(1, contentSize.height - layoutMeasurement.height)
          });
        }}
        onContentSizeChange={(width, height) => {
          logScrollEvent('EntryHistory', 'content_size_change', {
            contentWidth: width,
            contentHeight: height
          });
        }}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          logScrollEvent('EntryHistory', 'scroll_view_layout', {
            scrollViewWidth: width,
            scrollViewHeight: height
          });
        }}
      >
        {renderTimeRangeSelector()}
        {renderTrendChart()}
        
        {dailyGroups.map((group, groupIndex) => {
          if (DEBUG_MODE) {
            console.log(`[DEBUG] Rendering daily group ${groupIndex}:`, {
              date: group.date,
              entriesCount: group.entries.length,
              isCollapsed: group.isCollapsed
            });
          }

          const formattedDate = formatDate(group.date);
          const summary = generateDailySummary(group.entries);
          
          if (DEBUG_MODE) {
            console.log('[DEBUG] Collapsible props:', {
              title: formattedDate,
              titleType: typeof formattedDate,
              expanded: !group.isCollapsed,
              expandedType: typeof (!group.isCollapsed),
              summary: summary,
              summaryType: typeof summary,
              summaryLength: summary?.length || 0
            });
          }

          try {
            return (
              <Animated.View 
                key={group.date}
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }}
              >
                <Collapsible
                  title={formattedDate}
                  expanded={!group.isCollapsed}
                  onToggle={() => toggleDayCollapse(group.date)}
                  summary={summary}
                >
              {group.entries.map((entry, entryIndex) => {
                if (DEBUG_MODE) {
                  console.log(`[DEBUG] Rendering entry ${entryIndex} in group ${group.date}:`, {
                    entryId: entry.id,
                    energyLevel: entry.energy_level,
                    focusLevel: entry.focus_level,
                    createdAt: entry.created_at,
                    notes: entry.notes ? entry.notes.substring(0, 50) + '...' : 'none'
                  });
                }

                const timestamp = formatTimestamp(entry.created_at);
                const energyLevel = entry.energy_level || 0;
                const focusLevel = entry.focus_level || 0;
                
                if (DEBUG_MODE) {
                  console.log('[DEBUG] Entry template literal variables:', {
                    timestamp: timestamp,
                    timestampType: typeof timestamp,
                    energyLevel: energyLevel,
                    energyLevelType: typeof energyLevel,
                    focusLevel: focusLevel,
                    focusLevelType: typeof focusLevel
                  });
                }

                try {
                  return (
                    <TouchableOpacity
                      key={entry.id || `${entry.date}-${entryIndex}`}
                      style={[
                        styles.timelineEntry,
                        { 
                          backgroundColor: colors.cardBackground,
                          borderColor: colors.border,
                          marginBottom: entryIndex === group.entries.length - 1 ? 0 : 8,
                        }
                      ]}
                      onPress={() => onEntrySelect?.(entry)}
                    >
                      <View style={styles.timelineHeader}>
                        <ThemedText style={[styles.timelineTime, { color: colors.textPrimary }]}>
                          {`${timestamp} - Energy: ${energyLevel}, Focus: ${focusLevel}`}
                        </ThemedText>
                        {isInFlowState(entry.energy_level, entry.focus_level) ? (
                          <View style={[styles.flowBadge, { backgroundColor: colors.flowActive }]}>
                            <ThemedText style={styles.flowBadgeText}>FLOW</ThemedText>
                          </View>
                        ) : null}
                      </View>

                      {entry.notes && entry.notes.trim() ? (
                        <View style={styles.timelineNotes}>
                          <ThemedText style={[styles.timelineNotesText, { color: colors.textSecondary }]} numberOfLines={2}>
                            {entry.notes && String(entry.notes).trim() ? String(entry.notes).trim() : ''}
                          </ThemedText>
                        </View>
                      ) : null}

                      {((entry.caffeine_intake && entry.caffeine_intake > 0) || (entry.alcohol_intake && entry.alcohol_intake > 0)) ? (
                        <View style={styles.timelineFactors}>
                          {entry.caffeine_intake && entry.caffeine_intake > 0 ? (
                            <ThemedText style={[styles.timelineFactorText, { color: colors.textTertiary }]}>
                              {`Caffeine: ${entry.caffeine_intake || 0}`}
                            </ThemedText>
                          ) : null}
                          {entry.alcohol_intake && entry.alcohol_intake > 0 ? (
                            <ThemedText style={[styles.timelineFactorText, { color: colors.textTertiary }]}>
                              {`Alcohol: ${entry.alcohol_intake || 0}`}
                            </ThemedText>
                          ) : null}
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                } catch (error) {
                  if (DEBUG_MODE) {
                    console.error('[DEBUG] Error rendering entry:', error);
                    console.error('[DEBUG] Entry data:', entry);
                  }
                  return null;
                }
              })}
                </Collapsible>
              </Animated.View>
            );
          } catch (error) {
            if (DEBUG_MODE) {
              console.error('[DEBUG] Error rendering daily group:', error);
              console.error('[DEBUG] Group data:', group);
            }
            return null;
          }
        })}
      </ScrollView>
      
      {/* Floating Export Button */}
      <View style={[
        styles.floatingButtonContainer, 
        { 
          paddingBottom: Math.max((insets.bottom || 0) + 20, 40),
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
                    text: 'Advanced Options...',
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
            <ThemedText style={[styles.floatingExportButtonText, { color: '#FFFFFF', fontWeight: '600' }]}>Export Data</ThemedText>
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
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    }),
  },
  floatingExportButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    }),
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
    ...createShadowStyle({
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 6,
    }),
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
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    }),
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
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }),
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
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
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
  monthIndicator: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  lineChart: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  lineChartContainer: {
    width: '100%',
  },
  lineChartScrollView: {
    flex: 1,
  },
  lineChartContent: {
    paddingHorizontal: 20,
  },
  yAxisLabels: {
    width: 30,
    height: 280,
    justifyContent: 'space-around',
    paddingTop: 20,
    paddingBottom: 60,
  },
  yAxisLabel: {
    fontSize: 10,
    textAlign: 'right',
    lineHeight: 12,
  },
  chartArea: {
    position: 'relative',
    marginLeft: 10,
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  dataOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chartLine: {
    height: 2,
    transformOrigin: '0 0',
  },
  dataPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  flowDiamond: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  xAxisLabels: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  xAxisLabel: {
    fontSize: 10,
    textAlign: 'center',
    width: 40,
  },
  timelineEntry: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    ...createShadowStyle({
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineTime: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  flowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  flowBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timelineNotes: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  timelineNotesText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  timelineFactors: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  timelineFactorText: {
    fontSize: 12,
    fontWeight: '500',
  },
});