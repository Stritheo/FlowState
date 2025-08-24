import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DataExport } from '@/components/DataExport';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      <ThemedView style={styles.innerContainer}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <ThemedText style={styles.sectionTitle}>Data Management</ThemedText>
          
          <TouchableOpacity
            style={[styles.settingButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => setShowExportModal(true)}
          >
            <ThemedText style={[styles.settingButtonText, { color: colors.tint }]}>
              Export & Manage Data
            </ThemedText>
            <ThemedText style={[styles.settingButtonDescription, { color: colors.textSecondary }]}>
              Export data as CSV/JSON or manage data by time range
            </ThemedText>
          </TouchableOpacity>
          
        </ScrollView>
      </ThemedView>
      
      <Modal
        visible={showExportModal}
        animationType="slide"
        onRequestClose={() => setShowExportModal(false)}
      >
        <DataExport onClose={() => setShowExportModal(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingButtonDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
});