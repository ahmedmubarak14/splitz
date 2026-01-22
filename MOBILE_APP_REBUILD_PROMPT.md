# Splitz Mobile App - Complete Design & Feature Specification

## 🎯 App Overview

**Splitz** is a comprehensive all-in-one productivity and lifestyle management mobile application. It combines habit tracking, focus/pomodoro sessions with gamification, expense splitting, subscription management, trip planning, task organization, and social challenges into a single, cohesive experience.

**Target Platform**: Mobile (iOS & Android)
**Design Language**: Modern, clean, with a "Liquid Glass" aesthetic
**Supported Languages**: English (LTR) and Arabic (RTL)

---

## 🎨 Complete Color System

### Light Mode
```css
/* Primary Brand Colors */
--primary: hsl(280, 83%, 10%)          /* Deep Plum: #1F0433 */
--primary-foreground: hsl(0, 0%, 100%) /* White text on primary */
--primary-glow: hsl(280, 65%, 25%)     /* Lighter plum for accents */

/* Secondary & Accent */
--secondary: hsl(250, 20%, 85%)        /* Soft lavender */
--secondary-foreground: hsl(280, 83%, 10%)
--accent: hsl(250, 20%, 90%)
--accent-foreground: hsl(280, 83%, 10%)

/* Backgrounds */
--background: hsl(0, 0%, 100%)         /* Pure white */
--foreground: hsl(280, 10%, 10%)       /* Near black for text */
--card: hsl(0, 0%, 100%)
--card-foreground: hsl(280, 10%, 10%)
--popover: hsl(0, 0%, 100%)
--popover-foreground: hsl(280, 10%, 10%)

/* Muted Elements */
--muted: hsl(250, 20%, 96%)
--muted-foreground: hsl(280, 5%, 40%)

/* Borders & Inputs */
--border: hsl(250, 20%, 90%)
--input: hsl(250, 20%, 90%)
--ring: hsl(280, 83%, 10%)

/* Status Colors */
--success: hsl(142, 71%, 45%)          /* Green #22c55e */
--success-foreground: hsl(0, 0%, 100%)
--destructive: hsl(0, 84%, 60%)        /* Red #ef4444 */
--destructive-foreground: hsl(0, 0%, 100%)
--warning: hsl(38, 92%, 50%)           /* Amber #f59e0b */
--warning-foreground: hsl(0, 0%, 100%)
--info: hsl(217, 91%, 60%)             /* Blue #3b82f6 */
--info-foreground: hsl(0, 0%, 100%)

/* Feature-Specific Colors */
--habit-green: hsl(142, 71%, 45%)
--focus-purple: hsl(262, 83%, 58%)
--expense-orange: hsl(25, 95%, 53%)
--subscription-red: hsl(0, 84%, 60%)
--trip-pink: hsl(330, 81%, 60%)
--challenge-yellow: hsl(48, 96%, 53%)
```

### Dark Mode
```css
/* Primary Brand Colors */
--primary: hsl(280, 70%, 85%)          /* Light plum for dark bg */
--primary-foreground: hsl(280, 83%, 10%)
--primary-glow: hsl(280, 60%, 70%)

/* Backgrounds */
--background: hsl(280, 15%, 8%)        /* Very dark plum-tinted */
--foreground: hsl(0, 0%, 95%)
--card: hsl(280, 10%, 12%)
--card-foreground: hsl(0, 0%, 95%)

/* Muted Elements */
--muted: hsl(280, 10%, 18%)
--muted-foreground: hsl(280, 5%, 65%)

/* Borders */
--border: hsl(280, 10%, 20%)
--input: hsl(280, 10%, 20%)

/* Status Colors (slightly adjusted for dark mode) */
--success: hsl(142, 71%, 45%)
--destructive: hsl(0, 84%, 60%)
--warning: hsl(38, 92%, 50%)
--info: hsl(217, 91%, 60%)
```

---

## 📐 Layout & Spacing System

### Container & Page Layout
```css
/* Page containers */
padding: 16px (mobile) / 24px (tablet+)
margin-bottom: 96px /* Safe area for bottom nav */

/* Page background gradient */
background: linear-gradient(180deg, 
  hsl(var(--muted) / 0.3) 0%, 
  hsl(var(--muted) / 0.1) 50%, 
  hsl(var(--background)) 100%)

/* Section gaps */
gap: 16px (mobile) / 24px (tablet+)

/* Grid gaps */
gap: 12px (mobile) / 16px (tablet+)
```

### Typography Scale
```css
/* Font Family */
font-family: 'Inter', 'Noto Sans Arabic' (for Arabic), -apple-system, system-ui

/* Page Titles */
font-size: 24px (mobile) / 32px (tablet) / 40px (desktop)
font-weight: 700
line-height: 1.2
letter-spacing: -0.02em

/* Section Titles */
font-size: 18px (mobile) / 20px (tablet)
font-weight: 600
line-height: 1.3

/* Card Titles */
font-size: 16px (mobile) / 18px (tablet)
font-weight: 600
line-height: 1.4

/* Body Text */
font-size: 14px (mobile) / 16px (tablet)
font-weight: 400
line-height: 1.5

/* Small Text / Captions */
font-size: 12px (mobile) / 14px (tablet)
font-weight: 400
line-height: 1.4

/* Micro Text (badges, labels) */
font-size: 11px
font-weight: 500
text-transform: uppercase
letter-spacing: 0.02em
```

---

## 🃏 Card Design - "Liquid Glass" Effect

### Base Card Styling
```css
/* Light Mode Card */
background: hsl(0, 0%, 100%)
backdrop-filter: blur(8px)
border: 1px solid hsl(250, 20%, 90% / 0.4)
border-radius: 16px
box-shadow: 
  0 1px 2px rgba(0, 0, 0, 0.02),
  0 4px 8px rgba(0, 0, 0, 0.04)

/* Hover State */
box-shadow:
  0 4px 8px rgba(0, 0, 0, 0.04),
  0 12px 24px rgba(0, 0, 0, 0.08)
border-color: hsl(250, 20%, 80% / 0.6)
transform: translateY(-2px)
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)

/* Dark Mode Card */
background: linear-gradient(135deg,
  hsl(280, 10%, 12% / 0.95) 0%,
  hsl(280, 10%, 14% / 0.9) 100%)
backdrop-filter: blur(12px)
border: 1px solid hsl(280, 10%, 20% / 0.5)
box-shadow:
  0 2px 4px rgba(0, 0, 0, 0.2),
  0 8px 16px rgba(0, 0, 0, 0.3),
  inset 0 1px 0 hsl(0, 0%, 100% / 0.05)
```

### Card Content Padding
```css
padding: 16px (mobile) / 20px (tablet)
gap: 12px (between elements)
```

---

## 🔘 Button Design System

