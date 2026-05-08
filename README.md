# CardStackAssignment

## Demo Recording

[Open recording.mp4](assets/recording.mp4)

This project is a small React Native event browsing experience.

The user sees one event card at a time, swipes left to move forward, swipes right to go back, and ends on a simple list view with a few more suggestions.



## What I built

I built a swipeable card carousel with:

- One focused card on screen at a time
- Smooth swipe gestures
- Back navigation to previous cards
- A final "list mode" screen after the last card
- Page dots to show progress
- Reduced motion support for accessibility
- Responsive sizing so the layout fits different screen widths

## Folder structure

This is the main structure used for the feature:

```text
CardStackAssignment/
|- App.tsx
|- README.md
|- src/
|  \- components/
|     \- CardStackCarousel/
|        |- index.tsx
|        |- CardItem.tsx
|        |- ListViewPanel.tsx
|        |- PageDots.tsx
|        |- mockData.ts
|        \- types.ts
```

## What each file does

- `App.tsx`
  Loads the screen shell and renders the carousel.

- `src/components/CardStackCarousel/index.tsx`
  Main feature logic. Handles gestures, animation flow, responsive sizing, forward/back movement, and the final list state.

- `src/components/CardStackCarousel/CardItem.tsx`
  UI for a single event card.

- `src/components/CardStackCarousel/ListViewPanel.tsx`
  UI for the final list-style recommendation panel.

- `src/components/CardStackCarousel/PageDots.tsx`
  Small progress indicator under the cards.

- `src/components/CardStackCarousel/mockData.ts`
  Demo card data and list data used by the feature.

- `src/components/CardStackCarousel/types.ts`
  Shared TypeScript types for the carousel data.

## My approach

I tried to keep the solution simple to understand and easy to extend.

My main approach was:

- Keep the feature in one small folder so the code is easy to find
- Separate logic from presentational pieces
- Use `react-native-gesture-handler` for touch gestures
- Use `react-native-reanimated` for smooth card movement
- Keep the card, list panel, and dots as separate components
- Use simple mock data so the UI can be tested quickly
- Add reduced motion handling so the experience is more accessible

I also kept the animation states explicit:

- current card
- next card preview
- previous card reveal
- final list mode

That makes the flow easier to reason about when debugging swipe behavior.

## Trade-offs I considered

I made a few practical trade-offs to keep the solution clean and safe:

- I used local mock data instead of API data.
  This keeps the assignment focused on interaction quality, not backend wiring.

- I kept most swipe orchestration in `index.tsx`.
  This makes the main behavior easier to trace in one file, but it also means the file is larger than ideal.

- I used a custom fallback visual treatment instead of adding more UI dependencies.
  This keeps setup smaller, but a dedicated gradient or design package could offer more polish.

- I optimized for readability and predictable behavior over very advanced animation tricks.
  The result is easier for another developer to maintain.

## What I would change with more time

If I had more time, I would improve these areas:

- Move some animation helpers out of `index.tsx` into smaller hooks or utilities
- Add unit tests for swipe state changes and list mode transitions
- Add integration tests for gesture behavior
- Replace mock data with typed data from a real source
- Add better theming so colors, spacing, and typography are easier to customize
- Improve card accessibility labels for screen readers
- Add loading, empty, and error states if the data becomes dynamic

## Why I chose this structure

I wanted another developer to open the project and understand it quickly.

That is why I used:

- one feature folder
- small UI components
- shared types
- data in one place
- one clear entry point

This structure is simple, scalable, and easy to hand off.

## Run the project

```bash
npm install
npm start
npm run android
```

For iOS:

```bash
npm run ios
```
