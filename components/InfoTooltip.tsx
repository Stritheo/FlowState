import React, { useState, useRef } from 'react';
import { TouchableOpacity, Modal, StyleSheet, Dimensions, ScrollView, View, SafeAreaView, Platform } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from '../constants/Colors';
import useColorScheme from '@/hooks/useColorScheme';
import { createShadowStyle } from '../utils/shadowUtils';
import { logScrollEvent, logUIInteraction, logError } from '../utils/logger';

interface InfoTooltipProps {
  title: string;
  content: string;
  size?: number;
}

export function InfoTooltip({ title, content, size = 16 }: InfoTooltipProps) {
  const [showModal, setShowModal] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <>
      <TouchableOpacity
        style={[styles.infoButton, { backgroundColor: colors.subtle + '20' }]}
        onPress={() => {
          logUIInteraction('InfoTooltip', 'open_modal', { title });
          setShowModal(true);
        }}
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
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouch}
            activeOpacity={1}
            onPress={() => {
              logUIInteraction('InfoTooltip', 'close_modal_overlay', { title });
              setShowModal(false);
            }}
          >
            <TouchableOpacity 
              style={[styles.tooltipContainer, { backgroundColor: colors.cardBackground }]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.closeX}>
                <TouchableOpacity
                  onPress={() => {
                    logUIInteraction('InfoTooltip', 'close_modal_x_button', { title });
                    setShowModal(false);
                  }}
                  style={styles.closeXButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Close tooltip"
                  accessibilityRole="button"
                >
                  <ThemedText style={[styles.closeXText, { color: colors.text }]}>✕</ThemedText>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <ThemedText style={styles.tooltipTitle}>{title || ''}</ThemedText>
                <ScrollView 
                  ref={scrollViewRef}
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollViewContent}
                  showsVerticalScrollIndicator={true}
                  scrollIndicatorInsets={Platform.OS === 'ios' ? { right: 1 } : undefined}
                  bounces={true}
                  alwaysBounceVertical={true}
                  nestedScrollEnabled={true}
                  onScroll={(event) => {
                    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                    logScrollEvent('InfoTooltip', 'scroll', {
                      title,
                      offsetY: contentOffset.y,
                      contentHeight: contentSize.height,
                      visibleHeight: layoutMeasurement.height,
                      scrollableHeight: contentSize.height - layoutMeasurement.height,
                      scrollProgress: contentOffset.y / Math.max(1, contentSize.height - layoutMeasurement.height)
                    });
                  }}
                  onContentSizeChange={(width, height) => {
                    logScrollEvent('InfoTooltip', 'content_size_change', {
                      title,
                      contentWidth: width,
                      contentHeight: height
                    });
                  }}
                  onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    logScrollEvent('InfoTooltip', 'scroll_view_layout', {
                      title,
                      scrollViewWidth: width,
                      scrollViewHeight: height
                    });
                  }}
                  onScrollBeginDrag={() => {
                    logScrollEvent('InfoTooltip', 'scroll_begin_drag', { title });
                  }}
                  onScrollEndDrag={() => {
                    logScrollEvent('InfoTooltip', 'scroll_end_drag', { title });
                  }}
                  onMomentumScrollBegin={() => {
                    logScrollEvent('InfoTooltip', 'momentum_scroll_begin', { title });
                  }}
                  onMomentumScrollEnd={() => {
                    logScrollEvent('InfoTooltip', 'momentum_scroll_end', { title });
                  }}
                >
                  <ThemedText style={styles.tooltipContent}>{content || ''}</ThemedText>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
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
  },
  modalOverlayTouch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tooltipContainer: {
    borderRadius: 16,
    padding: 0,
    width: Dimensions.get('window').width * 0.85,
    maxHeight: Dimensions.get('window').height * 0.8,
    minHeight: 500,
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
  modalContent: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
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
    marginTop: 12,
  },
  scrollViewContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  tooltipTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  tooltipContent: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
  },
});