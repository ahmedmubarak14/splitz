/**
 * Responsive Design Utilities
 * Consistent breakpoint and sizing helpers
 */

/**
 * Typography scale for consistent responsive text
 */
export const responsiveText = {
  pageTitle: 'text-2xl md:text-3xl lg:text-4xl',
  cardTitle: 'text-base md:text-lg',
  sectionTitle: 'text-lg md:text-xl',
  body: 'text-sm md:text-base',
  caption: 'text-xs',
  small: 'text-xs md:text-sm',
};

/**
 * Component sizing for consistent responsive elements
 */
export const responsiveSize = {
  card: 'p-4 md:p-6',
  button: 'h-9',
  input: 'h-9 md:h-10',
  icon: 'w-4 h-4',
  iconSmall: 'w-4 h-4',
  iconLarge: 'w-5 h-5',
};

/**
 * Spacing scale for consistent gaps and margins
 */
export const responsiveSpacing = {
  pageContainer: 'p-4 md:p-6',
  sectionGap: 'space-y-4 md:space-y-6',
  gridGap: 'gap-3 md:gap-4',
  mobileNavPadding: 'pb-24 md:pb-6',
};

/**
 * Grid layouts for responsive content
 */
export const responsiveGrid = {
  stats: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  cards: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  twoColumn: 'grid-cols-1 lg:grid-cols-2',
};

/**
 * Dialog sizes for responsive modals
 */
export const responsiveDialog = {
  small: 'max-w-sm',
  medium: 'max-w-md',
  large: 'max-w-lg lg:max-w-xl',
};
