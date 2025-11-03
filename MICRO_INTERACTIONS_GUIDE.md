# Micro-Interactions & Animations Guide

## Overview
This document outlines all the micro-interactions and animations available in the design system and how to use them.

## Available Animations (from tailwind.config.ts)

### 1. **Accordion Animations**
```tsx
className="animate-accordion-down"  // Smooth expand
className="animate-accordion-up"    // Smooth collapse
```

### 2. **Fade Animations**
```tsx
className="animate-fade-in"   // Fade in with slight slide up
className="animate-fade-out"  // Fade out with slight slide down
```

### 3. **Scale Animations**
```tsx
className="animate-scale-in"   // Scale up from 95% to 100%
className="animate-scale-out"  // Scale down from 100% to 95%
```

### 4. **Slide Animations**
```tsx
className="animate-slide-in-right"   // Slide in from right
className="animate-slide-out-right"  // Slide out to right
```

### 5. **Combined Animations**
```tsx
className="animate-enter"  // Fade + Scale in (for modals/dialogs)
className="animate-exit"   // Fade + Scale out
```

## Recommended Micro-Interactions

### Cards
```tsx
// Hover lift effect
<Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1">
  
// Hover border highlight
<Card className="border border-border hover:border-primary/50 transition-colors">

// Hover scale
<Card className="hover:scale-[1.02] transition-transform duration-200">
```

### Buttons
```tsx
// Press effect (scale down)
<Button className="active:scale-95 transition-transform duration-100">

// Hover lift
<Button className="hover:shadow-lg transition-shadow duration-200">

// Smooth color transition
<Button className="transition-all duration-200 hover:bg-primary/90">
```

### Interactive Elements
```tsx
// Checkbox/Toggle smooth transition
<Checkbox className="transition-all duration-200" />

// Input focus ring
<Input className="focus:ring-2 focus:ring-primary/20 transition-all" />

// Link underline animation
<a className="relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:scale-x-0 after:bg-primary after:transition-transform hover:after:scale-x-100">
```

### Lists & Grids
```tsx
// Stagger animation for list items
{items.map((item, i) => (
  <div 
    key={item.id}
    className="animate-fade-in"
    style={{ animationDelay: `${i * 0.05}s` }}
  >
    {item.content}
  </div>
))}
```

### Modals & Dialogs
```tsx
<DialogContent className="animate-scale-in">
  // Dialog enters with scale animation
</DialogContent>
```

### Page Transitions
```tsx
<div className="animate-fade-in">
  // Page content fades in
</div>
```

## Haptic Feedback (Mobile Only)

### Basic Usage
```tsx
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Light tap
const lightFeedback = async () => {
  if (isNativeApp) {
    await Haptics.impact({ style: ImpactStyle.Light });
  }
};

// Medium impact
const mediumFeedback = async () => {
  if (isNativeApp) {
    await Haptics.impact({ style: ImpactStyle.Medium });
  }
};

// Heavy impact (for important actions)
const heavyFeedback = async () => {
  if (isNativeApp) {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  }
};

// Success notification
const successFeedback = async () => {
  if (isNativeApp) {
    await Haptics.notification({ type: NotificationType.Success });
  }
};

// Error notification
const errorFeedback = async () => {
  if (isNativeApp) {
    await Haptics.notification({ type: NotificationType.Error });
  }
};
```

### Recommended Haptic Usage
- **Light**: Checkbox toggle, tab switch, minor UI interactions
- **Medium**: Button press, card tap, selection change
- **Heavy**: Delete action, important confirmation, significant state change
- **Success**: Task completion, habit check-in, achievement unlock
- **Error**: Failed action, validation error, prevented action

## Loading States

### Skeleton Loaders
```tsx
import { Skeleton } from '@/components/ui/skeleton';

<Skeleton className="h-4 w-full animate-pulse" />
<Skeleton className="h-20 w-full rounded-lg animate-pulse" />
```

### Spinner
```tsx
<div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
```

### Progress Indicator
```tsx
<Progress value={progress} className="transition-all duration-300" />
```

## Toast Animations
Toasts automatically animate in/out with the Sonner library. Use the toast utilities for enhanced toasts with icons:

```tsx
import { toastUtils } from '@/lib/toast-utils';

// Success with undo
toastUtils.success('Item deleted', {
  onUndo: () => restoreItem(),
  undoLabel: 'Undo'
});

// Error
toastUtils.error('Failed to save changes');

// Promise (for async operations)
toastUtils.promise(
  saveData(),
  {
    loading: 'Saving...',
    success: 'Saved successfully!',
    error: 'Failed to save'
  }
);
```

## Performance Considerations

### Use CSS Transitions When Possible
CSS transitions are more performant than JavaScript animations:
```tsx
// ✅ Good
className="transition-transform hover:scale-105"

// ❌ Avoid (unless necessary)
onMouseEnter={() => setScale(1.05)}
```

### Debounce Heavy Animations
```tsx
import { debounce } from 'lodash';

const handleHover = debounce(() => {
  // Heavy animation logic
}, 100);
```

### Use will-change Sparingly
Only for animations that truly need optimization:
```tsx
className="will-change-transform transition-transform"
```

## Accessibility Considerations

### Respect Reduced Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Provide Focus Indicators
```tsx
className="focus:ring-2 focus:ring-primary/20 focus:outline-none"
```

### Don't Rely Solely on Animation
Always provide text or icons alongside animations for clarity.

## Best Practices

1. **Consistency**: Use the same animation patterns throughout the app
2. **Subtlety**: Animations should enhance, not distract
3. **Purpose**: Every animation should have a purpose (feedback, guidance, delight)
4. **Speed**: Keep animations fast (100-300ms for most interactions)
5. **Easing**: Use natural easing functions (ease-out for entrances, ease-in for exits)

## Common Patterns

### Button Click Feedback
```tsx
<Button 
  className="active:scale-95 hover:shadow-md transition-all duration-150"
  onClick={async (e) => {
    // Add haptic feedback for mobile
    if (isNativeApp) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
    
    handleClick();
  }}
>
  Click Me
</Button>
```

### Card Hover State
```tsx
<Card className="group transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50">
  <CardContent>
    <Icon className="transition-colors duration-200 group-hover:text-primary" />
  </CardContent>
</Card>
```

### List Item Animation
```tsx
{items.map((item, index) => (
  <div
    key={item.id}
    className="animate-fade-in"
    style={{ 
      animationDelay: `${index * 0.05}s`,
      animationFillMode: 'both' 
    }}
  >
    <ItemCard item={item} />
  </div>
))}
```

---

**Status:** Design System Complete
**Date:** 2025-11-03
**Usage:** Apply these patterns consistently across all components
