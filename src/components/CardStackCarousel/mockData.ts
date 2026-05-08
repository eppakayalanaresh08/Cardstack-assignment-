import type { EventCard, ListModeEntry } from './types';

export const EVENT_CARDS: readonly EventCard[] = [
  {
    id: 'moonlit-jazz',
    name: 'Moonlit Jazz Session',
    tag: 'LIVE',
    date: 'Fri, May 10',
    venue: 'Noor Terrace',
    price: '$24',
    emoji: '🎷',
    bgColors: ['#5B21B6', '#312E81'],
  },
  {
    id: 'forest-market',
    name: 'Forest Night Market',
    tag: 'FOOD',
    date: 'Sat, May 11',
    venue: 'Cedar Yard',
    price: '$18',
    emoji: '🍜',
    bgColors: ['#166534', '#064E3B'],
  },
  {
    id: 'amber-cinema',
    name: 'Amber Rooftop Cinema',
    tag: 'FILM',
    date: 'Sun, May 12',
    venue: 'Skyline Block',
    price: '$29',
    emoji: '🎬',
    bgColors: ['#D97706', '#92400E'],
  },
  {
    id: 'navy-talks',
    name: 'Midnight Founder Talks',
    tag: 'TALKS',
    date: 'Tue, May 14',
    venue: 'Atlas Hall',
    price: '$16',
    emoji: '💡',
    bgColors: ['#1D4ED8', '#172554'],
  },
  {
    id: 'rose-social',
    name: 'Rose Garden Social',
    tag: 'SOCIAL',
    date: 'Thu, May 16',
    venue: 'Haze Conservatory',
    price: '$21',
    emoji: '🌹',
    bgColors: ['#E11D48', '#4C0519'],
  },
] as const;

export const LIST_MODE_ENTRY: ListModeEntry = {
  id: 'more-for-you',
  rows: [
    {
      name: 'Late Night Vinyl Bar',
      sub: 'Soul edits, candlelight, standing room',
      price: '$14',
      emoji: '🎚️',
    },
    {
      name: 'Indigo Sketch Club',
      sub: 'Portrait warmups with live music loops',
      price: '$12',
      emoji: '✏️',
    },
    {
      name: 'Afterglow Matcha Walk',
      sub: 'Sunset route, soft pace, small group',
      price: '$9',
      emoji: '🍵',
    },
  ],
};

export const LIST_INDEX = EVENT_CARDS.length;
