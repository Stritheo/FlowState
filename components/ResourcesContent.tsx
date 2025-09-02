import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './ThemedText';
import { Colors } from '../constants/Colors';
import useColorScheme from '@/hooks/useColorScheme';

export function ResourcesContent() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 36),
          paddingHorizontal: 20,
          paddingBottom: 100
        }}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>Resources & Guides</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            Everything you need to know about FlowState
          </ThemedText>
        </View>
        <View style={styles.content}>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textPrimary }]}>Welcome to FlowState</ThemedText>
            <ThemedText style={styles.sectionText}>
              FlowState helps you discover your natural energy cycles and focus patterns. By tracking these daily, you&apos;ll identify when you&apos;re most likely to enter and maintain your State of Flow - that optimal zone where you&apos;re energised, focused, and performing at your best.
              {'\n\n'}
              <ThemedText style={styles.bold}>Who is FlowState for?</ThemedText>
              {'\n\n'}
              • People seeking to optimize their productivity and well-being
              {'\n'}• Those managing ADHD, anxiety, or other conditions affecting focus
              {'\n'}• Healthcare providers supporting patients with mood and attention challenges
              {'\n'}• Anyone curious about their daily energy and attention patterns
              {'\n\n'}
              <ThemedText style={styles.bold}>What you&apos;ll discover:</ThemedText>
              {'\n\n'}
              • Your personal Flow State zone and when it naturally occurs
              {'\n'}• Daily patterns that promote or disrupt optimal performance
              {'\n'}• Early warning signs when you&apos;re moving out of balance
              {'\n'}• Data-driven insights to optimize your schedule and activities
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textPrimary }]}>The 1-7 Scale System</ThemedText>
            <ThemedText style={styles.sectionText}>
              We use a clinically-aligned 1-7 scale that matches standard mood and attention assessments. This makes your data valuable for healthcare providers while keeping it simple for daily use.
              {'\n\n'}
              <ThemedText style={styles.bold}>Two Simple Scales:</ThemedText>
              {'\n\n'}
              <ThemedText style={styles.highlight}>Energy Level (1-7)</ThemedText>
              {'\n'}How energized or tired you feel right now
              {'\n\n'}
              <ThemedText style={styles.highlight}>Focus Level (1-7)</ThemedText>
              {'\n'}How clear and concentrated your thinking feels
              {'\n\n'}
              <ThemedText style={styles.bold}>Why 1-7?</ThemedText>
              {'\n\n'}
              • Matches clinical assessment tools used by healthcare providers
              {'\n'}• Provides enough granularity to detect meaningful changes
              {'\n'}• Simple enough for quick daily check-ins
              {'\n'}• Allows for statistical analysis of patterns over time
              {'\n\n'}
              <ThemedText style={styles.bold}>The Three Performance Zones:</ThemedText>
              {'\n\n'}
              <ThemedText style={styles.highlight}>Levels 1-3: Recovery Zone</ThemedText>
              {'\n'}• Time for rest, self-care, and gentle activities
              {'\n'}• Focus on restoration rather than performance
              {'\n\n'}
              <ThemedText style={styles.highlight}>Levels 4-5: Flow Zone</ThemedText>
              {'\n'}• Optimal performance and decision-making
              {'\n'}• Sustainable productivity without burnout
              {'\n\n'}
              <ThemedText style={styles.highlight}>Levels 6-7: High Intensity Zone</ThemedText>
              {'\n'}• Good for physical activities or creative bursts
              {'\n'}• Monitor for sustainability and balance
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textPrimary }]}>Energy Levels (1-7)</ThemedText>
            <ThemedText style={styles.sectionText}>
              <ThemedText style={styles.bold}>Level 1: Extremely Low Energy</ThemedText>
              {'\n'}• Exhausted, struggling with basic tasks
              {'\n'}• Need immediate rest or recovery
              {'\n'}• Difficulty maintaining focus or motivation
              {'\n\n'}
              <ThemedText style={styles.bold}>Level 2: Very Low Energy</ThemedText>
              {'\n'}• Sluggish, minimal motivation
              {'\n'}• Can manage simple tasks but need frequent breaks
              {'\n'}• Seeking comfort and gentle activities
              {'\n\n'}
              <ThemedText style={styles.bold}>Level 3: Below Average Energy</ThemedText>
              {'\n'}• Tired but functional
              {'\n'}• Can complete routine tasks with effort
              {'\n'}• May benefit from energizing activities
              {'\n\n'}
              <ThemedText style={styles.bold}>Level 4: Balanced Energy</ThemedText>
              {'\n'}• Steady and sustainable
              {'\n'}• Ready for most activities and challenges
              {'\n'}• Optimal foundation for Flow State
              {'\n\n'}
              <ThemedText style={styles.bold}>Level 5: Good Energy</ThemedText>
              {'\n'}• Motivated and engaged
              {'\n'}• Feeling capable and confident
              {'\n'}• Excellent for productive work
              {'\n\n'}
              <ThemedText style={styles.bold}>Level 6: High Energy</ThemedText>
              {'\n'}• Very motivated, highly productive
              {'\n'}• May feel restless or need physical outlet
              {'\n'}• Great for challenging projects
              {'\n\n'}
              <ThemedText style={styles.bold}>Level 7: Peak Energy</ThemedText>
              {'\n'}• Maximum drive (watch for sustainability)
              {'\n'}• Intense, possibly overwhelming energy
              {'\n'}• Monitor for signs of becoming unsustainable
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textPrimary }]}>Focus Levels (1-7)</ThemedText>
            <ThemedText style={styles.sectionText}>
              <ThemedText style={styles.bold}>Level 1: Cannot Concentrate</ThemedText>
              {'\n'}• Thoughts scattered, unable to complete tasks
              {'\n'}• Mind feels chaotic or foggy
              {'\n'}• Difficulty following conversations or instructions
              {'\n\n'}
              <ThemedText style={styles.bold}>Level 2: Very Poor Focus</ThemedText>
              {'\n'}• Easily distracted, difficulty following conversations
              {'\n'}• Simple tasks take much longer than usual
              {'\n'}• Mind jumping between thoughts constantly
              {'\n\n'}
              <ThemedText style={styles.bold}>Level 3: Below Average Focus</ThemedText>
              {'\n'}• Some distraction, tasks take longer
              {'\n'}• Can focus with extra effort and structure
              {'\n'}• Occasional wandering thoughts
              {'\n\n'}
              <ThemedText style={styles.bold}>Level 4: Balanced Focus</ThemedText>
              {'\n'}• Can complete routine tasks normally
              {'\n'}• Clear, directed attention when needed
              {'\n'}• Optimal foundation for Flow State
              {'\n\n'}
              <ThemedText style={styles.bold}>Level 5: Good Focus</ThemedText>
              {'\n'}• Engaged with tasks, productive
              {'\n'}• Excellent mental clarity and organization
              {'\n'}• Can tackle complex challenges effectively
              {'\n\n'}
              <ThemedText style={styles.bold}>Level 6: High Focus</ThemedText>
              {'\n'}• Deeply engaged, time passes quickly
              {'\n'}• May experience tunnel vision on details
              {'\n'}• Very concentrated attention
              {'\n\n'}
              <ThemedText style={styles.bold}>Level 7: Intense Focus</ThemedText>
              {'\n'}• Completely absorbed (ensure breaks)
              {'\n'}• Extreme concentration on single tasks
              {'\n'}• May miss other important information
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textPrimary }]}>Understanding Flow State</ThemedText>
            <ThemedText style={styles.sectionText}>
              Your Flow State occurs when both Energy and Focus are at levels 4-5 (balanced and sustainable). This is your optimal performance zone where you feel engaged but not overwhelmed, energised but not hyperactive.
              {'\n\n'}
              <ThemedText style={styles.bold}>Characteristics of Flow State:</ThemedText>
              {'\n\n'}
              • Complete immersion in activities
              {'\n'}• Time seems to pass differently (often faster)
              {'\n'}• Effortless concentration and clarity
              {'\n'}• Balanced challenge and skill level
              {'\n'}• Sustainable productivity without burnout
              {'\n'}• Natural motivation and engagement
              {'\n\n'}
              <ThemedText style={styles.bold}>Why Levels 4-5?</ThemedText>
              {'\n\n'}
              <ThemedText style={styles.highlight}>Energy Level 4-5:</ThemedText>
              {'\n'}• Steady, sustainable energy
              {'\n'}• Neither tired nor overstimulated
              {'\n'}• Ready for sustained mental work
              {'\n\n'}
              <ThemedText style={styles.highlight}>Focus Level 4-5:</ThemedText>
              {'\n'}• Clear, directed attention
              {'\n'}• Can concentrate without strain
              {'\n'}• Neither scattered nor tunnel-visioned
              {'\n\n'}
              <ThemedText style={styles.bold}>Maintaining Flow State:</ThemedText>
              {'\n\n'}
              • Take regular breaks before fatigue sets in
              {'\n'}• Match task difficulty to your current capacity
              {'\n'}• Minimize distractions during Flow periods
              {'\n'}• Notice early signs of moving out of balance
              {'\n'}• Use your data to predict optimal Flow windows
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pattern Recognition</ThemedText>
            <ThemedText style={styles.sectionText}>
              After 2-3 weeks of tracking, you&apos;ll see patterns emerge:
              {'\n\n'}
              <ThemedText style={styles.bold}>Time of day when you naturally enter flow</ThemedText>
              {'\n'}• Morning energy peaks vs. afternoon focus periods
              {'\n'}• Post-meal energy dips and recovery times
              {'\n'}• Evening wind-down patterns
              {'\n\n'}
              <ThemedText style={styles.bold}>Activities that promote or disrupt flow</ThemedText>
              {'\n'}• Exercise timing and intensity effects
              {'\n'}• Caffeine and meal impacts on performance
              {'\n'}• Social interactions and their influence
              {'\n'}• Work environment and task type correlations
              {'\n\n'}
              <ThemedText style={styles.bold}>Your personal energy/focus cycles</ThemedText>
              {'\n'}• Weekly rhythms (weekday vs. weekend patterns)
              {'\n'}• Seasonal variations in energy levels
              {'\n'}• Stress response and recovery patterns
              {'\n'}• Sleep quality impacts on next-day performance
              {'\n\n'}
              <ThemedText style={styles.bold}>Early warning signs of moving out of balance</ThemedText>
              {'\n'}• Declining focus before energy crashes
              {'\n'}• Energy spikes that lead to burnout
              {'\n'}• Patterns that precede difficult days
              {'\n'}• Recovery time needed after high-intensity periods
              {'\n\n'}
              <ThemedText style={styles.highlight}>Pro Tip:</ThemedText> Use the notes feature to record what you were doing, eating, or feeling. This context makes patterns much clearer and more actionable.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textPrimary }]}>Data Privacy & Sharing</ThemedText>
            <ThemedText style={styles.sectionText}>
              Your data stays on your device unless you choose to export it. Export options include CSV for spreadsheets or JSON for clinical systems. All exports can be anonymised for privacy.
              {'\n\n'}
              <ThemedText style={styles.bold}>Privacy Protection:</ThemedText>
              {'\n\n'}
              • All data is stored locally on your device
              {'\n'}• No data is sent to external servers without your explicit action
              {'\n'}• You have complete control over what data you share and with whom
              {'\n'}• Notes and personal information remain private unless you choose to export
              {'\n\n'}
              <ThemedText style={styles.bold}>Export Formats:</ThemedText>
              {'\n\n'}
              <ThemedText style={styles.highlight}>CSV (Spreadsheet Format):</ThemedText>
              {'\n'}• Opens in Excel, Google Sheets, or Numbers
              {'\n'}• Easy to create charts and analyze trends
              {'\n'}• Perfect for personal analysis or sharing with healthcare providers
              {'\n\n'}
              <ThemedText style={styles.highlight}>JSON (Clinical Format):</ThemedText>
              {'\n'}• Structured data for clinical systems
              {'\n'}• Includes metadata and timestamps
              {'\n'}• Compatible with healthcare data analysis tools
              {'\n\n'}
              <ThemedText style={styles.bold}>Export Options:</ThemedText>
              {'\n\n'}
              • Choose specific date ranges for targeted reports
              {'\n'}• Include or exclude personal notes for privacy
              {'\n'}• Anonymize data by removing timestamps and notes
              {'\n'}• Select summary statistics vs. detailed entries
              {'\n\n'}
              <ThemedText style={styles.bold}>Sharing with Healthcare Providers:</ThemedText>
              {'\n\n'}
              Your FlowState data can provide valuable objective insights for:
              {'\n'}• Psychiatrists managing ADHD or mood medications
              {'\n'}• Therapists tracking progress and patterns
              {'\n'}• Primary care doctors assessing overall wellness
              {'\n'}• Specialists monitoring treatment effectiveness
              {'\n\n'}
              <ThemedText style={styles.highlight}>Tip:</ThemedText> Export a 2-4 week summary before appointments to supplement your subjective descriptions with objective data patterns.
            </ThemedText>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    fontStyle: 'italic',
  },
  content: {
    gap: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '700',
  },
  highlight: {
    fontWeight: '600',
    fontSize: 16,
  },
});