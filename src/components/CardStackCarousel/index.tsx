import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import CardItem from './CardItem';
import ListViewPanel from './ListViewPanel';
import { EVENT_CARDS, LIST_INDEX, LIST_MODE_ENTRY } from './mockData';
import PageDots from './PageDots';

const BASE_STAGE_WIDTH = 320;
const BASE_STAGE_HEIGHT = 220;
const BASE_CARD_WIDTH = 280;
const BASE_CARD_HEIGHT = 188;
const BASE_RADIUS = 20;
const BASE_PEEK_ONE = 22;
const BASE_PEEK_TWO = 38;
const BASE_PREVIOUS_OFFSET = 60;
const CARD_TO_CARD_DURATION = 380;
const CARD_TO_LIST_DURATION = 450;
const REDUCED_MOTION_DURATION = 120;
const PEEK_ONE_SCALE = 0.94;
const PEEK_TWO_SCALE = 0.88;
const PEEK_ONE_OPACITY = 0.85;
const PEEK_TWO_OPACITY = 0.65;
const TIMING_EASING = Easing.out(Easing.cubic);
const SPRING_CONFIG = {
  damping: 18,
  stiffness: 200,
};

type FadeTransition = {
  from: number;
  to: number;
};

type Metrics = {
  backCardOffset: number;
  cardExitDistance: number;
  cardHeight: number;
  cardLeft: number;
  cardRadius: number;
  cardTop: number;
  cardWidth: number;
  hiddenRight: number;
  listExitDistance: number;
  listPreviewOffset: number;
  peekOne: number;
  peekTwo: number;
  stageHeight: number;
  stageWidth: number;
  threshold: number;
};

type CardStackCarouselProps = {
  onSwipeActiveChange?: (isActive: boolean) => void;
};

function clamp(value: number, min: number, max: number) {
  'worklet';

  return Math.min(Math.max(value, min), max);
}

function mix(from: number, to: number, progress: number) {
  'worklet';

  return from + (to - from) * progress;
}

function computeMetrics(containerWidth: number): Metrics {
  const stageWidth = Math.min(Math.max(containerWidth, 280), 360);
  const scale = stageWidth / BASE_STAGE_WIDTH;
  const cardWidth = Math.round(BASE_CARD_WIDTH * scale);
  const cardHeight = Math.round(BASE_CARD_HEIGHT * scale);
  const stageHeight = Math.round(BASE_STAGE_HEIGHT * scale);

  return {
    backCardOffset: Math.round(BASE_PREVIOUS_OFFSET * scale),
    cardExitDistance: Math.round(cardWidth + BASE_PREVIOUS_OFFSET * scale),
    cardHeight,
    cardLeft: Math.round((stageWidth - cardWidth) / 2),
    cardRadius: Math.round(BASE_RADIUS * scale),
    cardTop: Math.round((stageHeight - cardHeight) / 2),
    cardWidth,
    hiddenRight: stageWidth + cardWidth,
    listExitDistance: Math.round(stageWidth + BASE_PREVIOUS_OFFSET * scale),
    listPreviewOffset: Math.round(BASE_PREVIOUS_OFFSET * scale),
    peekOne: Math.round(BASE_PEEK_ONE * scale),
    peekTwo: Math.round(BASE_PEEK_TWO * scale),
    stageHeight,
    stageWidth,
    threshold: Math.round(cardWidth * 0.4),
  };
}

