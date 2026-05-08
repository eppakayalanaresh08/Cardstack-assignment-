export interface EventCard {
  id: string;
  name: string;
  tag: string;
  date: string;
  venue: string;
  price: string;
  emoji: string;
  bgColors: readonly [string, string];
}

export interface ListItem {
  name: string;
  sub: string;
  price: string;
  emoji: string;
}

export interface ListModeEntry {
  id: string;
  rows: readonly [ListItem, ListItem, ListItem];
}