### Primary Button
```css
background: linear-gradient(135deg, 
  hsl(280, 83%, 10%) 0%, 
  hsl(280, 75%, 15%) 100%)
color: hsl(0, 0%, 100%)
padding: 12px 24px
border-radius: 12px
font-weight: 600
font-size: 14px
box-shadow: 
  0 1px 2px rgba(0, 0, 0, 0.05),
  0 4px 12px hsl(280, 83%, 10% / 0.2)
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)

/* Hover/Active */
transform: scale(0.98)
box-shadow:
  0 2px 4px rgba(0, 0, 0, 0.08),
  0 8px 20px hsl(280, 83%, 10% / 0.3)
```

### Outline Button
```css
background: transparent
color: hsl(280, 83%, 10%)
border: 1px solid hsl(250, 20%, 90% / 0.4)
padding: 12px 24px
border-radius: 12px
font-weight: 600
font-size: 14px
box-shadow: 
  0 1px 2px rgba(0, 0, 0, 0.02),
  0 4px 8px rgba(0, 0, 0, 0.04)

/* Hover */
background: hsl(250, 20%, 98%)
border-color: hsl(250, 20%, 80% / 0.6)
transform: scale(0.98)
```

### Ghost Button
```css
background: transparent
color: hsl(280, 10%, 10%)
padding: 12px 24px
border-radius: 12px
font-weight: 600
font-size: 14px

/* Hover */
background: hsl(250, 20%, 96%)
```

### Success Button (Check-in buttons)
```css
background: linear-gradient(135deg,
  hsl(142, 71%, 45%) 0%,
  hsl(142, 71%, 40%) 100%)
color: hsl(0, 0%, 100%)
padding: 12px 24px
border-radius: 12px
font-weight: 600
box-shadow:
  0 2px 4px rgba(34, 197, 94, 0.2),
  0 8px 16px rgba(34, 197, 94, 0.15)

/* Active State */
transform: scale(0.95)
box-shadow:
  0 1px 2px rgba(34, 197, 94, 0.3),
  0 4px 8px rgba(34, 197, 94, 0.2)
```

### Icon Button
```css
width: 40px
height: 40px
padding: 0
border-radius: 10px
display: flex
align-items: center
justify-content: center

/* Icon size */
width: 20px
height: 20px
```

---

## 🎬 Animations & Transitions

### Keyframe Animations
```css
/* Fade In */
@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale In */
@keyframes scale-in {
  0% {
    transform: scale(0.95);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Bounce In (for success celebrations) */
@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Rubber Band (for streak celebrations) */
@keyframes rubber-band {
  0% { transform: scale(1); }
  30% { transform: scale(1.25, 0.75); }
  40% { transform: scale(0.75, 1.25); }
  50% { transform: scale(1.15, 0.85); }
  65% { transform: scale(0.95, 1.05); }
  75% { transform: scale(1.05, 0.95); }
  100% { transform: scale(1); }
}

/* Slide In Right */
@keyframes slide-in-right {
  0% { transform: translateX(100%); }
  100% { transform: translateX(0); }
}

/* Pulse (for notifications) */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
```

### List Item Staggered Animation
When rendering lists (habits, tasks, expenses):
```css
/* Apply to each item with increasing delay */
animation: fade-in 0.3s ease-out backwards;
animation-delay: calc(var(--item-index) * 0.05s);
/* --item-index = 0, 1, 2, 3... for each item */
```

---

## 📱 Mobile Bottom Navigation

### Fixed Bottom Bar
```css
position: fixed
bottom: 0
left: 0
right: 0
height: 64px
padding-bottom: env(safe-area-inset-bottom) /* iOS safe area */
background: linear-gradient(180deg,
  hsl(0, 0%, 100% / 0.98) 0%,
  hsl(0, 0%, 100%) 100%)
backdrop-filter: blur(20px) saturate(180%)
border-top: 1px solid hsl(250, 20%, 90% / 0.5)
box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.06)
z-index: 50

/* Dark Mode */
background: linear-gradient(180deg,
  hsl(280, 10%, 12% / 0.98) 0%,
  hsl(280, 10%, 10%) 100%)
backdrop-filter: blur(20px) saturate(180%)
border-top-color: hsl(280, 10%, 20% / 0.5)
box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.4)
```

### Navigation Items
```css
/* Container */
display: flex
justify-content: space-around
align-items: center
padding: 8px 16px

/* Individual Nav Item */
display: flex
flex-direction: column
align-items: center
gap: 4px
padding: 8px 16px
border-radius: 12px
transition: all 0.2s ease

/* Icon */
width: 24px
height: 24px
color: hsl(280, 5%, 40%) /* Inactive */

/* Label */
font-size: 11px
font-weight: 500
color: hsl(280, 5%, 40%) /* Inactive */

/* Active State */
background: hsl(280, 83%, 10% / 0.08)
icon-color: hsl(280, 83%, 10%)
label-color: hsl(280, 83%, 10%)
transform: scale(1.05)

/* Dark Mode Active */
background: hsl(280, 70%, 85% / 0.12)
icon-color: hsl(280, 70%, 85%)
label-color: hsl(280, 70%, 85%)
```

### Navigation Icons & Labels
```javascript
[
  { icon: 'Target', label: 'Habits', route: '/habits' },
  { icon: 'Clock', label: 'Focus', route: '/focus' },
  { icon: 'DollarSign', label: 'Expenses', route: '/expenses' },
  { icon: 'CreditCard', label: 'Subs', route: '/subscriptions' },
  { icon: 'User', label: 'Profile', route: '/profile' }
]
```

---

## 🎯 Feature-Specific Designs

### 1. HABITS Page

#### Layout
```
┌─────────────────────────┐
│  Habits (page title)    │
│  Build your streaks     │
│                 [+ Add] │
├─────────────────────────┤
│                         │
│  [Habit Card 1]         │
│  [Habit Card 2]         │
│  [Habit Card 3]         │
│                         │
└─────────────────────────┘
```

