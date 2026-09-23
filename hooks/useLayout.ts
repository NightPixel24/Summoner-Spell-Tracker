import { useWindowDimensions } from 'react-native';

// Screen layout numbers, shared so the maths below matches what's rendered.
export const SCREEN_PADDING = 16;
export const MAX_CONTENT_WIDTH = 520;
export const ROW_PADDING = 12;
export const ROW_PADDING_COMPACT = 8; // edit mode, to leave room for the spell pool
export const ROW_GAP = 10; // between role cards
export const TILE_GAP = 14; // between the two tiles in a row
export const LABEL_WIDTH = 72; // same for every row so the tile columns line up
export const POOL_PADDING = 14;
export const POOL_GAP = 10;
export const POOL_PER_ROW = 5;
const MIN_TILE = 48;
const MAX_TILE = 128;
const MAX_POOL_TILE = 56;

export const contentWidthFor = (screenWidth: number) =>
  Math.min(screenWidth, MAX_CONTENT_WIDTH) - SCREEN_PADDING * 2;

// Biggest tile that lets all five role rows fit in `rowsHeight` (the space left after the
// header, hint and, in edit mode, the spell pool) and in the content width.
export function tileSizeFor(contentWidth: number, rowsHeight: number, rowPadding = ROW_PADDING) {
  const byWidth = (contentWidth - rowPadding * 2 - LABEL_WIDTH - TILE_GAP * 2) / 2;
  const byHeight = rowsHeight / 5 - ROW_GAP - rowPadding * 2;
  return Math.floor(Math.max(MIN_TILE, Math.min(MAX_TILE, byWidth, byHeight)));
}

// Caps a tile size so a row with `tiles` tiles (TOP has three) fits the content width.
// The screen applies it to every row, so all tiles stay the same size.
export function rowTileSize(tile: number, contentWidth: number, tiles: number, rowPadding: number) {
  if (tiles <= 2) return tile;
  const byWidth = (contentWidth - rowPadding * 2 - LABEL_WIDTH - TILE_GAP * (tiles - 1)) / tiles;
  return Math.floor(Math.max(MIN_TILE, Math.min(tile, byWidth)));
}

// Spell pool tiles: five to a row across the card.
export const poolTileFor = (contentWidth: number) =>
  Math.min(MAX_POOL_TILE, Math.floor((contentWidth - POOL_PADDING * 2 - POOL_GAP * (POOL_PER_ROW - 1)) / POOL_PER_ROW));

export function useContentWidth() {
  return contentWidthFor(useWindowDimensions().width);
}
