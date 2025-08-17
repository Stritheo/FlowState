import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView, Switch, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from './ThemedText';
import { exportService, ExportOptions } from '../services/exportService';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getActionColor } from '../utils/flowState';

interface DataExportProps {
  onClose?: () => void;
}

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
    const date = new Date();
    date.setMonth(date.getMonth() - 1); // Default to last month
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [includeNotes, setIncludeNotes] = useState<boolean>(false);
  const [anonymize, setAnonymize] = useState<boolean>(true);
  const [analysisFormat, setAnalysisFormat] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [preview, setPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const handleDatePreset = (preset: 'week' | 'month' | 'quarter' | 'all') => {
    const end = new Date().toISOString().split('T')[0];
    let start: string;
    
    const today = new Date();
    switch (preset) {
      case 'week':
        today.setDate(today.getDate() - 7);
        start = today.toISOString().split('T')[0];
        break;
      case 'month':
        today.setMonth(today.getMonth() - 1);
        start = today.toISOString().split('T')[0];
        break;
      case 'quarter':
        today.setMonth(today.getMonth() - 3);
        start = today.toISOString().split('T')[0];
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
    } catch (error) {
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
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
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
});