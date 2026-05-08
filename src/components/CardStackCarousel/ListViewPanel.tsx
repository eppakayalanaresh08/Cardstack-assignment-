import React, { useEffect } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import type { ListModeEntry } from './types';

type ListViewPanelProps = {
  enterKey: number;
  entry: ListModeEntry;
  height: number;
  preview?: boolean;
  reducedMotion?: boolean;
  width: number;
};

type ListRowProps = {
  delayMs: number;
  name: string;
  preview: boolean;
  price: string;
  reducedMotion: boolean;
  sub: string;
  emoji: string;
  triggerKey: number;
};

const ROW_ANIMATION_DURATION = 260;
const ROW_EASING = Easing.out(Easing.cubic);

function ListRow({
  delayMs,
  emoji,
  name,
  preview,
  price,
  reducedMotion,
  sub,
  triggerKey,
}: ListRowProps) {
  const progress = useSharedValue(1);

  useEffect(() => {
    if (preview || reducedMotion) {
      progress.value = 1;
      return;
    }

    progress.value = 0;
    progress.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: ROW_ANIMATION_DURATION,
        easing: ROW_EASING,
      }),
    );
  }, [delayMs, preview, progress, reducedMotion, triggerKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [10, 0]),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.row, animatedStyle]}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{emoji}</Text>
      </View>

      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={styles.rowName}>
          {name}
        </Text>
        <Text numberOfLines={1} style={styles.rowSub}>
          {sub}
        </Text>
      </View>

      <Text style={styles.rowPrice}>{price}</Text>
    </Animated.View>
  );
}

function ListViewPanel({
  enterKey,
  entry,
  height,
  preview = false,
  reducedMotion = false,
  width,
}: ListViewPanelProps) {
  const panelStyle: ViewStyle = {
    borderRadius: 20,
    height,
    width,
  };

  return (
    <View style={[styles.panelWrap, panelStyle]}>
      <View style={styles.panelGlow} />

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>List mode</Text>
          <Text style={styles.heading}>Keep browsing</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>3 more</Text>
        </View>
      </View>

      <View style={styles.rows}>
        {entry.rows.map((row, index) => (
          <ListRow
            key={`${entry.id}-${row.name}`}
            delayMs={Math.min(index * 15, 30)}
            emoji={row.emoji}
            name={row.name}
            preview={preview}
            price={row.price}
            reducedMotion={reducedMotion}
            sub={row.sub}
            triggerKey={enterKey}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panelWrap: {
    backgroundColor: '#11121A',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    ...Platform.select({
      android: {
        elevation: 9,
      },
      ios: {
        shadowColor: '#02030A',
        shadowOffset: {
          height: 14,
          width: 0,
        },
        shadowOpacity: 0.24,
        shadowRadius: 20,
      },
    }),
  },
  panelGlow: {
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderRadius: 80,
    height: 130,
    position: 'absolute',
    right: -28,
    top: -32,
    width: 130,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  eyebrow: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: 'rgba(99,102,241,0.16)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '700',
  },
  rows: {
    gap: 8,
  },
  row: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 46,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(99,102,241,0.18)',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    marginRight: 10,
    width: 36,
  },
  iconText: {
    fontSize: 17,
  },
  rowCopy: {
    flex: 1,
    paddingRight: 8,
  },
  rowName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  rowSub: {
    color: '#8B93A6',
    fontSize: 11,
    fontWeight: '500',
  },
  rowPrice: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ListViewPanel;
