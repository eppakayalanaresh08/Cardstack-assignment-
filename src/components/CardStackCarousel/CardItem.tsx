import React from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import type { EventCard } from './types';

type GradientPoint = {
  x: number;
  y: number;
};

type GradientLayerProps = React.PropsWithChildren<{
  colors: readonly string[];
  end?: GradientPoint;
  start?: GradientPoint;
  style?: StyleProp<ViewStyle>;
}>;

type CardItemProps = {
  card: EventCard;
  height: number;
  radius: number;
  width: number;
};

function GradientLayer({
  children,
  colors,
  style,
}: GradientLayerProps) {
  return (
    <View style={[style, { backgroundColor: colors[0] }]}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.fallbackGradientTint,
          { backgroundColor: colors[1] },
        ]}
      />
      {children}
    </View>
  );
}

function CardItem({ card, height, radius, width }: CardItemProps) {
  return (
    <View
      style={[
        styles.shadowWrap,
        {
          borderRadius: radius,
          height,
          width,
        },
      ]}>
      <GradientLayer
        colors={card.bgColors}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={[
          styles.card,
          {
            borderRadius: radius,
          },
        ]}>
        <GradientLayer
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']}
          end={{ x: 0.5, y: 1 }}
          start={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.glow} />

        <View style={styles.headerRow}>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{card.tag}</Text>
          </View>

          <View style={styles.emojiWrap}>
            <Text style={styles.emojiText}>{card.emoji}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text numberOfLines={2} style={styles.title}>
            {card.name}
          </Text>

          <View style={styles.metaRow}>
            <Text numberOfLines={1} style={styles.metaText}>
              {card.date}
            </Text>
            <View style={styles.metaDot} />
            <Text numberOfLines={1} style={styles.metaText}>
              {card.venue}
            </Text>
          </View>

          <Text style={styles.price}>{card.price}</Text>
        </View>
      </GradientLayer>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    ...Platform.select({
      android: {
        elevation: 12,
      },
      ios: {
        shadowColor: '#02030A',
        shadowOffset: {
          height: 16,
          width: 0,
        },
        shadowOpacity: 0.3,
        shadowRadius: 24,
      },
    }),
  },
  card: {
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  fallbackGradientTint: {
    opacity: 0.45,
  },
  glow: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    height: 120,
    position: 'absolute',
    right: -36,
    top: -36,
    width: 120,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tagPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  emojiWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 12,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  emojiText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 20,
    marginBottom: 10,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  metaText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '500',
  },
  metaDot: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 999,
    height: 3,
    marginHorizontal: 8,
    width: 3,
  },
  price: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default CardItem;
