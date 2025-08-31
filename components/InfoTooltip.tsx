import React, { useState } from 'react';
import { TouchableOpacity, Modal, StyleSheet, Dimensions, ScrollView, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from '../constants/Colors';
import useColorScheme from '@/hooks/useColorScheme';
import { createShadowStyle } from '../utils/shadowUtils';

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
        <ThemedText style={[styles.infoIcon, { fontSize: size, color: colors.icon }]}>i</ThemedText>
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
            <View style={styles.closeX}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeXButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Close tooltip"
                accessibilityRole="button"
              >
                <ThemedText style={[styles.closeXText, { color: colors.text }]}>✕</ThemedText>
              </TouchableOpacity>
            </View>
            <ThemedText style={styles.tooltipTitle}>{title || ''}</ThemedText>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
              bounces={true}
              nestedScrollEnabled={true}
            >
              <ThemedText style={styles.tooltipContent}>{content || ''}</ThemedText>
            </ScrollView>
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
    position: 'relative',
    borderRadius: 16,
    padding: 24,
    maxWidth: Dimensions.get('window').width * 0.85,
    maxHeight: Dimensions.get('window').height * 0.75,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 16,
    }),
  },
  closeX: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  closeXButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeXText: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    maxHeight: Dimensions.get('window').height * 0.6,
    marginVertical: 8,
  },
  tooltipTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  tooltipContent: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
  },
});