#### Habit Card Design
```css
/* Card Container */
border-radius: 16px
padding: 16px
background: hsl(0, 0%, 100%)
border: 1px solid hsl(250, 20%, 90% / 0.4)
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04)

/* Header Row */
display: flex
justify-content: space-between
align-items: flex-start
margin-bottom: 12px

/* Left: Icon + Title */
.icon-container {
  width: 48px
  height: 48px
  border-radius: 12px
  background: linear-gradient(135deg,
    hsl(142, 71%, 45% / 0.1) 0%,
    hsl(142, 71%, 45% / 0.2) 100%)
  display: flex
  align-items: center
  justify-content: center
  
  /* Icon (emoji or lucide icon) */
  font-size: 24px
  OR
  svg {
    width: 24px
    height: 24px
    color: hsl(142, 71%, 40%)
  }
}

.title {
  font-size: 16px
  font-weight: 600
  color: hsl(280, 10%, 10%)
  margin-left: 12px
}

/* Right: Streak Badge */
.streak-badge {
  display: flex
  align-items: center
  gap: 4px
  padding: 6px 12px
  border-radius: 20px
  background: linear-gradient(135deg,
    hsl(25, 95%, 53% / 0.1) 0%,
    hsl(25, 95%, 53% / 0.15) 100%)
  
  /* Fire emoji or icon */
  font-size: 16px
  
  /* Streak count */
  font-size: 14px
  font-weight: 700
  color: hsl(25, 95%, 40%)
}

/* Frequency Info */
.frequency {
  font-size: 12px
  color: hsl(280, 5%, 40%)
  margin-bottom: 12px
}

/* Check-in Button */
.checkin-button {
  width: 100%
  padding: 12px
  border-radius: 12px
  font-weight: 600
  font-size: 14px
  display: flex
  align-items: center
  justify-content: center
  gap: 8px
  
  /* Unchecked State */
  background: linear-gradient(135deg,
    hsl(142, 71%, 45%) 0%,
    hsl(142, 71%, 40%) 100%)
  color: hsl(0, 0%, 100%)
  box-shadow: 0 2px 8px hsl(142, 71%, 45% / 0.3)
  
  /* Checked State */
  background: hsl(250, 20%, 96%)
  color: hsl(142, 71%, 40%)
  border: 1px solid hsl(142, 71%, 45% / 0.3)
  box-shadow: none
  
  /* Icon */
  svg {
    width: 18px
    height: 18px
  }
}

/* Animation on check-in */
.checkin-button:active {
  transform: scale(0.95)
  animation: bounce-in 0.5s ease
}
```

#### Habit Calendar Heatmap
```css
/* Calendar Container */
display: grid
grid-template-columns: repeat(7, 1fr)
gap: 4px
margin-top: 12px
padding: 12px
background: hsl(250, 20%, 98%)
border-radius: 12px

/* Individual Day Cell */
width: 100%
aspect-ratio: 1
border-radius: 6px
background: hsl(0, 0%, 100%)
border: 1px solid hsl(250, 20%, 92%)

/* Checked Day */
background: linear-gradient(135deg,
  hsl(142, 71%, 45%) 0%,
  hsl(142, 71%, 40%) 100%)
border-color: hsl(142, 71%, 40%)
box-shadow: 0 2px 4px hsl(142, 71%, 45% / 0.2)

/* Today (outline) */
border: 2px solid hsl(280, 83%, 10%)
border-width: 2px
```

---

### 2. FOCUS / POMODORO Page with Tree Planting

#### Layout
```
┌─────────────────────────┐
│  Focus Timer            │
│                         │
│  ┌───────────────────┐  │
│  │                   │  │
│  │    🌳 Tree       │  │
│  │   (grows as you  │  │
│  │    focus)        │  │
│  │                   │  │
│  │   25:00          │  │
│  │  (timer)         │  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
│  [▶ Start] [⏸ Pause]   │
│  [⏭ Skip]              │
│                         │
│  Session Type:          │
│  ○ Work (25min)        │
│  ○ Short Break (5min)  │
│  ○ Long Break (15min)  │
│  ○ Custom              │
│                         │
│  📊 Today's Stats      │
│  🌳 3 trees planted    │
│  ⏱ 75 min focused      │
└─────────────────────────┘
```

#### Circular Progress Ring
```css
/* SVG Circle Progress */
<svg width="280" height="280" viewBox="0 0 280 280">
  <!-- Background circle -->
  <circle
    cx="140"
    cy="140"
    r="120"
    fill="none"
    stroke="hsl(250, 20%, 92%)"
    stroke-width="12"
  />
  
  <!-- Progress circle -->
  <circle
    cx="140"
    cy="140"
    r="120"
    fill="none"
    stroke="url(#progressGradient)"
    stroke-width="12"
    stroke-linecap="round"
    stroke-dasharray="754" /* 2 * π * 120 */
    stroke-dashoffset="calculated-based-on-progress"
    transform="rotate(-90 140 140)"
    style="transition: stroke-dashoffset 1s linear"
  />
  
  <!-- Gradient Definition -->
  <defs>
    <linearGradient id="progressGradient">
      <stop offset="0%" stop-color="hsl(262, 83%, 58%)" />
      <stop offset="100%" stop-color="hsl(280, 83%, 10%)" />
    </linearGradient>
  </defs>
</svg>
```

#### Tree Growth Visual
```css
/* Tree container (centered in circle) */
position: absolute
top: 50%
left: 50%
transform: translate(-50%, -50%)
display: flex
flex-direction: column
align-items: center
gap: 8px

/* Tree emoji/icon */
font-size: 64px (scales from 32px → 64px as progress increases)
filter: grayscale(1) (at 0%) → grayscale(0) (at 100%)
opacity: 0.3 (at 0%) → 1 (at 100%)
transform: scale(0.5) (at 0%) → scale(1) (at 100%)
transition: all 1s ease-out

/* Timer Text */
font-size: 48px
font-weight: 700
color: hsl(280, 83%, 10%)
font-variant-numeric: tabular-nums
```

#### Session Control Buttons
```css
/* Start Button */
width: 100%
max-width: 200px
padding: 16px
border-radius: 16px
background: linear-gradient(135deg,
  hsl(262, 83%, 58%) 0%,
  hsl(280, 83%, 10%) 100%)
color: hsl(0, 0%, 100%)
font-weight: 700
font-size: 18px
box-shadow: 0 4px 16px hsl(262, 83%, 58% / 0.3)

/* Pause Button */
background: hsl(38, 92%, 50%)
box-shadow: 0 4px 16px hsl(38, 92%, 50% / 0.3)

/* Skip Button */
background: transparent
border: 1px solid hsl(0, 84%, 60%)
color: hsl(0, 84%, 60%)
```

#### Tree Survival Result
```css
/* Success (Tree survived) */
display: confetti animation
show: "🎉 Tree survived! +1 🌳"
background: hsl(142, 71%, 45%)
color: white
animation: bounce-in 0.6s ease

/* Failure (Tree died) */
show: "💀 Tree died. Stay focused!"
background: hsl(0, 84%, 60%)
color: white
animation: shake 0.5s ease

/* Statistics Card */
padding: 16px
border-radius: 12px
background: hsl(250, 20%, 98%)
display: grid
grid-template-columns: 1fr 1fr
gap: 16px

.stat-item {
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  
  .icon {
    font-size: 24px
  }
  
  .value {
    font-size: 24px
    font-weight: 700
    color: hsl(280, 83%, 10%)
  }
  
  .label {
    font-size: 12px
    color: hsl(280, 5%, 40%)
  }
}
```

---

### 3. EXPENSES Page

