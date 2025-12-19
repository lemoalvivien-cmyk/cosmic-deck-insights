/**
 * Mystic Premium - Motion Design Tokens
 * Centralized animation values for consistent motion design
 */

export const motionTokens = {
  // Durations (in seconds)
  duration: {
    instant: 0.1,
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    slower: 0.8,
    dramatic: 1.2,
  },

  // Durations in milliseconds (for JS animations)
  durationMs: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 800,
    dramatic: 1200,
  },

  // Easing curves
  easing: {
    // Standard easings
    linear: "linear",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    
    // Mystic Premium custom easings
    mysticIn: "cubic-bezier(0.22, 1, 0.36, 1)",     // Smooth reveal
    mysticOut: "cubic-bezier(0.55, 0, 1, 0.45)",   // Gentle fade
    mysticBounce: "cubic-bezier(0.34, 1.56, 0.64, 1)", // Subtle bounce
    celestial: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // Ethereal float
    cardFlip: "cubic-bezier(0.68, -0.55, 0.265, 1.55)", // Card flip with overshoot
  },

  // Distances (in pixels)
  distance: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
    float: 10, // For floating animations
    slide: 100, // For slide-in effects
    cardLift: 6, // Hover lift for cards
  },

  // Scale values
  scale: {
    shrink: 0.95,
    normal: 1,
    grow: 1.05,
    emphasize: 1.1,
    twinkle: 1.2,
  },

  // Rotation (in degrees)
  rotation: {
    subtle: 2,
    card: 5,
    flip: 180,
    full: 360,
  },

  // Stagger delays for sequential animations
  stagger: {
    fast: 0.05,
    normal: 0.1,
    slow: 0.15,
  },

  // Opacity values
  opacity: {
    hidden: 0,
    dim: 0.4,
    muted: 0.6,
    visible: 1,
  },
} as const;

// CSS custom property format for use in styles
export const motionCSSVars = {
  "--motion-duration-instant": `${motionTokens.duration.instant}s`,
  "--motion-duration-fast": `${motionTokens.duration.fast}s`,
  "--motion-duration-normal": `${motionTokens.duration.normal}s`,
  "--motion-duration-slow": `${motionTokens.duration.slow}s`,
  "--motion-duration-slower": `${motionTokens.duration.slower}s`,
  "--motion-duration-dramatic": `${motionTokens.duration.dramatic}s`,
  "--motion-easing-mystic-in": motionTokens.easing.mysticIn,
  "--motion-easing-mystic-out": motionTokens.easing.mysticOut,
  "--motion-easing-mystic-bounce": motionTokens.easing.mysticBounce,
  "--motion-easing-celestial": motionTokens.easing.celestial,
  "--motion-easing-card-flip": motionTokens.easing.cardFlip,
} as const;

// Preset animation configurations
export const motionPresets = {
  fadeIn: {
    duration: motionTokens.duration.normal,
    easing: motionTokens.easing.mysticIn,
    distance: motionTokens.distance.md,
  },
  cardHover: {
    duration: motionTokens.duration.fast,
    easing: motionTokens.easing.easeOut,
    scale: motionTokens.scale.grow,
    lift: motionTokens.distance.cardLift,
  },
  cardFlip: {
    duration: motionTokens.duration.slower,
    easing: motionTokens.easing.cardFlip,
    rotation: motionTokens.rotation.flip,
  },
  float: {
    duration: 6, // Slow continuous animation
    easing: motionTokens.easing.celestial,
    distance: motionTokens.distance.float,
  },
  twinkle: {
    duration: 3,
    easing: motionTokens.easing.easeInOut,
    scale: motionTokens.scale.twinkle,
  },
  slideIn: {
    duration: motionTokens.duration.slow,
    easing: motionTokens.easing.mysticIn,
    distance: motionTokens.distance.slide,
  },
} as const;

export type MotionTokens = typeof motionTokens;
export type MotionPresets = typeof motionPresets;
