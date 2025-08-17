import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EntryHistory } from '@/components/EntryHistory';
import { ThemedView } from '@/components/ThemedView';

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ThemedView style={styles.innerContainer}>
        <EntryHistory />
      </ThemedView>
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
});