#### Layout
```
┌─────────────────────────┐
│  Expenses               │
│  Track & split costs    │
│                 [+ Add] │
├─────────────────────────┤
│  Tabs:                  │
│  [Overview][Groups][You]│
├─────────────────────────┤
│  Expense Group Card     │
│  ┌─────────────────┐    │
│  │ 🍕 Dinner      │    │
│  │ Total: $150.00 │    │
│  │ You owe: $50   │    │
│  │                 │    │
│  │ [3 Contributors]│    │
│  └─────────────────┘    │
│                         │
│  Individual Expense     │
│  ┌─────────────────┐    │
│  │ ☕ Coffee       │    │
│  │ $5.50          │    │
│  │ Split: Equal    │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

#### Expense Group Card
```css
/* Card Container */
border-radius: 16px
padding: 16px
background: linear-gradient(135deg,
  hsl(0, 0%, 100%) 0%,
  hsl(250, 20%, 99%) 100%)
border: 1px solid hsl(25, 95%, 53% / 0.2)
box-shadow: 0 2px 12px hsl(25, 95%, 53% / 0.08)

/* Header */
display: flex
justify-content: space-between
align-items: flex-start
margin-bottom: 12px

/* Icon + Title */
.icon {
  width: 48px
  height: 48px
  border-radius: 12px
  background: linear-gradient(135deg,
    hsl(25, 95%, 53% / 0.1) 0%,
    hsl(25, 95%, 53% / 0.2) 100%)
  display: flex
  align-items: center
  justify-content: center
  font-size: 24px
}

.title {
  font-size: 16px
  font-weight: 600
  color: hsl(280, 10%, 10%)
  margin-top: 8px
}

/* Total Amount */
.total {
  font-size: 28px
  font-weight: 700
  color: hsl(280, 83%, 10%)
  margin-bottom: 4px
}

/* You Owe / You're Owed */
.balance {
  padding: 8px 16px
  border-radius: 20px
  font-size: 14px
  font-weight: 600
  
  /* Owe (negative balance) */
  background: hsl(0, 84%, 60% / 0.1)
  color: hsl(0, 84%, 40%)
  
  /* Owed (positive balance) */
  background: hsl(142, 71%, 45% / 0.1)
  color: hsl(142, 71%, 40%)
  
  /* Settled */
  background: hsl(250, 20%, 96%)
  color: hsl(280, 5%, 40%)
}

/* Contributors Avatars */
display: flex
align-items: center
gap: -8px /* Overlapping avatars */
margin-top: 12px

.avatar {
  width: 32px
  height: 32px
  border-radius: 50%
  border: 2px solid hsl(0, 0%, 100%)
  background: hsl(250, 20%, 90%)
  display: flex
  align-items: center
  justify-content: center
  font-size: 12px
  font-weight: 600
}

/* More contributors indicator */
.more {
  width: 32px
  height: 32px
  border-radius: 50%
  background: hsl(250, 20%, 85%)
  color: hsl(280, 5%, 40%)
  display: flex
  align-items: center
  justify-content: center
  font-size: 11px
  font-weight: 600
}
```

---

### 4. SUBSCRIPTIONS Page

#### Layout
```
┌─────────────────────────┐
│  Subscriptions          │
│  Manage recurring costs │
│                 [+ Add] │
├─────────────────────────┤
│  Tabs:                  │
│  [Overview][Trials]     │
│  [Calendar][All]        │
├─────────────────────────┤
│  📊 Monthly Total      │
│  $125.50               │
│  (5 active subs)        │
├─────────────────────────┤
│  Subscription Card      │
│  ┌─────────────────┐    │
│  │ 🎵 Spotify     │    │
│  │ $9.99/month    │    │
│  │                 │    │
│  │ Renews in 5d   │    │
│  │ ▓▓▓▓░░░░░░     │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

#### Subscription Card
```css
/* Card Container */
border-radius: 16px
padding: 16px
background: hsl(0, 0%, 100%)
border: 1px solid hsl(250, 20%, 90% / 0.4)
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04)

/* Header Row */
display: flex
justify-content: space-between
align-items: flex-start

/* Logo + Name */
.logo-container {
  width: 48px
  height: 48px
  border-radius: 12px
  background: hsl(0, 0%, 100%)
  border: 1px solid hsl(250, 20%, 90%)
  display: flex
  align-items: center
  justify-content: center
  overflow: hidden
  
  img {
    width: 32px
    height: 32px
    object-fit: contain
  }
}

.name {
  font-size: 16px
  font-weight: 600
  color: hsl(280, 10%, 10%)
  margin-top: 4px
}

.category {
  font-size: 12px
  color: hsl(280, 5%, 40%)
}

/* Shared Badge */
.shared-badge {
  padding: 4px 8px
  border-radius: 12px
  background: hsl(217, 91%, 60% / 0.1)
  color: hsl(217, 91%, 50%)
  font-size: 11px
  font-weight: 600
  display: flex
  align-items: center
  gap: 4px
  
  svg {
    width: 12px
    height: 12px
  }
}

/* Price */
.price {
  font-size: 28px
  font-weight: 700
  color: hsl(280, 83%, 10%)
  margin-bottom: 4px
}

.billing-cycle {
  padding: 4px 10px
  border-radius: 12px
  border: 1px solid hsl(250, 20%, 90%)
  background: hsl(250, 20%, 98%)
  font-size: 12px
  font-weight: 500
  color: hsl(280, 5%, 40%)
}

/* Renewal Progress Bar */
.renewal-info {
  display: flex
  justify-content: space-between
  font-size: 12px
  color: hsl(280, 5%, 40%)
  margin-bottom: 4px
}

.progress-bar {
  height: 6px
  background: hsl(250, 20%, 95%)
  border-radius: 3px
  overflow: hidden
  
  .progress {
    height: 100%
    background: linear-gradient(90deg,
      hsl(280, 83%, 10%) 0%,
      hsl(262, 83%, 58%) 100%)
    transition: width 0.3s ease
  }
  
  /* Warning (< 7 days) */
  .progress.warning {
    background: linear-gradient(90deg,
      hsl(38, 92%, 50%) 0%,
      hsl(25, 95%, 53%) 100%)
  }
  
  /* Critical (< 3 days) */
  .progress.critical {
    background: linear-gradient(90deg,
      hsl(0, 84%, 60%) 0%,
      hsl(0, 84%, 50%) 100%)
  }
}

/* Due Today Badge */
.due-today {
  padding: 6px 12px
  border-radius: 20px
  background: hsl(0, 84%, 60%)
  color: hsl(0, 0%, 100%)
  font-size: 12px
  font-weight: 600
  display: flex
  align-items: center
  gap: 4px
  animation: pulse 2s ease-in-out infinite
}

/* Action Buttons */
display: flex
gap: 8px
margin-top: 12px

.edit-button {
  flex: 1
  padding: 10px
  border-radius: 10px
  border: 1px solid hsl(250, 20%, 90%)
  background: hsl(0, 0%, 100%)
  font-size: 13px
  font-weight: 600
  color: hsl(280, 10%, 10%)
  display: flex
  align-items: center
  justify-content: center
  gap: 6px
}

.contributors-button {
  flex: 1
  padding: 10px
  border-radius: 10px
  border: 1px solid hsl(217, 91%, 60% / 0.3)
  background: hsl(217, 91%, 60% / 0.05)
  color: hsl(217, 91%, 50%)
  font-size: 13px
  font-weight: 600
  display: flex
  align-items: center
  justify-content: center
  gap: 6px
}

.delete-button {
  padding: 10px
  border-radius: 10px
  background: transparent
  color: hsl(0, 84%, 60%)
}
```

