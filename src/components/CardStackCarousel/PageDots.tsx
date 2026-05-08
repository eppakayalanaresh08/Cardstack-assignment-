import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type PageDotsProps = {
  activeIndex: number;
  listIndex: number;
  total: number;
};

type DotProps = {
  active: boolean;
  listMode: boolean;
};

const DOT_SIZE = 7;
const ACTIVE_WIDTH = 20;
const INACTIVE_COLOR = '#4B5563';
const ACTIVE_COLOR = '#6366F1';
const DOT_SPRING = {
  damping: 18,
  stiffness: 220,
};

function Dot({ active, listMode }: DotProps) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, DOT_SPRING);
  }, [active, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    if (listMode) {
      return {
        backgroundColor: interpolateColor(
          progress.value,
          [0, 1],
          [INACTIVE_COLOR, ACTIVE_COLOR],
        ),
        opacity: interpolate(progress.value, [0, 1], [0.8, 1]),
        shadowColor: ACTIVE_COLOR,
        shadowOpacity: interpolate(progress.value, [0, 1], [0, 0.35]),
        shadowRadius: interpolate(progress.value, [0, 1], [0, 8]),
        transform: [
          { rotate: '45deg' },
          { scale: interpolate(progress.value, [0, 1], [1, 1.08]) },
        ],
      };
    }

    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [INACTIVE_COLOR, ACTIVE_COLOR],
      ),
      borderRadius: interpolate(progress.value, [0, 1], [DOT_SIZE / 2, 10]),
      width: interpolate(progress.value, [0, 1], [DOT_SIZE, ACTIVE_WIDTH]),
    };
  });

  return (
    <Animated.View
      style={[
        styles.dotBase,
        listMode ? styles.diamondDot : styles.circleDot,
        animatedStyle,
      ]}
    />
  );
}

function PageDots({ activeIndex, listIndex, total }: PageDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => (
        <Dot
          key={`carousel-dot-${index}`}
          active={index === activeIndex}
          listMode={index === listIndex}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 18,
  },
  dotBase: {
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    height: DOT_SIZE,
    ...Platform.select({
      android: {
        elevation: 0,
      },
      ios: {
        shadowOffset: {
          height: 0,
          width: 0,
        },
      },
    }),
  },
  circleDot: {
    borderRadius: DOT_SIZE / 2,
  },
  diamondDot: {
    width: DOT_SIZE,
  },
});

export default PageDots;
