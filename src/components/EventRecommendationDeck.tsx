import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type CompactEvent = {
  id: string;
  title: string;
  detail: string;
  badge: string;
};

type CardEntry = {
  type: 'card';
  id: string;
  kicker: string;
  title: string;
  time: string;
  venue: string;
  distance: string;
  price: string;
  blurb: string;
  tags: string[];
  panel: string;
  accent: string;
  glow: string;
};

type ListEntry = {
  type: 'list';
  id: string;
  title: string;
  subtitle: string;
  rows: CompactEvent[];
};

type StackEntry = CardEntry | ListEntry;
type Direction = -1 | 1;
type FadeTransition = {
  from: number;
  to: number;
};

const STACK_ENTRIES: StackEntry[] = [
  {
    type: 'card',
    id: 'jazz-loft',
    kicker: 'Tonight',
    title: 'Rooftop jazz under the city lights',
    time: '7:30 PM',
    venue: 'The Lantern Loft',
    distance: '0.9 mi',
    price: '$22',
    blurb:
      'An intimate trio set with velvet vocals, skyline views, and just enough drama for a spontaneous midweek plan.',
    tags: ['Live music', 'Cozy', 'Date night'],
    panel: '#17324A',
    accent: '#FFB25B',
    glow: '#F5C78E',
  },
  {
    type: 'card',
    id: 'ceramics-club',
    kicker: 'Tomorrow',
    title: 'Ceramics social with espresso and playlists',
    time: '6:15 PM',
    venue: 'Kiln House Studio',
    distance: '1.4 mi',
    price: '$18',
    blurb:
      'Low-pressure wheel time, fast pours from the in-house bar, and the kind of crowd that actually talks to strangers.',
    tags: ['Hands-on', 'Small group', 'Creative'],
    panel: '#344F39',
    accent: '#F3C98B',
    glow: '#CEDB9D',
  },
  {
    type: 'card',
    id: 'vinyl-night',
    kicker: 'Friday',
    title: 'Vinyl listening bar takeover',
    time: '8:00 PM',
    venue: 'Signal Room',
    distance: '2.1 mi',
    price: '$16',
    blurb:
      'Guest selectors are spinning soul and left-field disco, with a hidden-menu cocktail pairings list for the night.',
    tags: ['Late-night', 'Cocktails', 'DJ set'],
    panel: '#4B2952',
    accent: '#F7A6D5',
    glow: '#D6A0F7',
  },
  {
    type: 'card',
    id: 'gallery-supper',
    kicker: 'Saturday',
    title: 'After-hours gallery supper club',
    time: '7:00 PM',
    venue: 'North Passage',
    distance: '2.7 mi',
    price: '$34',
    blurb:
      'A chef pop-up tucked inside a modern art opening, with shared plates and a short artist talk between courses.',
    tags: ['Food', 'Art', 'Special'],
    panel: '#603726',
    accent: '#F4BC7F',
    glow: '#F8D9A8',
  },
  {
    type: 'card',
    id: 'sunrise-run',
    kicker: 'Sunday',
    title: 'Golden-hour run club and breakfast',
    time: '7:15 AM',
    venue: 'River Promenade',
    distance: '0.6 mi',
    price: 'Free',
    blurb:
      'A social 5K paced for conversation, then coffee and cardamom buns from a bakery cart waiting at the finish.',
    tags: ['Wellness', 'Morning', 'Community'],
    panel: '#1D5563',
    accent: '#FFD37B',
    glow: '#A6E0F5',
  },
  {
    type: 'list',
    id: 'more-picks',
    title: 'A few more that fit your vibe',
    subtitle: 'Less commitment, still interesting.',
    rows: [
      {
        id: 'stargazing',
        title: 'Observatory terrace stargazing',
        detail: 'Mon 8:45 PM  •  West Ridge',
        badge: 'Quiet',
      },
      {
        id: 'film-club',
        title: 'Indie film club with director Q&A',
        detail: 'Tue 7:00 PM  •  Mercer Hall',
        badge: 'Talkback',
      },
      {
        id: 'market-night',
        title: 'Night market ramen crawl',
        detail: 'Wed 6:30 PM  •  Little Harbor',
        badge: 'Casual',
      },
      {
        id: 'book-swap',
        title: 'Pocket book swap and wine bar hour',
        detail: 'Thu 6:00 PM  •  Fable & Co.',
        badge: 'Soft launch',
      },
    ],
  },
];