#### Trial Tracker Card
```css
/* Trial Card (urgent styling) */
border: 2px solid hsl(38, 92%, 50%)
background: linear-gradient(135deg,
  hsl(0, 0%, 100%) 0%,
  hsl(38, 92%, 50% / 0.05) 100%)

/* Trial Badge */
.trial-badge {
  padding: 6px 12px
  border-radius: 20px
  background: hsl(38, 92%, 50%)
  color: hsl(0, 0%, 100%)
  font-size: 12px
  font-weight: 700
  text-transform: uppercase
  letter-spacing: 0.5px
}

/* Warning Box (< 3 days) */
.warning-box {
  padding: 12px
  border-radius: 12px
  background: hsl(0, 84%, 60% / 0.1)
  border: 1px solid hsl(0, 84%, 60% / 0.3)
  display: flex
  align-items: flex-start
  gap: 12px
  margin-top: 12px
  
  .icon {
    width: 20px
    height: 20px
    color: hsl(0, 84%, 60%)
  }
  
  .text {
    flex: 1
    
    .title {
      font-size: 13px
      font-weight: 600
      color: hsl(0, 84%, 50%)
      margin-bottom: 2px
    }
    
    .desc {
      font-size: 12px
      color: hsl(0, 60%, 45%)
    }
  }
}

/* Cancel Button */
.cancel-button {
  background: hsl(0, 84%, 60%)
  color: hsl(0, 0%, 100%)
  font-weight: 700
}
```

---

### 5. TRIPS Page

#### Layout
```
┌─────────────────────────┐
│  Trips                  │
│  Plan your adventures   │
│                 [+ Add] │
├─────────────────────────┤
│  Trip Card              │
│  ┌─────────────────┐    │
│  │ 🗺️ Tokyo Trip  │    │
│  │ Mar 15-20, 2025│    │
│  │                 │    │
│  │ 👥 4 members   │    │
│  │ ✅ 8/12 tasks  │    │
│  │ ▓▓▓▓▓▓░░░░░░   │    │
│  │                 │    │
│  │ [Planning]      │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

#### Trip Card
```css
/* Card Container */
border-radius: 16px
padding: 16px
background: linear-gradient(135deg,
  hsl(330, 81%, 60% / 0.05) 0%,
  hsl(25, 95%, 53% / 0.05) 100%)
border: 1px solid hsl(330, 81%, 60% / 0.2)
box-shadow: 0 2px 12px hsl(330, 81%, 60% / 0.08)

/* Header */
.icon-container {
  width: 48px
  height: 48px
  border-radius: 12px
  background: linear-gradient(135deg,
    hsl(330, 81%, 60%) 0%,
    hsl(25, 95%, 53%) 100%)
  display: flex
  align-items: center
  justify-content: center
  
  svg {
    width: 24px
    height: 24px
    color: hsl(0, 0%, 100%)
  }
}

.trip-name {
  font-size: 18px
  font-weight: 700
  color: hsl(280, 83%, 10%)
  margin-bottom: 2px
}

.destination {
  font-size: 13px
  color: hsl(280, 5%, 40%)
}

/* Status Badge */
.status-badge {
  padding: 4px 10px
  border-radius: 12px
  font-size: 11px
  font-weight: 600
  text-transform: uppercase
  letter-spacing: 0.5px
  
  /* Planning */
  background: hsl(217, 91%, 60% / 0.1)
  color: hsl(217, 91%, 50%)
  border: 1px solid hsl(217, 91%, 60% / 0.2)
  
  /* Active */
  background: hsl(142, 71%, 45% / 0.1)
  color: hsl(142, 71%, 40%)
  border: 1px solid hsl(142, 71%, 45% / 0.2)
  
  /* Completed */
  background: hsl(250, 20%, 92%)
  color: hsl(280, 5%, 40%)
  border: 1px solid hsl(250, 20%, 85%)
}

/* Info Row */
.info-row {
  display: flex
  align-items: center
  gap: 16px
  margin: 12px 0
  font-size: 13px
  color: hsl(280, 5%, 40%)
  
  .info-item {
    display: flex
    align-items: center
    gap: 4px
    
    svg {
      width: 16px
      height: 16px
    }
  }
}

/* Task Progress */
.task-progress {
  margin-top: 12px
  
  .progress-label {
    display: flex
    justify-content: space-between
    font-size: 12px
    color: hsl(280, 5%, 40%)
    margin-bottom: 6px
  }
  
  .progress-bar {
    height: 8px
    background: hsl(250, 20%, 95%)
    border-radius: 4px
    overflow: hidden
    
    .progress {
      height: 100%
      background: linear-gradient(90deg,
        hsl(330, 81%, 60%) 0%,
        hsl(25, 95%, 53%) 100%)
      transition: width 0.3s ease
    }
  }
}

/* Days Until Start */
.countdown {
  text-align: center
  font-size: 13px
  color: hsl(280, 5%, 40%)
  margin-top: 12px
  padding-top: 12px
  border-top: 1px solid hsl(250, 20%, 92%)
}
```

---

### 6. TASKS / EISENHOWER MATRIX

#### Layout
```
┌─────────────────────────┐
│  Tasks                  │
│  [Matrix View][List]    │
│                 [+ Add] │
├─────────────────────────┤
│  Eisenhower Matrix      │
│  ┌─────────┬─────────┐  │
│  │ Urgent  │ Not     │  │
│  │ Important│Urgent  │  │
│  │ [Tasks] │Important│  │
│  │         │ [Tasks] │  │
│  ├─────────┼─────────┤  │
│  │ Urgent  │ Not     │  │
│  │ Not Imp │ Urgent  │  │
│  │ [Tasks] │Not Imp  │  │
│  │         │ [Tasks] │  │
│  └─────────┴─────────┘  │
└─────────────────────────┘
```

#### Matrix Quadrant
```css
/* Matrix Container */
display: grid
grid-template-columns: 1fr 1fr
grid-template-rows: 1fr 1fr
gap: 12px
padding: 16px
min-height: 500px

