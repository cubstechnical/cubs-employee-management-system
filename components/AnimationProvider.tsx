import React, { createContext, useContext, useRef, useEffect } from 'react';
import { Animated, Easing, Platform } from 'react-native';

// Animation configuration constants
export const ANIMATION_CONFIGS = {
  // Duration presets
  duration: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 750,
    slowest: 1000,
  },
  
  // Easing presets
  easing: {
    linear: Easing.linear,
    ease: Easing.ease,
    easeIn: Easing.in(Easing.ease),
    easeOut: Easing.out(Easing.ease),
    easeInOut: Easing.inOut(Easing.ease),
    bounce: Easing.bounce,
    elastic: Easing.elastic(1),
    bezier: Easing.bezier(0.25, 0.1, 0.25, 1),
    spring: Easing.elastic(0.8),
  },
  
  // Stagger animation settings
  stagger: {
    delay: 100,
    duration: 300,
    easing: Easing.out(Easing.ease),
  },
  
  // Scale animation presets
  scale: {
    small: { from: 0.9, to: 1 },
    medium: { from: 0.8, to: 1 },
    large: { from: 0.5, to: 1 },
    bounce: { from: 0, to: 1.1, settle: 1 },
  },
  
  // Slide animation presets
  slide: {
    distance: {
      small: 20,
      medium: 50,
      large: 100,
    },
  },
  
  // Fade animation presets
  fade: {
    from: 0,
    to: 1,
  },
  
  // Rotation presets
  rotation: {
    quarter: '90deg',
    half: '180deg',
    full: '360deg',
  },
};

// Animation context
interface AnimationContextType {
  createFadeIn: (duration?: number) => Animated.CompositeAnimation;
  createSlideIn: (direction: 'up' | 'down' | 'left' | 'right', distance?: number, duration?: number) => Animated.CompositeAnimation;
  createScaleIn: (scale?: 'small' | 'medium' | 'large', duration?: number) => Animated.CompositeAnimation;
  createBounce: (duration?: number) => Animated.CompositeAnimation;
  createStagger: (animations: Animated.CompositeAnimation[], delay?: number) => Animated.CompositeAnimation;
  createSequence: (animations: Animated.CompositeAnimation[]) => Animated.CompositeAnimation;
  createParallel: (animations: Animated.CompositeAnimation[]) => Animated.CompositeAnimation;
  createSpring: (toValue: number, tension?: number, friction?: number) => Animated.CompositeAnimation;
}

const AnimationContext = createContext<AnimationContextType | null>(null);

// Animation provider component
export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const createFadeIn = (duration = ANIMATION_CONFIGS.duration.normal) => {
    const fadeValue = new Animated.Value(0);
    return Animated.timing(fadeValue, {
      toValue: 1,
      duration,
      easing: ANIMATION_CONFIGS.easing.easeOut,
      useNativeDriver: true,
    });
  };

  const createSlideIn = (
    direction: 'up' | 'down' | 'left' | 'right',
    distance = ANIMATION_CONFIGS.slide.distance.medium,
    duration = ANIMATION_CONFIGS.duration.normal
  ) => {
    const slideValue = new Animated.Value(
      direction === 'up' || direction === 'left' ? -distance : distance
    );
    
    return Animated.timing(slideValue, {
      toValue: 0,
      duration,
      easing: ANIMATION_CONFIGS.easing.easeOut,
      useNativeDriver: true,
    });
  };

  const createScaleIn = (
    scale: 'small' | 'medium' | 'large' = 'medium',
    duration = ANIMATION_CONFIGS.duration.normal
  ) => {
    const scaleValue = new Animated.Value(ANIMATION_CONFIGS.scale[scale].from);
    
    return Animated.timing(scaleValue, {
      toValue: ANIMATION_CONFIGS.scale[scale].to,
      duration,
      easing: ANIMATION_CONFIGS.easing.easeOut,
      useNativeDriver: true,
    });
  };

  const createBounce = (duration = ANIMATION_CONFIGS.duration.normal) => {
    const bounceValue = new Animated.Value(0);
    
    return Animated.sequence([
      Animated.timing(bounceValue, {
        toValue: 1.1,
        duration: duration * 0.6,
        easing: ANIMATION_CONFIGS.easing.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(bounceValue, {
        toValue: 1,
        duration: duration * 0.4,
        easing: ANIMATION_CONFIGS.easing.easeIn,
        useNativeDriver: true,
      }),
    ]);
  };

  const createStagger = (
    animations: Animated.CompositeAnimation[],
    delay = ANIMATION_CONFIGS.stagger.delay
  ) => {
    const staggeredAnimations = animations.map((animation, index) => {
      return Animated.sequence([
        Animated.delay(index * delay),
        animation,
      ]);
    });
    
    return Animated.parallel(staggeredAnimations);
  };

  const createSequence = (animations: Animated.CompositeAnimation[]) => {
    return Animated.sequence(animations);
  };

  const createParallel = (animations: Animated.CompositeAnimation[]) => {
    return Animated.parallel(animations);
  };

  const createSpring = (
    toValue: number,
    tension = 40,
    friction = 7
  ) => {
    const springValue = new Animated.Value(0);
    
    return Animated.spring(springValue, {
      toValue,
      tension,
      friction,
      useNativeDriver: true,
    });
  };

  const contextValue: AnimationContextType = {
    createFadeIn,
    createSlideIn,
    createScaleIn,
    createBounce,
    createStagger,
    createSequence,
    createParallel,
    createSpring,
  };

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  );
};