function CardStackCarousel({
  onSwipeActiveChange,
}: CardStackCarouselProps) {
  const reducedMotionEnabled = useReducedMotion();
  const [committedIndex, setCommittedIndex] = useState(0);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(BASE_STAGE_WIDTH);
  const [fadeTransition, setFadeTransition] = useState<FadeTransition | null>(
    null,
  );
  const [listEnterKey, setListEnterKey] = useState(0);

  const metrics = useMemo(
    () => computeMetrics(containerWidth),
    [containerWidth],
  );

  const swipeActiveRef = useRef(false);
  const fadeTransitionRef = useRef<FadeTransition | null>(null);

  const gestureX = useSharedValue(0);
  const frontCardX = useSharedValue(0);
  const peekCardOneX = useSharedValue(metrics.peekOne);
  const peekCardOneScale = useSharedValue(PEEK_ONE_SCALE);
  const peekCardOneOpacity = useSharedValue(PEEK_ONE_OPACITY);
  const peekCardTwoX = useSharedValue(metrics.peekTwo);
  const peekCardTwoScale = useSharedValue(PEEK_TWO_SCALE);
  const peekCardTwoOpacity = useSharedValue(PEEK_TWO_OPACITY);
  const backCardX = useSharedValue(-metrics.backCardOffset);
  const backCardOpacity = useSharedValue(0);
  const previewListX = useSharedValue(metrics.listPreviewOffset);
  const previewListOpacity = useSharedValue(0);
  const activeListX = useSharedValue(0);
  const activeListOpacity = useSharedValue(1);
  const fadeProgress = useSharedValue(0);

  const hasPreviousCard = committedIndex > 0 && committedIndex <= LIST_INDEX;
  const currentCard =
    committedIndex < LIST_INDEX ? EVENT_CARDS[committedIndex] : null;
  const nextCard =
    committedIndex < EVENT_CARDS.length - 1
      ? EVENT_CARDS[committedIndex + 1]
      : null;
  const thirdCard =
    committedIndex < EVENT_CARDS.length - 2
      ? EVENT_CARDS[committedIndex + 2]
      : null;
  const previousCard =
    hasPreviousCard && committedIndex > 0
      ? EVENT_CARDS[Math.min(committedIndex - 1, EVENT_CARDS.length - 1)]
      : null;
  const showingListPreview = committedIndex === LIST_INDEX - 1;
  const inListMode = committedIndex === LIST_INDEX;

  const updateSwipeActive = useCallback(
    (isActive: boolean) => {
      if (swipeActiveRef.current === isActive) {
        return;
      }

      swipeActiveRef.current = isActive;
      onSwipeActiveChange?.(isActive);
    },
    [onSwipeActiveChange],
  );

  const commitDots = useCallback((target: number) => {
    setActiveDotIndex(target);
  }, []);

  const finalizeCommit = useCallback((target: number) => {
    setCommittedIndex(target);

    if (target === LIST_INDEX) {
      setListEnterKey(current => current + 1);
    }
  }, []);

  const finishReducedMotionTransition = useCallback((target: number) => {
    fadeTransitionRef.current = null;
    setFadeTransition(null);
    fadeProgress.value = 0;
    setCommittedIndex(target);

    if (target === LIST_INDEX) {
      setListEnterKey(current => current + 1);
    }
  }, [fadeProgress]);

  const flushReducedMotionTransition = useCallback(() => {
    const transition = fadeTransitionRef.current;

    if (!transition) {
      return;
    }

    cancelAnimation(fadeProgress);
    fadeTransitionRef.current = null;
    setFadeTransition(null);
    fadeProgress.value = 0;
    setCommittedIndex(transition.to);

    if (transition.to === LIST_INDEX) {
      setListEnterKey(current => current + 1);
    }
  }, [fadeProgress]);

  useEffect(() => {
    if (committedIndex === LIST_INDEX) {
      frontCardX.value = 0;
      peekCardOneOpacity.value = 0;
      peekCardTwoOpacity.value = 0;
      peekCardOneX.value = metrics.hiddenRight;
      peekCardTwoX.value = metrics.hiddenRight;
      peekCardOneScale.value = PEEK_ONE_SCALE;
      peekCardTwoScale.value = PEEK_TWO_SCALE;
      previewListX.value = metrics.listPreviewOffset;
      previewListOpacity.value = 0;
      backCardX.value = -metrics.backCardOffset;
      backCardOpacity.value = 0;
      activeListX.value = 0;
      activeListOpacity.value = 1;
      gestureX.value = 0;
      return;
    }

    frontCardX.value = 0;
    gestureX.value = 0;
    backCardX.value = -metrics.backCardOffset;
    backCardOpacity.value = 0;
    activeListX.value = 0;
    activeListOpacity.value = 1;

    if (nextCard) {
      peekCardOneX.value = metrics.peekOne;
      peekCardOneScale.value = PEEK_ONE_SCALE;
      peekCardOneOpacity.value = PEEK_ONE_OPACITY;
    } else {
      peekCardOneX.value = metrics.hiddenRight;
      peekCardOneScale.value = PEEK_ONE_SCALE;
      peekCardOneOpacity.value = 0;
    }

    if (thirdCard) {
      peekCardTwoX.value = metrics.peekTwo;
      peekCardTwoScale.value = PEEK_TWO_SCALE;
      peekCardTwoOpacity.value = PEEK_TWO_OPACITY;
    } else {
      peekCardTwoX.value = metrics.hiddenRight;
      peekCardTwoScale.value = PEEK_TWO_SCALE;
      peekCardTwoOpacity.value = 0;
    }

    if (showingListPreview) {
      previewListX.value = metrics.listPreviewOffset;
      previewListOpacity.value = 0;
    } else {
      previewListX.value = metrics.hiddenRight;
      previewListOpacity.value = 0;
    }
  }, [
    activeListOpacity,
    activeListX,
    backCardOpacity,
    backCardX,
    committedIndex,
    frontCardX,
    gestureX,
    metrics.backCardOffset,
    metrics.hiddenRight,
    metrics.listPreviewOffset,
    metrics.peekOne,
    metrics.peekTwo,
    nextCard,
    peekCardOneOpacity,
    peekCardOneScale,
    peekCardOneX,
    peekCardTwoOpacity,
    peekCardTwoScale,
    peekCardTwoX,
    previewListOpacity,
    previewListX,
    showingListPreview,
    thirdCard,
  ]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);

    if (nextWidth > 0 && nextWidth !== containerWidth) {
      setContainerWidth(nextWidth);
    }
  }, [containerWidth]);

  const cancelAllAnimations = useCallback(() => {
    'worklet';

    cancelAnimation(gestureX);
    cancelAnimation(frontCardX);
    cancelAnimation(peekCardOneX);
    cancelAnimation(peekCardOneScale);
    cancelAnimation(peekCardOneOpacity);
    cancelAnimation(peekCardTwoX);
    cancelAnimation(peekCardTwoScale);
    cancelAnimation(peekCardTwoOpacity);
    cancelAnimation(backCardX);
    cancelAnimation(backCardOpacity);
    cancelAnimation(previewListX);
    cancelAnimation(previewListOpacity);
    cancelAnimation(activeListX);
    cancelAnimation(activeListOpacity);
  }, [
    activeListOpacity,
    activeListX,
    backCardOpacity,
    backCardX,
    frontCardX,
    gestureX,
    peekCardOneOpacity,
    peekCardOneScale,
    peekCardOneX,
    peekCardTwoOpacity,
    peekCardTwoScale,
    peekCardTwoX,
    previewListOpacity,
    previewListX,
  ]);

  const animateCardRest = useCallback(() => {
    'worklet';

    frontCardX.value = withSpring(0, SPRING_CONFIG);
    backCardX.value = withSpring(-metrics.backCardOffset, SPRING_CONFIG);
    backCardOpacity.value = withSpring(0, SPRING_CONFIG);

    if (nextCard) {
      peekCardOneX.value = withSpring(metrics.peekOne, SPRING_CONFIG);
      peekCardOneScale.value = withSpring(PEEK_ONE_SCALE, SPRING_CONFIG);
      peekCardOneOpacity.value = withSpring(PEEK_ONE_OPACITY, SPRING_CONFIG);
    }

    if (thirdCard) {
      peekCardTwoX.value = withSpring(metrics.peekTwo, SPRING_CONFIG);
      peekCardTwoScale.value = withSpring(PEEK_TWO_SCALE, SPRING_CONFIG);
      peekCardTwoOpacity.value = withSpring(PEEK_TWO_OPACITY, SPRING_CONFIG);
    } else {
      peekCardTwoX.value = withSpring(metrics.hiddenRight, SPRING_CONFIG);
      peekCardTwoOpacity.value = withSpring(0, SPRING_CONFIG);
    }

    if (showingListPreview) {
      previewListX.value = withSpring(metrics.listPreviewOffset, SPRING_CONFIG);
      previewListOpacity.value = withSpring(0, SPRING_CONFIG);
    }

    gestureX.value = 0;
  }, [
    backCardOpacity,
    backCardX,
    frontCardX,
    gestureX,
    metrics.backCardOffset,
    metrics.hiddenRight,
    metrics.listPreviewOffset,
    metrics.peekOne,
    metrics.peekTwo,
    nextCard,
    peekCardOneOpacity,
    peekCardOneScale,
    peekCardOneX,
    peekCardTwoOpacity,
    peekCardTwoScale,
    peekCardTwoX,
    previewListOpacity,
    previewListX,
    showingListPreview,
    thirdCard,
  ]);

  const animateListRest = useCallback(() => {
    'worklet';

    activeListX.value = withSpring(0, SPRING_CONFIG);
    activeListOpacity.value = withSpring(1, SPRING_CONFIG);
    backCardX.value = withSpring(-metrics.backCardOffset, SPRING_CONFIG);
    backCardOpacity.value = withSpring(0, SPRING_CONFIG);
    gestureX.value = 0;
  }, [
    activeListOpacity,
    activeListX,
    backCardOpacity,
    backCardX,
    gestureX,
    metrics.backCardOffset,
  ]);

  const startReducedMotionCommit = useCallback((target: number) => {
    setActiveDotIndex(target);
    const transition = { from: committedIndex, to: target };
    fadeTransitionRef.current = transition;
    setFadeTransition(transition);
    fadeProgress.value = 0;
    fadeProgress.value = withTiming(
      1,
      {
        duration: REDUCED_MOTION_DURATION,
        easing: Easing.linear,
      },
      finished => {
        if (finished) {
          runOnJS(finishReducedMotionTransition)(target);
        }
      },
    );
  }, [committedIndex, fadeProgress, finishReducedMotionTransition]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .failOffsetY([-18, 18])
        .onStart(() => {
          'worklet';
          cancelAllAnimations();

          if (reducedMotionEnabled) {
            runOnJS(flushReducedMotionTransition)();
          }

          runOnJS(updateSwipeActive)(true);
        })
        .onUpdate(event => {
          'worklet';

          let adjusted = event.translationX;

          if (inListMode) {
            if (adjusted < 0) {
              adjusted *= 0.2;
            }

            gestureX.value = adjusted;

            if (reducedMotionEnabled) {
              return;
            }

            activeListX.value = adjusted;

            if (adjusted > 0) {
              const progress = clamp(adjusted / metrics.cardWidth, 0, 1);
              activeListOpacity.value = interpolate(progress, [0, 1], [1, 0]);
              backCardX.value = mix(-metrics.backCardOffset, 0, progress);
              backCardOpacity.value = progress;
            } else {
              activeListOpacity.value = 1;
              backCardX.value = -metrics.backCardOffset;
              backCardOpacity.value = 0;
            }

            return;
          }

          if (adjusted > 0 && committedIndex === 0) {
            adjusted *= 0.2;
          }

          gestureX.value = adjusted;

          if (reducedMotionEnabled) {
            return;
          }

          frontCardX.value = adjusted;

          if (adjusted < 0) {
            const progress = clamp(Math.abs(adjusted) / metrics.cardWidth, 0, 1);

            backCardX.value = -metrics.backCardOffset;
            backCardOpacity.value = 0;

            if (nextCard) {
              peekCardOneX.value = mix(metrics.peekOne, 0, progress);
              peekCardOneScale.value = mix(PEEK_ONE_SCALE, 1, progress);
              peekCardOneOpacity.value = mix(PEEK_ONE_OPACITY, 1, progress);
            }

            if (thirdCard) {
              peekCardTwoX.value = mix(metrics.peekTwo, metrics.peekOne, progress);
              peekCardTwoScale.value = mix(
                PEEK_TWO_SCALE,
                PEEK_ONE_SCALE,
                progress,
              );
              peekCardTwoOpacity.value = mix(
                PEEK_TWO_OPACITY,
                PEEK_ONE_OPACITY,
                progress,
              );
            }

            if (showingListPreview) {
              previewListX.value = mix(metrics.listPreviewOffset, 0, progress);
              previewListOpacity.value = progress;
            }

            return;
          }

          if (adjusted > 0 && committedIndex > 0) {
            const progress = clamp(adjusted / metrics.cardWidth, 0, 1);

            backCardX.value = mix(-metrics.backCardOffset, 0, progress);
            backCardOpacity.value = progress;
          } else {
            backCardX.value = -metrics.backCardOffset;
            backCardOpacity.value = 0;
          }

          if (nextCard) {
            peekCardOneX.value = metrics.peekOne;
            peekCardOneScale.value = PEEK_ONE_SCALE;
            peekCardOneOpacity.value = PEEK_ONE_OPACITY;
          }

          if (thirdCard) {
            peekCardTwoX.value = metrics.peekTwo;
            peekCardTwoScale.value = PEEK_TWO_SCALE;
            peekCardTwoOpacity.value = PEEK_TWO_OPACITY;
          }

          if (showingListPreview) {
            previewListX.value = metrics.listPreviewOffset;
            previewListOpacity.value = 0;
          }
        })
        .onEnd(event => {
          'worklet';

          const shouldAdvance =
            !inListMode &&
            gestureX.value < 0 &&
            (Math.abs(gestureX.value) > metrics.threshold ||
              event.velocityX < -900);
          const shouldGoBack =
            gestureX.value > 0 &&
            ((inListMode && gestureX.value > metrics.threshold) ||
              gestureX.value > metrics.threshold ||
              event.velocityX > 900);

          if (shouldAdvance) {
            const target = committedIndex + 1;

            runOnJS(commitDots)(target);

            if (reducedMotionEnabled) {
              gestureX.value = 0;
              runOnJS(startReducedMotionCommit)(target);
              return;
            }

            frontCardX.value = withTiming(
              -metrics.cardExitDistance,
              {
                duration: CARD_TO_CARD_DURATION,
                easing: TIMING_EASING,
              },
              finished => {
                if (finished) {
                  gestureX.value = 0;
                  runOnJS(finalizeCommit)(target);
                }
              },
            );

            if (showingListPreview) {
              previewListX.value = withTiming(0, {
                duration: CARD_TO_LIST_DURATION,
                easing: TIMING_EASING,
              });
              previewListOpacity.value = withTiming(1, {
                duration: CARD_TO_LIST_DURATION,
                easing: TIMING_EASING,
              });
            } else {
              peekCardOneX.value = withTiming(0, {
                duration: CARD_TO_CARD_DURATION,
                easing: TIMING_EASING,
              });
              peekCardOneScale.value = withTiming(1, {
                duration: CARD_TO_CARD_DURATION,
                easing: TIMING_EASING,
              });
              peekCardOneOpacity.value = withTiming(1, {
                duration: CARD_TO_CARD_DURATION,
                easing: TIMING_EASING,
              });

              if (thirdCard) {
                peekCardTwoX.value = withTiming(metrics.peekOne, {
                  duration: CARD_TO_CARD_DURATION,
                  easing: TIMING_EASING,
                });
                peekCardTwoScale.value = withTiming(PEEK_ONE_SCALE, {
                  duration: CARD_TO_CARD_DURATION,
                  easing: TIMING_EASING,
                });
                peekCardTwoOpacity.value = withTiming(PEEK_ONE_OPACITY, {
                  duration: CARD_TO_CARD_DURATION,
                  easing: TIMING_EASING,
                });
              }
            }

            return;
          }

          if (shouldGoBack && (inListMode || committedIndex > 0)) {
            const target = committedIndex - 1;

            runOnJS(commitDots)(target);

            if (reducedMotionEnabled) {
              gestureX.value = 0;
              runOnJS(startReducedMotionCommit)(target);
              return;
            }

            if (inListMode) {
              activeListX.value = withTiming(
                metrics.listExitDistance,
                {
                  duration: CARD_TO_CARD_DURATION,
                  easing: TIMING_EASING,
                },
                finished => {
                  if (finished) {
                    gestureX.value = 0;
                    runOnJS(finalizeCommit)(target);
                  }
                },
              );
              activeListOpacity.value = withTiming(0, {
                duration: CARD_TO_CARD_DURATION,
                easing: TIMING_EASING,
              });
            } else {
              frontCardX.value = withTiming(
                metrics.cardExitDistance,
                {
                  duration: CARD_TO_CARD_DURATION,
                  easing: TIMING_EASING,
                },
                finished => {
                  if (finished) {
                    gestureX.value = 0;
                    runOnJS(finalizeCommit)(target);
                  }
                },
              );
            }

            backCardX.value = withTiming(0, {
              duration: CARD_TO_CARD_DURATION,
              easing: TIMING_EASING,
            });
            backCardOpacity.value = withTiming(1, {
              duration: CARD_TO_CARD_DURATION,
              easing: TIMING_EASING,
            });

            return;
          }

          if (reducedMotionEnabled) {
            gestureX.value = 0;
            return;
          }

          if (inListMode) {
            animateListRest();
          } else {
            animateCardRest();
          }
        })
        .onFinalize(() => {
          'worklet';
          runOnJS(updateSwipeActive)(false);
        }),
    [
      committedIndex,
      inListMode,
      metrics,
      nextCard,
      reducedMotionEnabled,
      showingListPreview,
      thirdCard,
      cancelAllAnimations,
      animateCardRest,
      animateListRest,
      updateSwipeActive,
      flushReducedMotionTransition,
      gestureX,
      activeListX,
      activeListOpacity,
      backCardX,
      backCardOpacity,
      frontCardX,
      peekCardOneX,
      peekCardOneScale,
      peekCardOneOpacity,
      peekCardTwoX,
      peekCardTwoScale,
      peekCardTwoOpacity,
      previewListX,
      previewListOpacity,
      commitDots,
      startReducedMotionCommit,
      finalizeCommit,
    ],
  );

  const frontCardStyle = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [{ translateX: frontCardX.value }],
  }));

  const peekCardOneStyle = useAnimatedStyle(() => ({
    opacity: peekCardOneOpacity.value,
    transform: [
      { translateX: peekCardOneX.value },
      { scale: peekCardOneScale.value },
    ],
  }));

  const peekCardTwoStyle = useAnimatedStyle(() => ({
    opacity: peekCardTwoOpacity.value,
    transform: [
      { translateX: peekCardTwoX.value },
      { scale: peekCardTwoScale.value },
    ],
  }));

  const backCardStyle = useAnimatedStyle(() => ({
    opacity: backCardOpacity.value,
    transform: [{ translateX: backCardX.value }],
  }));

  const previewListStyle = useAnimatedStyle(() => ({
    opacity: previewListOpacity.value,
    transform: [{ translateX: previewListX.value }],
  }));

  const activeListStyle = useAnimatedStyle(() => ({
    opacity: activeListOpacity.value,
    transform: [{ translateX: activeListX.value }],
  }));

  const fadeOutStyle = useAnimatedStyle(() => ({
    opacity: 1 - fadeProgress.value,
  }));

  const fadeInStyle = useAnimatedStyle(() => ({
    opacity: fadeProgress.value,
  }));

  const stageStyle: ViewStyle = useMemo(
    () => ({
      height: metrics.stageHeight,
      width: metrics.stageWidth,
    }),
    [metrics.stageHeight, metrics.stageWidth],
  );

  const sceneItemStyle: ViewStyle = useMemo(
    () => ({
      left: metrics.cardLeft,
      top: metrics.cardTop,
    }),
    [metrics.cardLeft, metrics.cardTop],
  );

  const renderRestScene = useCallback(
    (index: number) => {
      if (index === LIST_INDEX) {
        return (
          <View style={[styles.sceneLayer, sceneItemStyle]}>
            <ListViewPanel
              enterKey={listEnterKey}
              entry={LIST_MODE_ENTRY}
              height={metrics.cardHeight}
              reducedMotion
              width={metrics.cardWidth}
            />
          </View>
        );
      }

      const restCard = EVENT_CARDS[index];
      const restNext = index < EVENT_CARDS.length - 1 ? EVENT_CARDS[index + 1] : null;
      const restThird = index < EVENT_CARDS.length - 2 ? EVENT_CARDS[index + 2] : null;

      return (
        <>
          {restThird ? (
            <View
              style={[
                styles.sceneLayer,
                sceneItemStyle,
                styles.thirdLayer,
                {
                  opacity: PEEK_TWO_OPACITY,
                  transform: [
                    { translateX: metrics.peekTwo },
                    { scale: PEEK_TWO_SCALE },
                  ],
                },
              ]}>
              <CardItem
                card={restThird}
                height={metrics.cardHeight}
                radius={metrics.cardRadius}
                width={metrics.cardWidth}
              />
            </View>
          ) : null}

          {restNext ? (
            <View
              style={[
                styles.sceneLayer,
                sceneItemStyle,
                styles.peekLayer,
                {
                  opacity: PEEK_ONE_OPACITY,
                  transform: [
                    { translateX: metrics.peekOne },
                    { scale: PEEK_ONE_SCALE },
                  ],
                },
              ]}>
              <CardItem
                card={restNext}
                height={metrics.cardHeight}
                radius={metrics.cardRadius}
                width={metrics.cardWidth}
              />
            </View>
          ) : null}

          <View style={[styles.sceneLayer, sceneItemStyle, styles.frontLayer]}>
            <CardItem
              card={restCard}
              height={metrics.cardHeight}
              radius={metrics.cardRadius}
              width={metrics.cardWidth}
            />
          </View>
        </>
      );
    },
    [
      listEnterKey,
      metrics.cardHeight,
      metrics.cardRadius,
      metrics.cardWidth,
      metrics.peekOne,
      metrics.peekTwo,
      sceneItemStyle,
    ],
  );

  return (
    <View style={styles.root}>
      <View onLayout={onLayout} style={styles.carouselArea}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.stage, stageStyle]}>
            {reducedMotionEnabled && fadeTransition ? (
              <>
                <Animated.View style={[styles.absoluteFill, fadeOutStyle]}>
                  {renderRestScene(fadeTransition.from)}
                </Animated.View>
                <Animated.View style={[styles.absoluteFill, fadeInStyle]}>
                  {renderRestScene(fadeTransition.to)}
                </Animated.View>
              </>
            ) : reducedMotionEnabled ? (
              renderRestScene(committedIndex)
            ) : (
              <>
                {thirdCard ? (
                  <Animated.View
                    style={[
                      styles.sceneLayer,
                      sceneItemStyle,
                      styles.thirdLayer,
                      peekCardTwoStyle,
                    ]}>
                    <CardItem
                      card={thirdCard}
                      height={metrics.cardHeight}
                      radius={metrics.cardRadius}
                      width={metrics.cardWidth}
                    />
                  </Animated.View>
                ) : null}

                {nextCard ? (
                  <Animated.View
                    style={[
                      styles.sceneLayer,
                      sceneItemStyle,
                      styles.peekLayer,
                      peekCardOneStyle,
                    ]}>
                    <CardItem
                      card={nextCard}
                      height={metrics.cardHeight}
                      radius={metrics.cardRadius}
                      width={metrics.cardWidth}
                    />
                  </Animated.View>
                ) : null}

                {showingListPreview ? (
                  <Animated.View
                    style={[
                      styles.sceneLayer,
                      sceneItemStyle,
                      styles.peekLayer,
                      previewListStyle,
                    ]}>
                    <ListViewPanel
                      enterKey={listEnterKey}
                      entry={LIST_MODE_ENTRY}
                      height={metrics.cardHeight}
                      preview
                      width={metrics.cardWidth}
                    />
                  </Animated.View>
                ) : null}

                {previousCard ? (
                  <Animated.View
                    style={[
                      styles.sceneLayer,
                      sceneItemStyle,
                      styles.backLayer,
                      backCardStyle,
                    ]}>
                    <CardItem
                      card={previousCard}
                      height={metrics.cardHeight}
                      radius={metrics.cardRadius}
                      width={metrics.cardWidth}
                    />
                  </Animated.View>
                ) : null}

                {inListMode ? (
                  <Animated.View
                    style={[
                      styles.sceneLayer,
                      sceneItemStyle,
                      styles.frontLayer,
                      activeListStyle,
                    ]}>
                    <ListViewPanel
                      enterKey={listEnterKey}
                      entry={LIST_MODE_ENTRY}
                      height={metrics.cardHeight}
                      width={metrics.cardWidth}
                    />
                  </Animated.View>
                ) : currentCard ? (
                  <Animated.View
                    style={[
                      styles.sceneLayer,
                      sceneItemStyle,
                      styles.frontLayer,
                      frontCardStyle,
                    ]}>
                    <CardItem
                      card={currentCard}
                      height={metrics.cardHeight}
                      radius={metrics.cardRadius}
                      width={metrics.cardWidth}
                    />
                  </Animated.View>
                ) : null}
              </>
            )}
          </Animated.View>
        </GestureDetector>
      </View>

      <PageDots
        activeIndex={activeDotIndex}
        listIndex={LIST_INDEX}
        total={LIST_INDEX + 1}
      />

      <Text style={styles.helperText}>Swipe left for next and right for previous.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  carouselArea: {
    alignItems: 'center',
    minHeight: BASE_STAGE_HEIGHT,
  },
  stage: {
    overflow: 'hidden',
  },
  absoluteFill: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sceneLayer: {
    position: 'absolute',
  },
  thirdLayer: {
    zIndex: 8,
  },
  peekLayer: {
    zIndex: 9,
  },
  backLayer: {
    zIndex: 9,
  },
  frontLayer: {
    zIndex: 10,
  },
  helperText: {
    color: '#8B93A6',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
    textAlign: 'center',
  },
});

export default CardStackCarousel;
