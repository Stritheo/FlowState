import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView, Switch, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from './ThemedText';
import { exportService, ExportOptions } from '../services/exportService';
import { databaseService } from '../services/database';
import { Colors } from '../constants/Colors';
import useColorScheme from '@/hooks/useColorScheme';
import { getActionColor } from '../utils/flowState';

interface DataExportProps {
  onClose?: () => void;
}

type TimeRange = 'day' | 'week' | 'month' | 'all';

interface DeletionOption {
  range: TimeRange;
  title: string;
  description: string;
  confirmationTitle: string;
  confirmationMessage: (count: number) => string;
  isDestructive?: boolean;
}

const DELETION_OPTIONS: DeletionOption[] = [
  {
    range: 'day',
    title: "Delete Today's Data",
    description: 'Last 24 hours',
    confirmationTitle: 'Delete Today\'s Data',
    confirmationMessage: (count) => `Delete ${count} ${count === 1 ? 'entry' : 'entries'} from today?`,
  },
  {
    range: 'week',
    title: 'Delete Past Week',
    description: 'Last 7 days',
    confirmationTitle: 'Delete Past Week',
    confirmationMessage: (count) => `Delete ${count} ${count === 1 ? 'entry' : 'entries'} from the past 7 days?`,
  },
  {
    range: 'month',
    title: 'Delete Past Month',
    description: 'Last 30 days',
    confirmationTitle: 'Delete Past Month',
    confirmationMessage: (count) => `Delete ${count} ${count === 1 ? 'entry' : 'entries'} from the past 30 days?`,
  },
  {
    range: 'all',
    title: 'Delete All Data',
    description: 'Complete reset',
    confirmationTitle: 'Delete All Data',
    confirmationMessage: (count) => `Permanently delete ALL ${count} ${count === 1 ? 'entry' : 'entries'}? This cannot be undone.`,
    isDestructive: true,
  },
];

