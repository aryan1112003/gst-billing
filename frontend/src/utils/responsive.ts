/**
 * Responsive utility — single source of truth for all breakpoints.
 *
 * Usage:
 *   const { isMobile, isTablet, isDesktop, rs } = useResponsive();
 *   const s = useMemo(() => StyleSheet.create({
 *     container: { padding: rs(16, 20, 24) },
 *     card:      { width: rs('100%', '48.5%', '31.5%') as any },
 *   }), [isMobile, isTablet]);
 */

import { useWindowDimensions } from 'react-native';

/** Breakpoint pixel thresholds */
export const BP = {
  mobile:  768,   // < 768  → phone
  desktop: 1024,  // ≥ 1024 → desktop (768–1023 = tablet)
} as const;

/**
 * Reactive responsive hook.
 * Built on useWindowDimensions — automatically re-renders on resize or rotation.
 * No manual Dimensions.addEventListener needed.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isMobile  = width < BP.mobile;
  const isTablet  = width >= BP.mobile && width < BP.desktop;
  const isDesktop = width >= BP.desktop;

  /**
   * Pick the right value for the current breakpoint.
   * @param mobile  — value used on phones (< 768 px)
   * @param tablet  — value used on tablets (768–1023 px)
   * @param desktop — (optional) value used on desktop (≥ 1024 px); falls back to `tablet` if omitted
   */
  function rs<T>(mobile: T, tablet: T, desktop?: T): T {
    if (isDesktop && desktop !== undefined) return desktop;
    if (!isMobile) return tablet;          // tablet or desktop without explicit desktop value
    return mobile;
  }

  return { width, height, isMobile, isTablet, isDesktop, rs };
}

/** Pre-computed percentage widths for common grid layouts (use as `width` values). */
export const grid = {
  col1: '100%'   as const,  // 1-column
  col2: '48.5%'  as const,  // 2-column (0.5% gap accounts for flexWrap spacing)
  col3: '31.5%'  as const,  // 3-column
  col4: '23.5%'  as const,  // 4-column
  col6: '15%'    as const,  // 6-column (quick-action buttons etc.)
} as const;

/** Common responsive spacing helpers */
export const spacing = {
  pagePadding:   (rs: <T>(m: T, t: T, d?: T) => T) => rs(16, 20, 24),
  sectionMargin: (rs: <T>(m: T, t: T, d?: T) => T) => rs(12, 16, 24),
  cardPadding:   (rs: <T>(m: T, t: T, d?: T) => T) => rs(14, 16, 20),
  headerPadding: (rs: <T>(m: T, t: T, d?: T) => T) => rs(12, 16, 20),
};