const SWIPE_ENTRIES = STACK_ENTRIES.slice(0, -1);
const LAST_INDEX = SWIPE_ENTRIES.length - 1;
const MAX_LIST_ROWS = STACK_ENTRIES.reduce((max, entry) => {
  if (entry.type !== 'list') {
    return max;
  }

  return Math.max(max, entry.rows.length);
}, 0);
const COMMIT_DURATION = 240;
const REDUCED_MOTION_DURATION = 120;
const SPRING_BACK_CONFIG = {
  damping: 24,
  stiffness: 260,
  mass: 0.85,
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampWorklet(value: number, min: number, max: number) {
  'worklet';

  return Math.min(Math.max(value, min), max);
}

function rubberBand(distance: number, dimension: number) {
  'worklet';

  const safeDimension = Math.max(dimension, 1);
  const scaled = Math.abs(distance) / safeDimension;
  return (distance * 0.55) / (scaled * 0.9 + 1);
}

function EventRecommendationDeck({
  onSwipeActiveChange,
}: {
  onSwipeActiveChange?: (isActive: boolean) => void;
}) {
  const [restIndex, setRestIndex] = useState(0);
  const [indicatorIndex, setIndicatorIndex] = useState(0);
  const [stackWidth, setStackWidth] = useState(320);
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);
  const [fadeTransition, setFadeTransition] = useState<FadeTransition | null>(
    null,
  );
  const { height: viewportHeight } = useWindowDimensions();

  const pendingIndexRef = useRef<number | null>(null);
  const fadeTransitionRef = useRef<FadeTransition | null>(null);
  const swipeActiveRef = useRef(false);

  const dragX = useSharedValue(0);
  const fadeProgress = useSharedValue(1);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted) {
        setReducedMotionEnabled(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      enabled => {
        setReducedMotionEnabled(enabled);
      },
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);

    if (nextWidth > 0 && nextWidth !== stackWidth) {
      setStackWidth(nextWidth);
    }
  }, [stackWidth]);

  const cardWidth = Math.max(stackWidth, 220);
  const incomingOffset = clampNumber(cardWidth * 0.18, 44, 68);
  const cardHeight = clampNumber(
    Math.max(cardWidth * 1.24, viewportHeight * 0.46),
    360,
    430,
  );
  const listHeight = clampNumber(132 + MAX_LIST_ROWS * 62, 352, 430);
  const stageHeight = Math.max(cardHeight, listHeight) + 6;
  const revealDistance = cardWidth * 0.72;
  const commitThreshold = cardWidth * 0.38;
  const offscreenDistance = cardWidth + 72;

  const restEntry = SWIPE_ENTRIES[restIndex];
  const previousEntry = restIndex > 0 ? SWIPE_ENTRIES[restIndex - 1] : null;
  const nextEntry = restIndex < LAST_INDEX ? SWIPE_ENTRIES[restIndex + 1] : null;

  const finishCommit = useCallback((target: number) => {
    pendingIndexRef.current = null;
    setRestIndex(target);
    setIndicatorIndex(target);
  }, []);

  const finishSnapBack = useCallback((index: number) => {
    pendingIndexRef.current = null;
    setIndicatorIndex(index);
  }, []);

  const finishReducedMotionCommit = useCallback((target: number) => {
    pendingIndexRef.current = null;
    fadeTransitionRef.current = null;
    fadeProgress.value = 1;
    setFadeTransition(null);
    setRestIndex(target);
    setIndicatorIndex(target);
  }, [fadeProgress]);

  const flushReducedMotionTransition = useCallback(() => {
    const activeTransition = fadeTransitionRef.current;

    if (!activeTransition) {
      return;
    }

    cancelAnimation(fadeProgress);
    fadeProgress.value = 1;
    pendingIndexRef.current = null;
    fadeTransitionRef.current = null;
    setFadeTransition(null);
    setRestIndex(activeTransition.to);
    setIndicatorIndex(activeTransition.to);
  }, [fadeProgress]);

  const updateSwipeActive = useCallback((isActive: boolean) => {
    if (swipeActiveRef.current === isActive) {
      return;
    }

    swipeActiveRef.current = isActive;
    onSwipeActiveChange?.(isActive);
  }, [onSwipeActiveChange]);

  const commitToIndex = useCallback((target: number, direction: Direction) => {
    pendingIndexRef.current = target;
    setIndicatorIndex(target);

    if (reducedMotionEnabled) {
      const transition = { from: restIndex, to: target };
      fadeTransitionRef.current = transition;
      setFadeTransition(transition);
      cancelAnimation(fadeProgress);
      fadeProgress.value = 0;
      fadeProgress.value = withTiming(
        1,
        {
          duration: REDUCED_MOTION_DURATION,
          easing: Easing.linear,
        },
        finished => {
          if (finished) {
            runOnJS(finishReducedMotionCommit)(target);
          }
        },
      );
      return;
    }

    cancelAnimation(dragX);
    dragX.value = withTiming(
      direction < 0 ? -offscreenDistance : offscreenDistance,
      {
        duration: COMMIT_DURATION,
        easing: Easing.out(Easing.cubic),
      },
      finished => {
        if (finished) {
          dragX.value = 0;
          runOnJS(finishCommit)(target);
        }
      },
    );
  }, [
    dragX,
    fadeProgress,
    finishCommit,
    finishReducedMotionCommit,
    offscreenDistance,
    reducedMotionEnabled,
    restIndex,
  ]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-6, 6])
        .failOffsetY([-22, 22])
        .onBegin(() => {
          cancelAnimation(dragX);

          if (reducedMotionEnabled) {
            runOnJS(flushReducedMotionTransition)();
          }
        })
        .onStart(() => {
          runOnJS(updateSwipeActive)(true);
        })
        .onUpdate(event => {
          const hasPrevious = restIndex > 0;
          const hasNext = restIndex < LAST_INDEX;
          const translationX = event.translationX;

          if (restEntry.type === 'list') {
            dragX.value =
              translationX > 0 && hasPrevious
                ? translationX
                : rubberBand(translationX, cardWidth);
            return;
          }

          if (translationX < 0) {
            dragX.value = hasNext
              ? translationX
              : rubberBand(translationX, cardWidth);
            return;
          }

          if (translationX > 0) {
            dragX.value = hasPrevious
              ? translationX
              : rubberBand(translationX, cardWidth);
            return;
          }

          dragX.value = 0;
        })
        .onEnd(event => {
          const hasPrevious = restIndex > 0;
          const hasNext = restIndex < LAST_INDEX;
          const shouldAdvance =
            dragX.value < 0 &&
            hasNext &&
            (Math.abs(dragX.value) > commitThreshold || event.velocityX < -900);
          const shouldGoBack =
            dragX.value > 0 &&
            hasPrevious &&
            (dragX.value > commitThreshold || event.velocityX > 900);

          if (shouldAdvance) {
            runOnJS(commitToIndex)(restIndex + 1, -1);
            return;
          }

          if (shouldGoBack) {
            runOnJS(commitToIndex)(restIndex - 1, 1);
            return;
          }

          if (reducedMotionEnabled) {
            dragX.value = 0;
            runOnJS(finishSnapBack)(restIndex);
            return;
          }

          dragX.value = withSpring(0, SPRING_BACK_CONFIG, finished => {
            if (finished) {
              runOnJS(finishSnapBack)(restIndex);
            }
          });
        })
        .onFinalize(() => {
          runOnJS(updateSwipeActive)(false);
        }),
    [
      cardWidth,
      commitThreshold,
      commitToIndex,
      dragX,
      finishSnapBack,
      flushReducedMotionTransition,
      updateSwipeActive,
      reducedMotionEnabled,
      restEntry.type,
      restIndex,
    ],
  );

  const currentCardStyle = useAnimatedStyle(() => {
    if (restEntry.type !== 'card') {
      return { opacity: 0 };
    }

    return {
      opacity: 1,
      transform: [{ translateX: reducedMotionEnabled ? 0 : dragX.value }],
    };
  });

  const previousCardStyle = useAnimatedStyle(() => {
    if (!previousEntry || previousEntry.type !== 'card' || reducedMotionEnabled) {
      return { opacity: 0 };
    }

    const progress = clampWorklet(dragX.value / revealDistance, 0, 1);

    return {
      opacity: interpolate(progress, [0, 0.12, 1], [0, 0.14, 1]),
      transform: [{ translateX: interpolate(progress, [0, 1], [-incomingOffset, 0]) }],
    };
  }, [dragX, incomingOffset, previousEntry, reducedMotionEnabled, revealDistance]);

  const nextCardStyle = useAnimatedStyle(() => {
    if (restEntry.type !== 'card' || nextEntry?.type !== 'card' || reducedMotionEnabled) {
      return { opacity: 0 };
    }

    const forwardProgress = clampWorklet(-dragX.value / revealDistance, 0, 1);

    return {
      opacity: interpolate(forwardProgress, [0, 0.12, 1], [0, 0.14, 1]),
      transform: [{ translateX: interpolate(forwardProgress, [0, 1], [incomingOffset, 0]) }],
    };
  }, [
    dragX,
    incomingOffset,
    nextEntry,
    reducedMotionEnabled,
    restEntry.type,
    revealDistance,
  ]);

  const listPreviewStyle = useAnimatedStyle(() => {
    if (restEntry.type !== 'card' || nextEntry?.type !== 'list' || reducedMotionEnabled) {
      return { opacity: 0 };
    }

    const forwardProgress = clampWorklet(-dragX.value / revealDistance, 0, 1);

    return {
      opacity: interpolate(forwardProgress, [0, 0.12, 1], [0, 0.16, 1]),
      transform: [{ translateX: interpolate(forwardProgress, [0, 1], [incomingOffset, 0]) }],
    };
  }, [
    dragX,
    incomingOffset,
    nextEntry,
    reducedMotionEnabled,
    restEntry.type,
    revealDistance,
  ]);

  const currentListStyle = useAnimatedStyle(() => {
    if (restEntry.type !== 'list') {
      return { opacity: 0 };
    }

    const backwardProgress = clampWorklet(dragX.value / revealDistance, 0, 1);

    return {
      opacity: interpolate(backwardProgress, [0, 1], [1, 0.92]),
      transform: [{ translateX: reducedMotionEnabled ? 0 : dragX.value }],
    };
  });

  const fadeOutStyle = useAnimatedStyle(() => ({
    opacity: 1 - fadeProgress.value,
  }));

  const fadeInStyle = useAnimatedStyle(() => ({
    opacity: fadeProgress.value,
  }));

  const renderStaticState = (index: number) => {
    const entry = SWIPE_ENTRIES[index];

    if (entry.type === 'list') {
      return (
        <View style={styles.absoluteFill}>
          <EventList entry={entry} width={stackWidth} height={listHeight} />
        </View>
      );
    }

    return (
      <View style={styles.absoluteFill}>
        <View style={styles.layer}>
          <EventCard entry={entry} width={cardWidth} height={cardHeight} />
        </View>
      </View>
    );
  };

  return (
    <View testID="event-recommendation-deck">
      <Text style={styles.sectionEyebrow}>AI picks for tonight</Text>
      <Text style={styles.sectionTitle}>
        Swipe through the cards one by one with no stacked preview.
      </Text>

      <GestureDetector gesture={panGesture}>
        <View style={styles.deckShell} onLayout={handleLayout}>
          <View style={[styles.stage, { height: stageHeight }]}>
            {reducedMotionEnabled && fadeTransition ? (
              <>
                <Animated.View style={[styles.absoluteFill, fadeOutStyle]}>
                  {renderStaticState(fadeTransition.from)}
                </Animated.View>
                <Animated.View style={[styles.absoluteFill, fadeInStyle]}>
                  {renderStaticState(fadeTransition.to)}
                </Animated.View>
              </>
            ) : reducedMotionEnabled ? (
              renderStaticState(restIndex)
            ) : (
              <>
                {previousEntry?.type === 'card' ? (
                  <Animated.View style={[styles.layer, previousCardStyle]}>
                    <EventCard
                      entry={previousEntry}
                      width={cardWidth}
                      height={cardHeight}
                    />
                  </Animated.View>
                ) : null}

                {nextEntry?.type === 'card' ? (
                  <Animated.View style={[styles.layer, nextCardStyle]}>
                    <EventCard
                      entry={nextEntry}
                      width={cardWidth}
                      height={cardHeight}
                    />
                  </Animated.View>
                ) : null}

                {nextEntry?.type === 'list' ? (
                  <Animated.View style={[styles.layer, listPreviewStyle]}>
                    <EventList
                      entry={nextEntry}
                      width={stackWidth}
                      height={listHeight}
                      preview
                    />
                  </Animated.View>
                ) : null}

                {restEntry.type === 'list' ? (
                  <Animated.View style={[styles.layer, currentListStyle]}>
                    <EventList
                      entry={restEntry}
                      width={stackWidth}
                      height={listHeight}
                    />
                  </Animated.View>
                ) : null}

                {restEntry.type === 'card' ? (
                  <Animated.View style={[styles.layer, currentCardStyle]}>
                    <EventCard
                      entry={restEntry}
                      width={cardWidth}
                      height={cardHeight}
                    />
                  </Animated.View>
                ) : null}
              </>
            )}
          </View>
        </View>
      </GestureDetector>

      <PageDots activeIndex={indicatorIndex} total={SWIPE_ENTRIES.length} />

      <Text style={styles.helperText}>
        Drag left for the next card. Drag right to revisit the previous card.
      </Text>
    </View>
  );
}

