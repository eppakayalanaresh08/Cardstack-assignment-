import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import CardStackCarousel from './src/components/CardStackCarousel';

const SCREEN_BACKGROUND = '#0A0A0F';

function AppContent() {
  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.page}>
        <Text style={styles.headline}>Events</Text>
        <Text style={styles.subheadline}>Swipe through the cards to browse.</Text>

        <CardStackCarousel />
      </View>
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
  page: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  headline: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 34,
    marginBottom: 6,
  },
  subheadline: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 22,
  },
});

export default App;