// Hook to use animation context
export const useAnimations = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimations must be used within an AnimationProvider');
  }
  return context;
};

// Pre-built animation components
interface AnimatedFadeSlideProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}

export const AnimatedFadeSlide: React.FC<AnimatedFadeSlideProps> = ({
  children,
  duration = ANIMATION_CONFIGS.duration.normal,
  delay = 0,
  direction = 'up',
  distance = ANIMATION_CONFIGS.slide.distance.medium,
}) => {
  const fadeValue = useRef(new Animated.Value(0)).current;
  const slideValue = useRef(
    new Animated.Value(direction === 'up' || direction === 'left' ? -distance : distance)
  ).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeValue, {
        toValue: 1,
        duration,
        delay,
        easing: ANIMATION_CONFIGS.easing.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(slideValue, {
        toValue: 0,
        duration,
        delay,
        easing: ANIMATION_CONFIGS.easing.easeOut,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
  }, [fadeValue, slideValue, duration, delay]);

  const transform = 
    direction === 'up' || direction === 'down'
      ? [{ translateY: slideValue }]
      : [{ translateX: slideValue }];

  return (
    <Animated.View
      style={{
        opacity: fadeValue,
        transform,
      }}
    >
      {children}
    </Animated.View>
  );
};

interface AnimatedScaleInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  scale?: 'small' | 'medium' | 'large';
}

export const AnimatedScaleIn: React.FC<AnimatedScaleInProps> = ({
  children,
  duration = ANIMATION_CONFIGS.duration.normal,
  delay = 0,
  scale = 'medium',
}) => {
  const scaleValue = useRef(new Animated.Value(ANIMATION_CONFIGS.scale[scale].from)).current;

  useEffect(() => {
    const animation = Animated.timing(scaleValue, {
      toValue: ANIMATION_CONFIGS.scale[scale].to,
      duration,
      delay,
      easing: ANIMATION_CONFIGS.easing.easeOut,
      useNativeDriver: true,
    });

    animation.start();
  }, [scaleValue, duration, delay, scale]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleValue }],
      }}
    >
      {children}
    </Animated.View>
  );
};

// Stagger animation hook
export const useStaggerAnimation = (
  itemCount: number,
  delay = ANIMATION_CONFIGS.stagger.delay
) => {
  const animations = useRef(
    Array.from({ length: itemCount }, () => new Animated.Value(0))
  ).current;

  const startStagger = () => {
    const staggeredAnimations = animations.map((animation, index) =>
      Animated.timing(animation, {
        toValue: 1,
        duration: ANIMATION_CONFIGS.stagger.duration,
        delay: index * delay,
        easing: ANIMATION_CONFIGS.stagger.easing,
        useNativeDriver: true,
      })
    );

    Animated.parallel(staggeredAnimations).start();
  };

  return { animations, startStagger };
};

// Bounce animation hook
export const useBounceAnimation = () => {
  const bounceValue = useRef(new Animated.Value(1)).current;

  const bounce = () => {
    Animated.sequence([
      Animated.timing(bounceValue, {
        toValue: 1.2,
        duration: 100,
        easing: ANIMATION_CONFIGS.easing.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(bounceValue, {
        toValue: 1,
        duration: 100,
        easing: ANIMATION_CONFIGS.easing.easeIn,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { bounceValue, bounce };
};

// Pulse animation hook
export const usePulseAnimation = () => {
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [pulseValue]);

  return pulseValue;
};

// Loading animation hook
export const useLoadingAnimation = () => {
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotate = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    rotate.start();

    return () => rotate.stop();
  }, [rotateValue]);

  const rotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return rotation;
};

// Platform-specific animations
export const PlatformAnimations = {
  // Web-specific animations
  web: {
    hover: {
      scale: 1.02,
      transition: 'all 0.2s ease',
    },
    focus: {
      boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)',
      transition: 'box-shadow 0.2s ease',
    },
  },
  
  // Mobile-specific animations
  mobile: {
    pressIn: { scale: 0.98 },
    pressOut: { scale: 1 },
  },
};

// Export animation utilities
export const AnimationUtils = {
  // Create a delay
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Interpolate values
  interpolate: (
    animatedValue: Animated.Value,
    inputRange: number[],
    outputRange: number[] | string[]
  ) => {
    return animatedValue.interpolate({
      inputRange,
      outputRange,
      extrapolate: 'clamp',
    });
  },
  
  // Create timing animation
  timing: (
    value: Animated.Value,
    toValue: number,
    duration = ANIMATION_CONFIGS.duration.normal,
    easing = ANIMATION_CONFIGS.easing.easeOut
  ) => {
    return Animated.timing(value, {
      toValue,
      duration,
      easing,
      useNativeDriver: true,
    });
  },
  
  // Create spring animation
  spring: (
    value: Animated.Value,
    toValue: number,
    config = { tension: 40, friction: 7 }
  ) => {
    return Animated.spring(value, {
      toValue,
      ...config,
      useNativeDriver: true,
    });
  },
};

export default AnimationProvider; 