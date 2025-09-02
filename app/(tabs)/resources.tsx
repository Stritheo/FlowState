import React from 'react';
import { ThemedView } from '@/components/ThemedView';
import { ResourcesContent } from '@/components/ResourcesContent';

export default function ResourcesScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <ResourcesContent />
    </ThemedView>
  );
}