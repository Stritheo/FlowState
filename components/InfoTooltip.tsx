import React, { useState } from 'react';
import { Text, TouchableOpacity, Modal, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface InfoTooltipProps {
  title: string;
  content: string;
  size?: number;
}

export function InfoTooltip({ title, content, size = 16 }: InfoTooltipProps) {
  const [showModal, setShowModal] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <TouchableOpacity
        style={[styles.infoButton, { backgroundColor: colors.subtle + '20' }]}
        onPress={() => setShowModal(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={`Info about ${title}`}
        accessibilityRole="button"
        accessibilityHint="Tap to view scale guidance"
      >
        <Text style={[styles.infoIcon, { fontSize: size, color: colors.icon }]}>ⓘ</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <TouchableOpacity 
            style={[styles.tooltipContainer, { backgroundColor: colors.cardBackground }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <ThemedText style={styles.tooltipTitle}>{title}</ThemedText>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={true}
              indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
              nestedScrollEnabled={true}
            >
              <ThemedText style={styles.tooltipContent}>{content}</ThemedText>
            </ScrollView>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.actionColor }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>Got it</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  infoButton: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  infoIcon: {
    fontWeight: '600',
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tooltipContainer: {
    borderRadius: 16,
    padding: 24,
    maxWidth: Dimensions.get('window').width * 0.85,
    maxHeight: Dimensions.get('window').height * 0.75,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  tooltipTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: Dimensions.get('window').height * 0.55,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  scrollViewContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tooltipContent: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});