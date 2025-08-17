import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { databaseService, DailyEntry } from '../services/database';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { calculateFlowState, isInFlowState, getFlowStateColor, getEnergyColor, getFocusColor, getActionColor } from '../utils/flowState';

interface DailyCheckInProps {
  date?: string;
  onSave?: (entry: DailyEntry) => void;
}

export function DailyCheckIn({ date = new Date().toISOString().split('T')[0], onSave }: DailyCheckInProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [energyLevel, setEnergyLevel] = useState<number>(4);
  const [focusLevel, setFocusLevel] = useState<number>(4);
  const [caffeineIntake, setCaffeineIntake] = useState<number>(0);
  const [alcoholIntake, setAlcoholIntake] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingEntry, setExistingEntry] = useState<DailyEntry | null>(null);
  
  // Animation values
  const buttonScale = new Animated.Value(1);
  const flowStateOpacity = new Animated.Value(0.7);
  const saveButtonScale = new Animated.Value(1);

  useEffect(() => {
    loadExistingEntry();
  }, [date]);

  const loadExistingEntry = async () => {
    try {
      const entry = await databaseService.getDailyEntry(date);
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
      }
    } catch (error) {
      console.error('Failed to load existing entry:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (existingEntry) {
        await databaseService.updateDailyEntry(date, {
          energy_level: energyLevel,
          focus_level: focusLevel,
          caffeine_intake: caffeineIntake,
          alcohol_intake: alcoholIntake,
          notes: notes.trim() || undefined,
        });
      } else {
        await databaseService.addDailyEntry({
          date,
          energy_level: energyLevel,
          focus_level: focusLevel,
          caffeine_intake: caffeineIntake,
          alcohol_intake: alcoholIntake,
          notes: notes.trim() || undefined,
        });
      }

      const updatedEntry = await databaseService.getDailyEntry(date);
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
      <ThemedText style={styles.levelLabel}>{label}</ThemedText>
      <View style={styles.levelButtons}>
        {[1, 2, 3, 4, 5, 6, 7].map((level) => (
          <Animated.View key={level} style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.levelButton,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                currentLevel === level && {
                  backgroundColor: colors[colorKey],
                  borderColor: colors[colorKey],
                  shadowColor: colors[colorKey],
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }
              ]}
              onPress={() => {
                animateButtonPress(buttonScale);
                setLevel(level);
              }}
            >
              <Text style={[
                styles.levelButtonText,
                { color: colors.text },
                currentLevel === level && { color: '#FFFFFF' }
              ]}>
                {level}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
    );
  };

  const renderCounter = (label: string, count: number, onIncrement: () => void, onDecrement: () => void) => (
    <View style={styles.counterSection}>
      <ThemedText style={styles.counterLabel}>{label}</ThemedText>
      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={[styles.counterButton, count === 0 && styles.counterButtonDisabled]}
          onPress={onDecrement}
          disabled={count === 0}
        >
          <Text style={[styles.counterButtonText, count === 0 && styles.counterButtonTextDisabled]}>−</Text>
        </TouchableOpacity>
        <View style={styles.counterDisplay}>
          <Text style={styles.counterValue}>{count}</Text>
        </View>
        <TouchableOpacity
          style={styles.counterButton}
          onPress={onIncrement}
        >
          <Text style={styles.counterButtonText}>+</Text>
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
        <Text style={[styles.flowStateText, { color: getFlowStateColorValue() }]}>
          {flowStateResult.emoji} {flowStateResult.label}
        </Text>
      </Animated.View>
    </View>
  );


  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContainer, 
              { 
                paddingBottom: 120
              }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={true}
            alwaysBounceVertical={true}
            removeClippedSubviews={false}
          >
            <ThemedText style={styles.title}>Daily Check-In</ThemedText>
            <ThemedText style={styles.date}>{date}</ThemedText>

            {/* Core FlowState Metrics */}
            <View style={styles.coreMetricsSection}>
              <ThemedText style={styles.sectionTitle}>Core Metrics</ThemedText>
              {renderLevelButtons(energyLevel, setEnergyLevel, 'Energy Level')}
              {renderLevelButtons(focusLevel, setFocusLevel, 'Focus Level')}
              
              {renderFlowStateIndicator()}
            </View>

            {/* Lifestyle Factors */}
            <View style={styles.lifestyleSection}>
              <ThemedText style={styles.sectionTitle}>Lifestyle Factors</ThemedText>
              {renderCounter('Caffeine', caffeineIntake, () => setCaffeineIntake(prev => prev + 1), () => setCaffeineIntake(prev => Math.max(0, prev - 1)))}
              {renderCounter('Alcohol', alcoholIntake, () => setAlcoholIntake(prev => prev + 1), () => setAlcoholIntake(prev => Math.max(0, prev - 1)))}
            </View>

            {/* Notes Section */}
            <View style={styles.notesSection}>
              <ThemedText style={styles.notesLabel}>Notes</ThemedText>
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
                placeholder="Life events, feelings, observations..."
                placeholderTextColor="#666"
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
        
        <View style={[
          styles.buttonContainer, 
          { 
            paddingBottom: insets.bottom || 20
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
              <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>
                {isLoading ? 'Saving...' : existingEntry ? 'Update Check-In' : 'Save Check-In'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  date: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  levelSection: {
    marginBottom: 24,
  },
  levelLabel: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  levelButtons: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
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
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  buttonContainer: {
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
  saveButton: {
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 12,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});