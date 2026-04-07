export function computeMobileBottomOffset(
  layoutHeight: number,
  visualViewportHeight?: number,
  visualViewportOffsetTop?: number,
  keyboardThresholdPx = 80,
  baseOffsetPx = 10
): number {
  if (typeof visualViewportHeight !== 'number' || typeof visualViewportOffsetTop !== 'number') {
    return baseOffsetPx;
  }

  const visualBottom = visualViewportHeight + visualViewportOffsetTop;
  const keyboardLikely = visualViewportHeight < layoutHeight - keyboardThresholdPx;
  const offset = keyboardLikely ? Math.max(layoutHeight - visualBottom, 0) : 0;

  return offset + baseOffsetPx;
}