/* Quadrant */
.quadrant {
  border-radius: 16px
  padding: 16px
  display: flex
  flex-direction: column
  gap: 8px
  
  /* Q1: Urgent + Important */
  background: linear-gradient(135deg,
    hsl(0, 84%, 60% / 0.05) 0%,
    hsl(0, 84%, 60% / 0.1) 100%)
  border: 2px solid hsl(0, 84%, 60% / 0.3)
  
  /* Q2: Not Urgent + Important */
  background: linear-gradient(135deg,
    hsl(142, 71%, 45% / 0.05) 0%,
    hsl(142, 71%, 45% / 0.1) 100%)
  border: 2px solid hsl(142, 71%, 45% / 0.3)
  
  /* Q3: Urgent + Not Important */
  background: linear-gradient(135deg,
    hsl(38, 92%, 50% / 0.05) 0%,
    hsl(38, 92%, 50% / 0.1) 100%)
  border: 2px solid hsl(38, 92%, 50% / 0.3)
  
  /* Q4: Not Urgent + Not Important */
  background: linear-gradient(135deg,
    hsl(250, 20%, 92% / 0.5) 0%,
    hsl(250, 20%, 96%) 100%)
  border: 2px solid hsl(250, 20%, 85%)
}

.quadrant-header {
  font-size: 14px
  font-weight: 700
  text-transform: uppercase
  letter-spacing: 0.5px
  margin-bottom: 8px
  
  /* Colors match quadrant */
  color: hsl(0, 84%, 50%) /* Q1 */
  color: hsl(142, 71%, 40%) /* Q2 */
  color: hsl(38, 92%, 45%) /* Q3 */
  color: hsl(280, 5%, 50%) /* Q4 */
}

/* Task Item within Quadrant */
.task-item {
  padding: 10px 12px
  border-radius: 10px
  background: hsl(0, 0%, 100%)
  border: 1px solid hsl(250, 20%, 90%)
  font-size: 13px
  color: hsl(280, 10%, 10%)
  display: flex
  align-items: center
  gap: 8px
  
  .checkbox {
    width: 18px
    height: 18px
    border-radius: 6px
    border: 2px solid hsl(250, 20%, 80%)
  }
  
  .task-title {
    flex: 1
    font-weight: 500
  }
}
```

---

### 7. CHALLENGES Page

#### Layout
```
┌─────────────────────────┐
│  Challenges             │
│  Compete & grow         │
│                 [+ New] │
├─────────────────────────┤
│  Tabs:                  │
│  [All (12)][Joined (3)] │
├─────────────────────────┤
│  Challenge Card         │
│  ┌─────────────────┐    │
│  │ 🏆 30-Day Streak│    │
│  │ Active • 12d left│   │
│  │                 │    │
│  │ 👥 8 participants│   │
│  │ 📊 Your: 65%    │    │
│  │ ▓▓▓▓▓▓▓░░░░░░   │    │
│  │                 │    │
│  │ [Details][Leave]│    │
│  └─────────────────┘    │
└─────────────────────────┘
```

#### Challenge Card
```css
/* Card Container */
border-radius: 16px
padding: 16px
background: hsl(0, 0%, 100%)
border: 1px solid hsl(48, 96%, 53% / 0.3)
box-shadow: 0 2px 12px hsl(48, 96%, 53% / 0.08)

/* Header */
.icon-trophy {
  width: 40px
  height: 40px
  border-radius: 10px
  background: linear-gradient(135deg,
    hsl(48, 96%, 53% / 0.15) 0%,
    hsl(48, 96%, 53% / 0.25) 100%)
  display: flex
  align-items: center
  justify-content: center
  
  svg {
    width: 20px
    height: 20px
    color: hsl(48, 96%, 45%)
  }
}

.challenge-name {
  font-size: 16px
  font-weight: 600
  color: hsl(280, 10%, 10%)
  margin-bottom: 4px
}

.challenge-desc {
  font-size: 12px
  color: hsl(280, 5%, 40%)
  line-height: 1.4
  overflow: hidden
  text-overflow: ellipsis
  display: -webkit-box
  -webkit-line-clamp: 1
  -webkit-box-orient: vertical
}

/* Status Badge */
.status-badge {
  padding: 4px 10px
  border-radius: 12px
  font-size: 11px
  font-weight: 600
  
  /* Active */
  background: hsl(142, 71%, 45%)
  color: hsl(0, 0%, 100%)
  
  /* Ended */
  background: hsl(250, 20%, 85%)
  color: hsl(280, 5%, 40%)
}

/* Stats Grid */
.stats-grid {
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 8px
  margin: 12px 0
  
  .stat-box {
    padding: 12px
    border-radius: 12px
    background: hsl(250, 20%, 98%)
    border: 1px solid hsl(250, 20%, 92%)
    
    .label {
      display: flex
      align-items: center
      gap: 4px
      font-size: 11px
      color: hsl(280, 5%, 40%)
      margin-bottom: 4px
      
      svg {
        width: 12px
        height: 12px
      }
    }
    
    .value {
      font-size: 16px
      font-weight: 700
      color: hsl(280, 83%, 10%)
    }
  }
}

/* Your Progress (if participant) */
.your-progress {
  padding: 12px
  border-radius: 12px
  background: hsl(250, 20%, 98%)
  border: 1px solid hsl(250, 20%, 92%)
  margin: 12px 0
  
  .progress-header {
    display: flex
    align-items: center
    gap: 4px
    font-size: 11px
    font-weight: 600
    color: hsl(280, 5%, 40%)
    margin-bottom: 8px
    
    svg {
      width: 12px
      height: 12px
      color: hsl(280, 83%, 10%)
    }
  }
  
  .progress-visual {
    display: flex
    align-items: center
    gap: 12px
    
    .progress-bar {
      flex: 1
      height: 6px
      background: hsl(250, 20%, 90%)
      border-radius: 3px
      overflow: hidden
      
      .progress {
        height: 100%
        background: linear-gradient(90deg,
          hsl(280, 83%, 10%) 0%,
          hsl(262, 83%, 58%) 100%)
        transition: width 0.5s ease
      }
    }
    
    .progress-value {
      font-size: 12px
      font-weight: 700
      color: hsl(280, 83%, 10%)
    }
  }
}

/* Creator Info */
.creator-info {
  font-size: 11px
  color: hsl(280, 5%, 40%)
  margin-top: 8px
}

/* Action Buttons */
.actions {
  display: flex
  gap: 8px
  margin-top: 12px
  
  .details-button {
    flex: 1
    padding: 10px
    border-radius: 10px
    background: hsl(280, 83%, 10%)
    color: hsl(0, 0%, 100%)
    font-size: 13px
    font-weight: 600
  }
  
  .join-button {
    padding: 10px 20px
    border-radius: 10px
    background: hsl(48, 96%, 53%)
    color: hsl(280, 83%, 10%)
    font-size: 13px
    font-weight: 700
  }
  
  .leave-button {
    padding: 10px
    border-radius: 10px
    border: 1px solid hsl(250, 20%, 90%)
    background: hsl(0, 0%, 100%)
    color: hsl(0, 84%, 60%)
    font-size: 13px
    font-weight: 600
  }
}
```

---

### 8. CALENDAR (Unified View)

#### Layout
```
┌─────────────────────────┐
│  Calendar               │
│  [Month][Week][Day]     │
│                         │
│  < March 2025 >        │
│                         │
│  Su Mo Tu We Th Fr Sa  │
│   1  2  3  4  5  6  7  │
│   •  •     •           │
│   8  9 10 11 12 13 14  │
│      •  •     •        │
│  15 16 17 18 19 20 21  │
│   •     •              │
│  ... (rest of month)   │
│                         │
│  Legend:               │
│  • Tasks  • Habits     │
│  • Subs   • Trips      │
└─────────────────────────┘
```

#### Calendar Cell
```css
/* Day Cell */
aspect-ratio: 1
padding: 8px
border-radius: 8px
background: hsl(0, 0%, 100%)
border: 1px solid hsl(250, 20%, 92%)
position: relative
display: flex
flex-direction: column
align-items: center
justify-content: center