export function DataExport({ onClose }: DataExportProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const buttonScale = new Animated.Value(1);
  
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const [startDate, setStartDate] = useState<string>(() => {
    const now = Date.now();
    return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default to last month
  });
  
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date(Date.now()).toISOString().split('T')[0];
  });
  
  const [includeNotes, setIncludeNotes] = useState<boolean>(false);
  const [anonymize, setAnonymize] = useState<boolean>(true);
  const [analysisFormat, setAnalysisFormat] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [preview, setPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  
  // Data management state
  const [entryCounts, setEntryCounts] = useState<Record<TimeRange, number>>({
    day: 0,
    week: 0,
    month: 0,
    all: 0,
  });
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [loadingCounts, setLoadingCounts] = useState<boolean>(false);

  useEffect(() => {
    loadEntryCounts();
  }, []);

  const handleDatePreset = (preset: 'week' | 'month' | 'quarter' | 'all') => {
    const now = Date.now();
    const end = new Date(now).toISOString().split('T')[0];
    let start: string;
    
    switch (preset) {
      case 'week':
        start = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'month':
        start = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'quarter':
        start = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'all':
        start = '2020-01-01'; // Far back date to get all data
        break;
    }
    
    setStartDate(start);
    setEndDate(end);
  };

  const generatePreview = async () => {
    try {
      const options: ExportOptions = {
        startDate,
        endDate,
        includeNotes,
        anonymize,
        analysisFormat
      };
      
      const previewText = await exportService.getExportPreview(options, 3);
      setPreview(previewText);
      setShowPreview(true);
    } catch {
      Alert.alert('Preview Error', 'Unable to generate preview');
    }
  };

  const handleExport = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Invalid Dates', 'Please select valid start and end dates');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      Alert.alert('Invalid Date Range', 'Start date must be before end date');
      return;
    }

    setIsExporting(true);
    
    try {
      const options: ExportOptions = {
        startDate,
        endDate,
        includeNotes,
        anonymize,
        analysisFormat
      };
      
      const result = await exportService.exportData(options);
      
      if (result.success && result.filePath) {
        Alert.alert(
          'Export Successful',
          'Your data has been exported. Would you like to share it?',
          [
            { text: 'Done', style: 'cancel' },
            { 
              text: 'Share', 
              onPress: async () => {
                const shared = await exportService.shareExport(result.filePath!);
                if (!shared) {
                  Alert.alert('Share Failed', 'Unable to share the export file');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Export Failed', result.error || 'Unknown error occurred');
      }
    } catch {
      Alert.alert('Export Error', 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const loadEntryCounts = async () => {
    setLoadingCounts(true);
    try {
      const counts = await Promise.all([
        databaseService.getEntryCountByRange('day'),
        databaseService.getEntryCountByRange('week'),
        databaseService.getEntryCountByRange('month'),
        databaseService.getEntryCountByRange('all'),
      ]);
      
      setEntryCounts({
        day: counts[0],
        week: counts[1],
        month: counts[2],
        all: counts[3],
      });
    } catch (error) {
      console.error('Failed to load entry counts:', error);
    } finally {
      setLoadingCounts(false);
    }
  };

  const handleDeleteData = async (option: DeletionOption) => {
    const count = entryCounts[option.range];
    
    if (count === 0) {
      Alert.alert('No Data', `There are no entries to delete in the selected timeframe.`);
      return;
    }

    Alert.alert(
      option.confirmationTitle,
      option.confirmationMessage(count),
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: option.isDestructive ? 'destructive' : 'default',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const deletedCount = await databaseService.deleteDataByRange(option.range);
              Alert.alert(
                'Success',
                `Deleted ${deletedCount} ${deletedCount === 1 ? 'entry' : 'entries'}`,
                [{ text: 'OK' }]
              );
              // Refresh the counts
              await loadEntryCounts();
            } catch (error) {
              console.error('Failed to delete data:', error);
              Alert.alert(
                'Error',
                'Failed to delete data. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const renderDateInput = (label: string, value: string, onChange: (date: string) => void) => (
    <View style={styles.dateInputContainer}>
      <ThemedText style={styles.dateLabel}>{label}</ThemedText>
      <TouchableOpacity 
        style={styles.dateInput}
        onPress={() => {
          // In a real app, you'd open a date picker here
          // For now, just show the current value
          Alert.alert('Date Selection', `Current: ${value}\nTo change dates, use the preset buttons below.`);
        }}
      >
        <Text style={[styles.dateText, { color: colors.textPrimary }]}>{value}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOption = (label: string, description: string, value: boolean, onChange: (value: boolean) => void) => (
    <View style={styles.optionContainer}>
      <View style={styles.optionTextContainer}>
        <ThemedText style={styles.optionLabel}>{label}</ThemedText>
        <ThemedText style={styles.optionDescription}>{description}</ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.subtle, true: colors[getActionColor()] }}
        thumbColor={value ? '#FFFFFF' : colors.cardBackground}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Export Your Data</ThemedText>
          <ThemedText style={styles.subtitle}>Generate analysis-ready CSV reports</ThemedText>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <ThemedText style={styles.privacyText}>
            Privacy-first export with anonymisation options for secure data sharing
          </ThemedText>
        </View>

        {/* Date Range Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Date Range</ThemedText>
          
          <View style={styles.dateRow}>
            {renderDateInput('From', startDate, setStartDate)}
            {renderDateInput('To', endDate, setEndDate)}
          </View>

          <View style={styles.presetButtons}>
            <TouchableOpacity style={styles.presetButton} onPress={() => handleDatePreset('week')}>
              <Text style={styles.presetButtonText}>Last Week</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetButton} onPress={() => handleDatePreset('month')}>
              <Text style={styles.presetButtonText}>Last Month</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetButton} onPress={() => handleDatePreset('quarter')}>
              <Text style={styles.presetButtonText}>Last 3 Months</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetButton} onPress={() => handleDatePreset('all')}>
              <Text style={styles.presetButtonText}>All Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Export Options</ThemedText>
          
          {renderOption(
            'Analysis Format',
            'Use standardised column names suitable for data analysis',
            analysisFormat,
            setAnalysisFormat
          )}
          
          {renderOption(
            'Anonymise Data',
            'Remove identifying information and dates for privacy protection',
            anonymize,
            setAnonymize
          )}
          
          {renderOption(
            'Include Notes',
            'Include personal notes in the export (may contain sensitive information)',
            includeNotes,
            setIncludeNotes
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Data Management Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Data Management</ThemedText>
          
          {loadingCounts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.tint} />
              <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading entry counts...
              </ThemedText>
            </View>
          ) : (
            <View style={styles.deleteOptionsContainer}>
              {DELETION_OPTIONS.map((option) => {
                const count = entryCounts[option.range];
                const isDisabled = count === 0;
                
                return (
                  <TouchableOpacity
                    key={option.range}
                    style={[
                      styles.deleteOption,
                      { 
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                      isDisabled && styles.deleteOptionDisabled,
                    ]}
                    onPress={() => handleDeleteData(option)}
                    disabled={isDisabled || isDeleting}
                  >
                    <View style={styles.deleteOptionContent}>
                      <ThemedText 
                        style={[
                          styles.deleteOptionTitle,
                          { color: '#FF3B30' },
                          option.isDestructive && { fontWeight: 'bold' },
                          isDisabled && { color: colors.textTertiary },
                        ]}
                      >
                        {option.title}
                      </ThemedText>
                      <ThemedText 
                        style={[
                          styles.deleteOptionCount,
                          { color: colors.textSecondary },
                          isDisabled && { color: colors.textTertiary },
                        ]}
                      >
                        {isDisabled ? 'No entries' : `${count} ${count === 1 ? 'entry' : 'entries'}`}
                      </ThemedText>
                    </View>
                    <ThemedText 
                      style={[
                        styles.deleteOptionDescription,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {option.description}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Preview Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.previewButton} onPress={generatePreview}>
            <Text style={styles.previewButtonText}>Preview Export</Text>
          </TouchableOpacity>
          
          {showPreview && (
            <View style={styles.previewContainer}>
              <ThemedText style={styles.previewTitle}>Export Preview:</ThemedText>
              <View style={styles.previewContent}>
                <Text style={[styles.previewText, { color: colors.textPrimary }]}>{preview}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.exportButton, 
                { backgroundColor: colors[getActionColor()] },
                isExporting && { backgroundColor: colors.subtle }
              ]}
              onPress={() => {
                animateButtonPress();
                handleExport();
              }}
              disabled={isExporting}
            >
              <Text style={[styles.exportButtonText, { color: '#FFFFFF' }]}>
                {isExporting ? 'Exporting...' : 'Export & Share'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          
          {onClose && (
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  privacyNotice: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  privacyIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateInputContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
    width: '48%',
  },
  presetButtonText: {
    fontSize: 14,
    color: '#0891B2',
    textAlign: 'center',
    fontWeight: '500',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.6,
  },
  previewButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  previewButtonText: {
    fontSize: 16,
    color: '#0891B2',
    fontWeight: '500',
  },
  previewContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewContent: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    maxHeight: 200,
  },
  previewText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  actionButtons: {
    marginTop: 24,
    marginBottom: 40,
  },
  exportButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  exportButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
  },
  deleteOptionsContainer: {
    marginTop: 8,
  },
  deleteOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  deleteOptionDisabled: {
    opacity: 0.5,
  },
  deleteOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deleteOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteOptionCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteOptionDescription: {
    fontSize: 12,
  },
});