import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Alert, StyleSheet, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from './ThemedText';
import { databaseService, DailyEntry } from '../services/database';
import { Colors } from '../constants/Colors';
import useColorScheme from '@/hooks/useColorScheme';
import { calculateFlowState, isInFlowState, getFlowStateColor, getEnergyColor, getFocusColor, getActionColor } from '../utils/flowState';
import { getEnergyScaleGuidance, getFocusScaleGuidance, getGeneralScaleGuidance } from '../utils/scaleGuidance';
import { getCurrentDateInAustralia, formatDateForDisplay, isToday, AUSTRALIA_TIMEZONE } from '../utils/dateUtils';
import { createShadowStyle } from '../utils/shadowUtils';

interface DailyCheckInProps {
  date?: string;
  onSave?: (entry: DailyEntry) => void;
}

export function DailyCheckIn({ date: propDate, onSave }: DailyCheckInProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [selectedDate, setSelectedDate] = useState<string>(propDate || getCurrentDateInAustralia());
  const [energyLevel, setEnergyLevel] = useState<number>(4);
  const [focusLevel, setFocusLevel] = useState<number>(4);
  const [caffeineIntake, setCaffeineIntake] = useState<number>(0);
  const [alcoholIntake, setAlcoholIntake] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingEntry, setExistingEntry] = useState<DailyEntry | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Animation values
  const buttonScale = new Animated.Value(1);
  const flowStateOpacity = new Animated.Value(0.7);
  const saveButtonScale = new Animated.Value(1);

  useEffect(() => {
    loadExistingEntry();
  }, [selectedDate]);

  useEffect(() => {
    if (propDate && propDate !== selectedDate) {
      setSelectedDate(propDate);
    }
  }, [propDate]);

  const loadExistingEntry = async () => {
    try {
      const entry = await databaseService.getDailyEntry(selectedDate);
      if (entry) {
        setExistingEntry(entry);
        setEnergyLevel(entry.energy_level);
        setFocusLevel(entry.focus_level);
        setCaffeineIntake(entry.caffeine_intake || 0);
        setAlcoholIntake(entry.alcohol_intake || 0);
        setNotes(entry.notes || '');
      } else {
        // Reset counters for new day
        setCaffeineIntake(0);
        setAlcoholIntake(0);
        setNotes('');
        setEnergyLevel(4);
        setFocusLevel(4);
        setExistingEntry(null);
      }
    } catch (error) {
      console.error('Failed to load existing entry:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Always check for existing entry first to avoid UNIQUE constraint errors
      const currentEntry = await databaseService.getDailyEntry(selectedDate);
      
      if (currentEntry) {
        await databaseService.updateDailyEntry(selectedDate, {
          energy_level: energyLevel,
          focus_level: focusLevel,
          caffeine_intake: caffeineIntake,
          alcohol_intake: alcoholIntake,
          notes: notes.trim() || undefined,
        });
      } else {
        await databaseService.addDailyEntry({
          date: selectedDate,
          energy_level: energyLevel,
          focus_level: focusLevel,
          caffeine_intake: caffeineIntake,
          alcohol_intake: alcoholIntake,
          notes: notes.trim() || undefined,
        });
      }

      const updatedEntry = await databaseService.getDailyEntry(selectedDate);
      if (updatedEntry && onSave) {
        onSave(updatedEntry);
      }

      Alert.alert('Success', 'Daily check-in saved!');
    } catch (error) {
      console.error('Failed to save entry:', error);
      Alert.alert('Error', 'Failed to save daily check-in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, newDate?: Date) => {
    setShowDatePicker(false);
    if (newDate) {
      // Use Australian timezone formatting to match getCurrentDateInAustralia()
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: AUSTRALIA_TIMEZONE
      });
      const dateString = formatter.format(newDate);
      setSelectedDate(dateString);
    }
  };


  const animateButtonPress = (animatedValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderLevelButtons = (currentLevel: number, setLevel: (level: number) => void, label: string) => {
    const isEnergySection = label.toLowerCase().includes('energy');
    const colorKey = isEnergySection ? getEnergyColor() : getFocusColor();
    
    return (
    <View style={styles.levelSection}>
      <View style={styles.levelHeader}>
        <ThemedText type="primary" style={styles.levelLabel}>{label}</ThemedText>
      </View>
      <View style={styles.levelButtons}>
        <View style={styles.scaleIndicator}>
          <ThemedText style={styles.scaleLabel}>Low</ThemedText>
          <ThemedText style={styles.scaleLabel}>Balanced</ThemedText>
          <ThemedText style={styles.scaleLabel}>High</ThemedText>
        </View>
        <View style={styles.levelButtonsRow}>
        {[1, 2, 3, 4, 5, 6, 7].map((level) => (
          <Animated.View key={level} style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.levelButton,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                currentLevel === level && {
                  backgroundColor: colors[colorKey],
                  borderColor: colors[colorKey],
                  ...createShadowStyle({
                    shadowColor: colors[colorKey],
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }),
                }
              ]}
              onPress={() => {
                animateButtonPress(buttonScale);
                setLevel(level);
              }}
            >
              <ThemedText style={[
                styles.levelButtonText,
                { color: colors.text },
                currentLevel === level && { color: '#FFFFFF' }
              ]}>
                {level}
              </ThemedText>
            </TouchableOpacity>
          </Animated.View>
        ))}
        </View>
      </View>
    </View>
    );
  };

  const renderCounter = (label: string, count: number, onIncrement: () => void, onDecrement: () => void) => (
    <View style={styles.counterSection}>
      <ThemedText type="primary" style={styles.counterLabel}>{label}</ThemedText>
      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={[styles.counterButton, count === 0 && styles.counterButtonDisabled]}
          onPress={onDecrement}
          disabled={count === 0}
        >
          <ThemedText style={[styles.counterButtonText, count === 0 && styles.counterButtonTextDisabled]}>−</ThemedText>
        </TouchableOpacity>
        <View style={[
          styles.counterDisplay,
          { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.border
          }
        ]}>
          <ThemedText style={[styles.counterValue, { color: colors.textPrimary }]}>{count}</ThemedText>
        </View>
        <TouchableOpacity
          style={styles.counterButton}
          onPress={onIncrement}
        >
          <ThemedText style={styles.counterButtonText}>+</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const flowStateResult = calculateFlowState(energyLevel, focusLevel);
  const isCurrentlyInFlowState = isInFlowState(energyLevel, focusLevel);

  // Animate flow state changes
  useEffect(() => {
    Animated.timing(flowStateOpacity, {
      toValue: isCurrentlyInFlowState ? 1 : 0.7,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isCurrentlyInFlowState]);

  const getFlowStateColorValue = () => {
    const colorKey = getFlowStateColor(energyLevel, focusLevel);
    return colors[colorKey];
  };

  const renderFlowStateIndicator = () => (
    <View style={styles.flowStateSection}>
      <Animated.View 
        style={[
          styles.flowStateIndicator, 
          {
            backgroundColor: getFlowStateColorValue() + '20',
            borderColor: getFlowStateColorValue(),
            opacity: flowStateOpacity,
            transform: [{ scale: isCurrentlyInFlowState ? 1.05 : 1 }],
          }
        ]}
      >
        <ThemedText style={[styles.flowStateText, { color: getFlowStateColorValue() }]}>
          {flowStateResult.label}
        </ThemedText>
      </Animated.View>
    </View>
  );


  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContainer, 
            { 
              paddingTop: Math.max(insets.top, 20),
              paddingBottom: 120 + (insets.bottom || 20)
            }
          ]}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          bounces={true}
          alwaysBounceVertical={false}
        >
            <View style={styles.titleContainer}>
              <View style={styles.titleRow}>
                <ThemedText style={styles.title}>Check-In</ThemedText>
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.dateContainer,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.dateContent}>
                <ThemedText style={[
                  styles.date,
                  { color: colors.textPrimary }
                ]}>
                  {formatDateForDisplay(selectedDate)}
                </ThemedText>
                {isToday(selectedDate) && (
                  <View style={[styles.todayBadge, { backgroundColor: colors[getActionColor()] }]}>
                    <ThemedText style={styles.todayBadgeText}>Today</ThemedText>
                  </View>
                )}
              </View>
              <ThemedText style={[styles.dateHint, { color: colors.textSecondary }]}>
                Tap to change date
              </ThemedText>
            </TouchableOpacity>

            {/* Core FlowState Metrics */}
            <View style={styles.coreMetricsSection}>
              {renderLevelButtons(energyLevel, setEnergyLevel, 'Energy Level')}
              {renderLevelButtons(focusLevel, setFocusLevel, 'Focus Level')}
              
              {renderFlowStateIndicator()}
            </View>

            {/* Lifestyle Factors */}
            <View style={styles.lifestyleSection}>
              <ThemedText style={[styles.sectionTitle, { color: colors.textPrimary }]}>Lifestyle Factors</ThemedText>
              {renderCounter('Caffeine', caffeineIntake, () => setCaffeineIntake(prev => prev + 1), () => setCaffeineIntake(prev => Math.max(0, prev - 1)))}
              {renderCounter('Alcohol', alcoholIntake, () => setAlcoholIntake(prev => prev + 1), () => setAlcoholIntake(prev => Math.max(0, prev - 1)))}
            </View>

            {/* Notes Section */}
            <View style={styles.notesSection}>
              <ThemedText style={styles.notesLabel}>Notes</ThemedText>
              <TextInput
                style={[
                  styles.notesInput,
                  { 
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    color: colors.textPrimary
                  }
                ]}
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
                placeholder="Life events, feelings, observations..."
                placeholderTextColor={colors.textPlaceholder}
              />
            </View>
          
          {/* Save Button at bottom of ScrollView */}
          <View style={[
            styles.saveButtonInlineContainer, 
            { 
              paddingBottom: Math.max((insets.bottom || 0) + 20, 40),
              marginTop: 20
            }
          ]}>
            <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.saveButton, 
                  { backgroundColor: colors[getActionColor()] },
                  isLoading && { backgroundColor: colors.subtle }
                ]}
                onPress={() => {
                  animateButtonPress(saveButtonScale);
                  handleSave();
                }}
                disabled={isLoading}
              >
                <ThemedText style={[styles.saveButtonText, { color: '#FFFFFF' }]}>
                  {isLoading ? 'Saving...' : existingEntry ? 'Update Check-In' : 'Save Check-In'}
                </ThemedText>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
      
      {showDatePicker && (
        <DateTimePicker
          value={new Date(selectedDate)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
          textColor={colors.textPrimary}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  titleContainer: {
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'left',
    lineHeight: 40,
    flex: 1,
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateContainer: {
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
  dateContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  date: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  todayBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateHint: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  levelSection: {
    marginBottom: 24,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelLabel: {
    fontSize: 20,
    fontWeight: '600',
  },
  levelButtons: {
    flexDirection: 'column',
  },
  scaleIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  scaleLabel: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
    flex: 1,
    textAlign: 'center',
  },
  levelButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  levelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  levelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  coreMetricsSection: {
    marginBottom: 32,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.1)',
  },
  lifestyleSection: {
    marginBottom: 32,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 149, 0, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  notesSection: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  saveButtonInlineContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  saveButton: {
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
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  flowStateSection: {
    marginTop: 16,
    marginBottom: 0,
    alignItems: 'center',
  },
  flowStateIndicator: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 2,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    }),
  },
  flowStateText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  counterSection: {
    marginBottom: 24,
  },
  counterLabel: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0891B2',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  counterButtonDisabled: {
    backgroundColor: '#ccc',
  },
  counterButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  counterButtonTextDisabled: {
    color: '#999',
  },
  counterDisplay: {
    minWidth: 60,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 12,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
  },
});