/* Day Number */
.day-number {
  font-size: 14px
  font-weight: 600
  color: hsl(280, 10%, 10%)
  margin-bottom: 4px
}

/* Today */
.today {
  border: 2px solid hsl(280, 83%, 10%)
  background: hsl(280, 83%, 10% / 0.05)
  
  .day-number {
    color: hsl(280, 83%, 10%)
  }
  
  /* Add "Today" label */
  &::after {
    content: "Today"
    font-size: 9px
    font-weight: 700
    color: hsl(280, 83%, 10%)
    text-transform: uppercase
    letter-spacing: 0.5px
  }
}

/* Event Dots */
.event-dots {
  display: flex
  gap: 3px
  position: absolute
  bottom: 4px
  
  .dot {
    width: 5px
    height: 5px
    border-radius: 50%
    
    /* Task */
    background: hsl(217, 91%, 60%)
    
    /* Habit */
    background: hsl(142, 71%, 45%)
    
    /* Subscription */
    background: hsl(0, 84%, 60%)
    
    /* Focus */
    background: hsl(262, 83%, 58%)
    
    /* Trip */
    background: hsl(330, 81%, 60%)
    
    /* Challenge */
    background: hsl(48, 96%, 53%)
  }
}

/* Other Month (grayed out) */
.other-month {
  opacity: 0.4
  background: hsl(250, 20%, 98%)
}
```

#### Legend
```css
.legend {
  display: flex
  flex-wrap: wrap
  gap: 12px
  padding: 16px
  border-radius: 12px
  background: hsl(250, 20%, 98%)
  border: 1px solid hsl(250, 20%, 92%)
  
  .legend-item {
    display: flex
    align-items: center
    gap: 6px
    font-size: 13px
    color: hsl(280, 10%, 10%)
    font-weight: 500
    
    .dot {
      width: 12px
      height: 12px
      border-radius: 50%
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
    }
  }
}
```

---

## 🌐 Internationalization (i18n) - RTL Support

### Layout Mirroring for Arabic
```css
/* When language is Arabic (ar) */
[dir="rtl"] {
  direction: rtl
  text-align: right
  
  /* Flex direction reversal */
  .flex-row {
    flex-direction: row-reverse
  }
  
  /* Padding/margin reversal */
  .ml-2 { margin-right: 8px; margin-left: 0; }
  .mr-2 { margin-left: 8px; margin-right: 0; }
  .pl-4 { padding-right: 16px; padding-left: 0; }
  .pr-4 { padding-left: 16px; padding-right: 0; }
  
  /* Icons/badges positioning */
  .badge-right { left: 8px; right: auto; }
  .icon-left { margin-right: 8px; margin-left: 0; }
}

/* Font switching */
html[lang="en"] {
  font-family: 'Inter', -apple-system, system-ui, sans-serif;
}

html[lang="ar"] {
  font-family: 'Noto Sans Arabic', -apple-system, system-ui, sans-serif;
}
```

---

## 🎯 Empty States

### Consistent Pattern
```css
/* Empty State Container */
display: flex
flex-direction: column
align-items: center
justify-content: center
padding: 48px 24px
min-height: 400px
text-align: center

/* Icon Circle */
.icon-container {
  width: 80px
  height: 80px
  border-radius: 50%
  background: hsl(250, 20%, 96%)
  display: flex
  align-items: center
  justify-content: center
  margin-bottom: 24px
  
  svg {
    width: 40px
    height: 40px
    color: hsl(280, 5%, 50%)
  }
}

/* Title */
.title {
  font-size: 20px
  font-weight: 700
  color: hsl(280, 10%, 10%)
  margin-bottom: 8px
}

/* Description */
.description {
  font-size: 14px
  color: hsl(280, 5%, 40%)
  max-width: 320px
  line-height: 1.5
  margin-bottom: 24px
}

/* CTA Button */
.cta-button {
  padding: 12px 24px
  border-radius: 12px
  background: hsl(280, 83%, 10%)
  color: hsl(0, 0%, 100%)
  font-weight: 600
  box-shadow: 0 4px 12px hsl(280, 83%, 10% / 0.2)
}
```

---

## 🎉 Interactions & Microinteractions

### Haptic Feedback (Native Mobile)
```javascript
// On button press
haptics.impact({ style: 'light' })

// On success action
haptics.notification({ type: 'success' })

// On error
haptics.notification({ type: 'error' })

// On long press
haptics.impact({ style: 'heavy' })
```

### Success Celebrations
```css
/* Confetti Animation (on habit check-in, focus completion, challenge milestone) */
import confetti from 'react-confetti'

<Confetti
  width={window.innerWidth}
  height={window.innerHeight}
  numberOfPieces={200}
  gravity={0.3}
  recycle={false}
  colors={[
    'hsl(280, 83%, 10%)',
    'hsl(142, 71%, 45%)',
    'hsl(48, 96%, 53%)',
    'hsl(262, 83%, 58%)',
    'hsl(330, 81%, 60%)'
  ]}
/>

/* Success Toast */
.success-toast {
  padding: 16px
  border-radius: 12px
  background: linear-gradient(135deg,
    hsl(142, 71%, 45%) 0%,
    hsl(142, 71%, 40%) 100%)
  color: hsl(0, 0%, 100%)
  font-weight: 600
  box-shadow: 0 4px 16px hsl(142, 71%, 45% / 0.3)
  animation: slide-in-right 0.3s ease
}
```

### Loading States
```css
/* Skeleton Card (while loading data) */
.skeleton-card {
  border-radius: 16px
  padding: 16px
  background: hsl(250, 20%, 96%)
  animation: pulse 1.5s ease-in-out infinite
}

.skeleton-line {
  height: 12px
  background: hsl(250, 20%, 90%)
  border-radius: 6px
  margin-bottom: 8px
}

.skeleton-circle {
  width: 48px
  height: 48px
  border-radius: 50%
  background: hsl(250, 20%, 90%)
}