function EventCard({
  entry,
  width,
  height,
}: {
  entry: CardEntry;
  width: number;
  height: number;
}) {
  const largeGlowStyle = [
    styles.cardGlowLarge,
    styles.cardGlowLargePosition,
    { backgroundColor: entry.glow },
  ];
  const smallGlowStyle = [
    styles.cardGlowSmall,
    styles.cardGlowSmallPosition,
    { backgroundColor: entry.accent },
  ];

  return (
    <View
      style={[
        styles.card,
        {
          width,
          height,
          backgroundColor: entry.panel,
          borderColor: `${entry.glow}2C`,
        },
      ]}>
      <View style={largeGlowStyle} />
      <View style={smallGlowStyle} />

      <View style={styles.cardHeader}>
        <View style={[styles.token, { backgroundColor: entry.accent }]}>
          <Text style={styles.tokenText}>{entry.kicker}</Text>
        </View>
        <Text style={styles.priceText}>{entry.price}</Text>
      </View>

      <Text style={styles.cardTitle}>{entry.title}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Starts</Text>
          <Text style={styles.metaValue}>{entry.time}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Place</Text>
          <Text style={styles.metaValue}>{entry.venue}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Distance</Text>
          <Text style={styles.metaValue}>{entry.distance}</Text>
        </View>
      </View>

      <Text style={styles.cardBlurb}>{entry.blurb}</Text>

      <View style={styles.tagsRow}>
        {entry.tags.map(tag => (
          <View key={tag} style={styles.tagChip}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerLead}>Why it matches</Text>
        <Text style={styles.footerCopy}>
          Nearby, low-friction, and social without feeling too loud.
        </Text>
      </View>
    </View>
  );
}

function EventList({
  entry,
  width,
  height,
  preview = false,
}: {
  entry: ListEntry;
  width: number;
  height: number;
  preview?: boolean;
}) {
  const listCardStyle = [
    styles.listCard,
    {
      width: Math.max(width, 240),
      height,
      opacity: preview ? 0.98 : 1,
    },
  ];

  return (
    <View style={listCardStyle}>
      <View style={styles.listHeader}>
        <View>
          <Text style={styles.listTitle}>{entry.title}</Text>
          <Text style={styles.listSubtitle}>{entry.subtitle}</Text>
        </View>
        <View style={styles.listModeBadge}>
          <Text style={styles.listModeBadgeText}>List</Text>
        </View>
      </View>

      <View style={styles.rowsColumn}>
        {entry.rows.map((row, index) => (
          <View key={row.id} style={styles.rowItem}>
            <View style={styles.rowIndex}>
              <Text style={styles.rowIndexText}>{index + 1}</Text>
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowDetail}>{row.detail}</Text>
            </View>
            <View style={styles.rowBadge}>
              <Text style={styles.rowBadgeText}>{row.badge}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function PageDots({
  activeIndex,
  total,
}: {
  activeIndex: number;
  total: number;
}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === activeIndex;
        const isListMode = STACK_ENTRIES[index].type === 'list';

        return (
          <View
            key={`dot-${index}`}
            style={[
              styles.dot,
              isListMode ? styles.diamondDot : styles.circleDot,
              isActive ? styles.dotActive : styles.dotInactive,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionEyebrow: {
    color: '#9CB4D3',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#F5F7FB',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 24,
  },
  deckShell: {
    minHeight: 320,
  },
  stage: {
    overflow: 'hidden',
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
  layer: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    ...Platform.select({
      android: {
        elevation: 14,
      },
      ios: {
        shadowColor: '#03111F',
        shadowOpacity: 0.18,
        shadowRadius: 24,
        shadowOffset: {
          width: 0,
          height: 14,
        },
      },
    }),
  },
  cardGlowLarge: {
    borderRadius: 88,
    height: 148,
    opacity: 0.16,
    position: 'absolute',
    width: 148,
  },
  cardGlowLargePosition: {
    right: -44,
    top: -24,
  },
  cardGlowSmall: {
    borderRadius: 50,
    height: 100,
    opacity: 0.1,
    position: 'absolute',
    width: 100,
  },
  cardGlowSmallPosition: {
    bottom: 22,
    left: 18,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  token: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tokenText: {
    color: '#142433',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  priceText: {
    color: '#EAF2FB',
    fontSize: 14,
    fontWeight: '700',
  },
  cardTitle: {
    color: '#FDFDFE',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 33,
    marginBottom: 18,
    maxWidth: '92%',
  },
  metaRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    flexDirection: 'row',
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metaBlock: {
    flex: 1,
  },
  metaLabel: {
    color: 'rgba(234,242,251,0.65)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  metaDivider: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    height: 26,
    marginHorizontal: 10,
    width: 1,
  },
  cardBlurb: {
    color: '#E4EDF8',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  tagText: {
    color: '#F7FAFE',
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    borderTopColor: 'rgba(255,255,255,0.1)',
    borderTopWidth: 1,
    marginTop: 'auto',
    paddingTop: 16,
  },
  footerLead: {
    color: '#F2F6FD',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  footerCopy: {
    color: '#CEDDEE',
    fontSize: 14,
    lineHeight: 19,
  },
  listCard: {
    backgroundColor: '#F5EEDF',
    borderColor: 'rgba(90, 71, 45, 0.08)',
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#2A1C12',
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: {
          width: 0,
          height: 10,
        },
      },
    }),
  },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  listTitle: {
    color: '#2E2418',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  listSubtitle: {
    color: '#79664B',
    fontSize: 13,
    fontWeight: '600',
  },
  listModeBadge: {
    backgroundColor: '#E6D4B7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  listModeBadgeText: {
    color: '#4A3522',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  rowsColumn: {
    gap: 10,
  },
  rowItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 18,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowIndex: {
    alignItems: 'center',
    backgroundColor: '#E2C498',
    borderRadius: 12,
    height: 30,
    justifyContent: 'center',
    marginRight: 10,
    width: 30,
  },
  rowIndexText: {
    color: '#3D2816',
    fontSize: 12,
    fontWeight: '800',
  },
  rowCopy: {
    flex: 1,
    paddingRight: 10,
  },
  rowTitle: {
    color: '#2A2015',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowDetail: {
    color: '#7F6A4E',
    fontSize: 12,
    fontWeight: '600',
  },
  rowBadge: {
    backgroundColor: '#F2E6D3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  rowBadgeText: {
    color: '#64492E',
    fontSize: 11,
    fontWeight: '700',
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 14,
  },
  dot: {
    borderColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
  },
  circleDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  diamondDot: {
    height: 10,
    transform: [{ rotate: '45deg' }],
    width: 10,
  },
  dotActive: {
    backgroundColor: '#F2C57C',
    borderColor: '#F2C57C',
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  helperText: {
    color: '#8EA7C8',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default EventRecommendationDeck;
