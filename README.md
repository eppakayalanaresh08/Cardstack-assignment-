# Card Stack Animation Assignment

This repo now contains a focused React Native implementation of the event recommendation stack from the assignment brief: layered card peeks, drag-following card motion, a compact list-mode endpoint, rubber-banding at the edges, and a reduced-motion fallback.

## What I built

- A single-screen assistant surface in `App.tsx` to give the stack the right conversational context without spending time on the rest of a chat product.
- A dedicated `EventRecommendationDeck` component in [src/components/EventRecommendationDeck.tsx](/C:/Users/eppak/CardStackAssignment/src/components/EventRecommendationDeck.tsx) with:
  - 5 mock event cards plus 1 list-mode state
  - leftward swipe to advance through cards
  - rightward swipe to return to the previous state
  - a special card-to-list transition that brings the list in as one unit
  - a matching list-to-card reverse transition
  - commit-time page-dot updates
  - rubber-band resistance on the first card and after the list
  - `prefers-reduced-motion` handling through `AccessibilityInfo`, using a `120ms` cross-fade instead of the slide animation

## Motion approach

- The outgoing front card always tracks the gesture directly on the x-axis. There is no rotation and no scale on the dragged card.
- The second and third layers are driven from the same gesture progress so the stack feels like one choreographed system rather than independent pieces.
- I kept the list-mode transition visually grouped by moving the list container as a unit instead of staggering rows into a cascade.
- Dots change at commit time, while the visual state finishes its settle animation afterward.

## Trade-offs

- The brief text had one directional inconsistency: most of the description says “peek cards on the right,” while the edge-case notes imply “swipe right to go back.” I implemented the standard interpretation for that layout: swipe left to go forward, swipe right to go back. The gesture math is localized, so mirroring the direction is a quick follow-up if needed.
- I chose a compact single-component animation model instead of building a generalized carousel system. That keeps the assignment readable and easy to tune, which felt more valuable here than abstraction.
- The reduced-motion path prioritizes clarity and correctness over gesture-preview fidelity: the state still changes via drag threshold, but the visual transition becomes a fast cross-fade instead of a live slide.

## If I had more time

- Tune timings side-by-side against the exact reference recording and expose those values as a tiny motion config block for easier iteration.
- Add a lightweight regression harness around edge gestures and interrupting in-flight transitions.
- Record and include the required 30–60 second demo clip from a real iPhone simulator or device so the final submission shows the motion at full speed.

## Running locally

```sh
npm install
npm start
npm run android
```

For iOS on macOS:

```sh
bundle exec pod install
npm run ios
```