/* Loading Spinner */
.spinner {
  width: 48px
  height: 48px
  border: 3px solid hsl(250, 20%, 92%)
  border-top-color: hsl(280, 83%, 10%)
  border-radius: 50%
  animation: spin 0.8s linear infinite
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 📏 Additional Design Tokens

### Shadows
```css
/* Shadow Scale */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.04)
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.08)
--shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.08), 0 16px 32px rgba(0, 0, 0, 0.12)
--shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.12), 0 32px 64px rgba(0, 0, 0, 0.16)

/* Colored Shadows (for emphasis) */
--shadow-primary: 0 4px 16px hsl(280, 83%, 10% / 0.2)
--shadow-success: 0 4px 16px hsl(142, 71%, 45% / 0.2)
--shadow-warning: 0 4px 16px hsl(38, 92%, 50% / 0.2)
--shadow-destructive: 0 4px 16px hsl(0, 84%, 60% / 0.2)
```

### Backgrounds
```css
/* Page Background Gradients */
--gradient-page: linear-gradient(180deg, 
  hsl(var(--muted) / 0.3) 0%, 
  hsl(var(--muted) / 0.1) 50%, 
  hsl(var(--background)) 100%)

/* Card Background Gradients */
--gradient-card-light: linear-gradient(135deg,
  hsl(0, 0%, 100%) 0%,
  hsl(250, 20%, 99%) 100%)

--gradient-card-dark: linear-gradient(135deg,
  hsl(280, 10%, 12% / 0.95) 0%,
  hsl(280, 10%, 14% / 0.9) 100%)

/* Button Gradients */
--gradient-primary: linear-gradient(135deg,
  hsl(280, 83%, 10%) 0%,
  hsl(280, 75%, 15%) 100%)

--gradient-success: linear-gradient(135deg,
  hsl(142, 71%, 45%) 0%,
  hsl(142, 71%, 40%) 100%)
```

### Icon Sizes
```css
--icon-xs: 14px
--icon-sm: 16px
--icon-md: 20px
--icon-lg: 24px
--icon-xl: 32px
--icon-2xl: 48px
```

### Touch Targets (Minimum)
```css
/* Minimum touch target for buttons/interactive elements */
min-width: 44px
min-height: 44px
/* iOS Human Interface Guidelines recommendation */
```

---

## ⚡ Performance Considerations

### Image Loading
```javascript
// Lazy loading for images
<img 
  src={imageUrl} 
  alt={description}
  loading="lazy"
  decoding="async"
/>

// Placeholder while loading
<img 
  src={lowResThumbnail}
  data-src={fullResImage}
  className="blur-up lazyload"
/>
```

### List Virtualization (for long lists)
```javascript
// Use virtual scrolling for lists > 50 items
import { VirtualList } from 'react-virtual'

<VirtualList
  height={600}
  itemCount={items.length}
  itemSize={80}
  renderItem={({ index, style }) => (
    <div style={style}>
      <HabitCard habit={items[index]} />
    </div>
  )}
/>
```

### Animation Performance
```css
/* GPU-accelerated properties only */
/* Use: transform, opacity */
/* Avoid: left, top, width, height, margin, padding */

.animated-element {
  transform: translateX(0);
  will-change: transform;
}

.animated-element:hover {
  transform: translateX(10px);
}
```

### Debouncing (Search inputs)
```javascript
// Debounce search queries
const debouncedSearch = debounce((query) => {
  performSearch(query)
}, 300)
```

### Optimistic UI Updates
```javascript
// Update UI immediately, sync with server in background
const handleCheckIn = async (habitId) => {
  // Optimistic update
  setHabits(prev => prev.map(h => 
    h.id === habitId 
      ? { ...h, checkedInToday: true, streak: h.streak + 1 }
      : h
  ))
  
  // Sync with server
  try {
    await api.checkIn(habitId)
  } catch (error) {
    // Rollback on error
    setHabits(prev => prev.map(h => 
      h.id === habitId 
        ? { ...h, checkedInToday: false, streak: h.streak - 1 }
        : h
    ))
    toast.error('Check-in failed')
  }
}
```

---

## 🎨 Final Design Notes

### Brand Essence
- **Modern & Minimal**: Clean interfaces, generous whitespace
- **Playful**: Emojis, celebrations, gamification elements
- **Professional**: Data-driven insights, analytics dashboards
- **Social**: Collaborative features, friends, sharing

### Design Principles
1. **Mobile-First**: Optimized for thumb zones and one-handed use
2. **Accessible**: High contrast, minimum 14px font size, proper touch targets
3. **Consistent**: Unified design language across all features
4. **Delightful**: Microinteractions, animations, celebrations
5. **Fast**: Optimistic updates, lazy loading, efficient rendering

### Key Differentiators
- **Tree Planting Gamification** in Focus mode (unique visual growth as user focuses)
- **Liquid Glass Cards** with subtle gradients and blur effects
- **Comprehensive All-in-One** approach (not just habits, but full life management)
- **Social Accountability** through challenges, shared habits, and friends
- **Beautiful Empty States** that encourage first actions

---

## 📋 Feature Summary Checklist

✅ **Habits** - Streaks, calendar heatmap, templates, categories
✅ **Focus/Pomodoro** - Tree planting, session types, statistics
✅ **Expenses** - Group splitting, individual expenses, balances
✅ **Subscriptions** - Trials tracking, renewal calendar, analytics
✅ **Trips** - Planning, task lists, member management
✅ **Tasks** - Eisenhower Matrix, projects, due dates
✅ **Challenges** - Group competitions, progress tracking, milestones
✅ **Calendar** - Unified view of all events
✅ **Friends** - Social connections, invites, accountability
✅ **Shared Habits** - Collaborative habit building
✅ **Profile** - Settings, preferences, statistics
✅ **Dashboard** - Overview widgets, quick actions

---

## 🚀 Build Instructions

When building this app:
1. Start with the **Color System** and **Typography** foundation
2. Build **Button** and **Card** components as base primitives
3. Implement **Mobile Navigation** structure
4. Create one feature at a time (start with Habits as it's the core)
5. Test RTL layout support throughout
6. Add **Loading States** and **Empty States** for every screen
7. Implement **Animations** last for polish
8. Test on both iOS and Android devices
9. Optimize performance (lazy loading, virtualization)
10. Add **Haptic Feedback** for native feel

---

## 📱 Technical Stack Recommendations

- **Framework**: React Native or Flutter
- **Navigation**: React Navigation or Flutter Navigator
- **State Management**: React Query + Zustand or Provider + Riverpod
- **Animations**: Reanimated or Flutter Animations
- **UI Components**: Custom (following this design system)
- **Icons**: Lucide Icons or SF Symbols / Material Icons
- **Fonts**: Inter (Google Fonts) + Noto Sans Arabic
- **Backend**: Supabase (already integrated in web version)

---

This specification provides **every visual detail** needed to recreate Splitz mobile app with pixel-perfect accuracy, including colors, spacing, typography, animations, and feature-specific designs. Use this as your complete reference document for building an identical mobile experience.
