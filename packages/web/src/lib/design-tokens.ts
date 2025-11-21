/**
 * Design Tokens
 * Shared constants for consistent UI/UX across the application
 */

export const designTokens = {
  // Page backgrounds with subtle gradients
  pageBackground: 'bg-gradient-to-b from-muted/30 via-muted/10 to-background',
  
  // Card styling
  cardBase: 'border border-border/40 shadow-sm hover:shadow-md hover:border-border/60 transition-all duration-200 overflow-hidden',
  cardGlass: 'glass-card',
  
  // Interactive elements
  buttonPrimary: 'shadow-sm hover:shadow-md active:scale-95 transition-all duration-200',
  buttonOutline: 'border-border/40 hover:bg-accent/50 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200',
  
  // Tab navigation
  tabList: 'grid w-full max-w-4xl bg-muted/50 p-1 rounded-lg border border-border/40',
  tabTrigger: 'data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200',
  
  // Typography
  pageTitle: 'text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight',
  sectionTitle: 'text-lg md:text-xl font-semibold tracking-tight',
  cardTitle: 'text-base md:text-lg font-semibold tracking-tight',
  
  // Spacing
  pageContainer: 'p-4 md:p-6',
  sectionGap: 'space-y-6 md:space-y-8',
  gridGap: 'gap-4 md:gap-6',
  
  // Status indicators
  statusActive: 'w-2 h-2 rounded-full bg-success shadow-sm',
  statusPaused: 'w-2 h-2 rounded-full bg-warning shadow-sm',
  statusCanceled: 'w-2 h-2 rounded-full bg-destructive shadow-sm',
  statusArchived: 'w-2 h-2 rounded-full bg-muted-foreground shadow-sm',
  
  // Decorative elements
  decorativeCircle: 'absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-bl-full',
  iconBackground: 'inline-flex p-2.5 rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors',
  
  // Empty states
  emptyStateIcon: 'inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-6',
  
  // Loading states
  loadingSkeleton: 'animate-pulse bg-muted rounded',
} as const;
