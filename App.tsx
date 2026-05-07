import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import EventRecommendationDeck from './src/components/EventRecommendationDeck';

const SCREEN_BACKGROUND = '#081626';

function AppContent() {
  const insets = useSafeAreaInsets();
  const [pageScrollEnabled, setPageScrollEnabled] = useState(true);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={[styles.ambientOrb, styles.ambientOrbOne]} />
      <View style={[styles.ambientOrb, styles.ambientOrbTwo]} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 28 },
        ]}
        directionalLockEnabled
        scrollEnabled={pageScrollEnabled}
        showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          <Text style={styles.kicker}>Card Stack Motion Assignment</Text>
          <Text style={styles.headline}>
            A recommendation stack tuned for gesture feel, layered depth, and a
            clean handoff into list mode.
          </Text>

          <View style={styles.bubble}>
            <Text style={styles.assistantLabel}>Assistant</Text>
            <Text style={styles.assistantCopy}>
              I found a few event ideas that match your recent saves. Start
              swiping through the spotlight cards, then keep going to collapse
              the rest into a list.
            </Text>

            <EventRecommendationDeck
              onSwipeActiveChange={isActive => {
                setPageScrollEnabled(!isActive);
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar
          animated
          barStyle="light-content"
          backgroundColor={SCREEN_BACKGROUND}
        />
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    backgroundColor: SCREEN_BACKGROUND,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  ambientOrb: {
    borderRadius: 180,
    position: 'absolute',
  },
  ambientOrbOne: {
    backgroundColor: 'rgba(102, 182, 255, 0.12)',
    height: 260,
    right: -84,
    top: -22,
    width: 260,
  },
  ambientOrbTwo: {
    backgroundColor: 'rgba(255, 194, 123, 0.08)',
    bottom: 90,
    height: 220,
    left: -70,
    width: 220,
  },
  kicker: {
    color: '#8EA7C8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  headline: {
    color: '#F5F7FB',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 36,
    marginBottom: 26,
    maxWidth: 520,
  },
  bubble: {
    backgroundColor: 'rgba(12, 28, 45, 0.92)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 34,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: 4,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
  },
  assistantLabel: {
    color: '#F4C77D',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  assistantCopy: {
    color: '#C6D6EA',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 520,
  },
});

export default App;
