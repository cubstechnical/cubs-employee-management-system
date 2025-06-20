import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Vibration, ScrollView } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Text, IconButton, Surface, Card } from 'react-native-paper';
import { MODERN_COLORS, SPACING, createPressAnimation } from './ModernDesignSystem';
import { getDeviceInfo, platformUtils } from '../utils/mobileUtils';

// Enhanced Swipeable Card
interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: Array<{
    icon: string;
    color: string;
    onPress: () => void;
    label?: string;
  }>;
  rightActions?: Array<{
    icon: string;
    color: string;
    onPress: () => void;
    label?: string;
  }>;
  onSwipeComplete?: (direction: 'left' | 'right') => void;
  swipeThreshold?: number;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeComplete,
  swipeThreshold = 120,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const { isPhone } = getDeviceInfo();

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === 5) { // END state
      const { translationX } = event.nativeEvent;
      
      if (Math.abs(translationX) > swipeThreshold) {
        // Complete swipe
        const direction = translationX > 0 ? 'right' : 'left';
        
        // Haptic feedback
        if (platformUtils.isIOS || platformUtils.isAndroid) {
          Vibration.vibrate(50);
        }
        
        Animated.spring(translateX, {
          toValue: translationX > 0 ? 300 : -300,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start(() => {
          onSwipeComplete?.(direction);
          // Reset position
          translateX.setValue(0);
        });
      } else {
        // Snap back
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
      setIsSwipeActive(false);
    } else if (event.nativeEvent.state === 2) { // ACTIVE state
      setIsSwipeActive(true);
    }
  };

  const actionWidth = 80;
  const maxActions = isPhone ? 2 : 3;

  return (
    <View style={styles.swipeContainer}>
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <View style={[styles.actionsContainer, styles.leftActions]}>
          {leftActions.slice(0, maxActions).map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                { backgroundColor: action.color, width: actionWidth }
              ]}
              onPress={action.onPress}
            >
              <IconButton icon={action.icon} iconColor="white" size={20} />
              {action.label && !isPhone && (
                <Text style={styles.actionLabel}>{action.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <View style={[styles.actionsContainer, styles.rightActions]}>
          {rightActions.slice(0, maxActions).map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                { backgroundColor: action.color, width: actionWidth }
              ]}
              onPress={action.onPress}
            >
              <IconButton icon={action.icon} iconColor="white" size={20} />
              {action.label && !isPhone && (
                <Text style={styles.actionLabel}>{action.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Card */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.swipeableCard,
            {
              transform: [{ translateX }],
              opacity: isSwipeActive ? 0.95 : 1,
              elevation: isSwipeActive ? 8 : 2,
            }
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Floating Action Button with Menu
interface FABAction {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FloatingActionMenuProps {
  actions: FABAction[];
  mainIcon?: string;
  mainColor?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  actions,
  mainIcon = 'plus',
  mainColor = MODERN_COLORS.primary[500],
  position = 'bottom-right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const animatedValues = useRef(
    actions.map(() => new Animated.Value(0))
  ).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  const { isPhone } = getDeviceInfo();

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    setIsOpen(!isOpen);

    // Animate main button rotation
    Animated.spring(rotateValue, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Animate action buttons
    Animated.stagger(
      50,
      animatedValues.map(value =>
        Animated.spring(value, {
          toValue,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        })
      )
    ).start();
  };

  const getPositionStyle = () => {
    const base = { position: 'absolute' as const, zIndex: 1000 };
    const offset = SPACING[4];
    
    switch (position) {
      case 'bottom-right':
        return { ...base, bottom: offset, right: offset };
      case 'bottom-left':
        return { ...base, bottom: offset, left: offset };
      case 'top-right':
        return { ...base, top: offset, right: offset };
      case 'top-left':
        return { ...base, top: offset, left: offset };
      default:
        return { ...base, bottom: offset, right: offset };
    }
  };

  const getActionPosition = (index: number) => {
    const spacing = 70;
    const isVertical = position.includes('bottom') || position.includes('top');
    const isReverse = position.includes('top') || position.includes('left');
    
    if (isVertical) {
      return {
        [position.includes('bottom') ? 'bottom' : 'top']: 
          (index + 1) * spacing + (isReverse ? 0 : 0),
      };
    } else {
      return {
        [position.includes('right') ? 'right' : 'left']: 
          (index + 1) * spacing + (isReverse ? 0 : 0),
      };
    }
  };

  const rotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={getPositionStyle()}>
      {/* Action Buttons */}
      {actions.map((action, index) => {
        const translateY = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(index + 1) * 70],
        });

        const scale = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.fabAction,
              getActionPosition(index),
              {
                transform: [{ translateY }, { scale }],
                opacity: animatedValues[index],
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.actionFab,
                { backgroundColor: action.color || MODERN_COLORS.gray[600] }
              ]}
              onPress={() => {
                action.onPress();
                toggleMenu();
              }}
              {...createPressAnimation(scaleValue)}
            >
              <IconButton icon={action.icon} iconColor="white" size={20} />
            </TouchableOpacity>
            {!isPhone && (
              <Text style={styles.fabLabel}>{action.label}</Text>
            )}
          </Animated.View>
        );
      })}

      {/* Main FAB */}
      <TouchableOpacity
        style={[styles.mainFab, { backgroundColor: mainColor }]}
        onPress={toggleMenu}
        {...createPressAnimation(scaleValue)}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <IconButton icon={mainIcon} iconColor="white" size={24} />
        </Animated.View>
      </TouchableOpacity>

      {/* Backdrop */}
      {isOpen && (
        <TouchableOpacity
          style={styles.fabBackdrop}
          onPress={toggleMenu}
          activeOpacity={1}
        />
      )}
    </View>
  );
};

// Pull to Refresh Component
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshing = false,
  threshold = 80,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const { translationY } = event.nativeEvent;
        setPullDistance(Math.max(0, translationY));
      },
    }
  );

  const onHandlerStateChange = async (event: any) => {
    if (event.nativeEvent.state === 5) { // END state
      const { translationY } = event.nativeEvent;
      
      if (translationY > threshold && !isRefreshing) {
        setIsRefreshing(true);
        
        // Haptic feedback
        if (platformUtils.isIOS || platformUtils.isAndroid) {
          Vibration.vibrate(100);
        }
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
      
      setPullDistance(0);
    }
  };

  const refreshProgress = Math.min(pullDistance / threshold, 1);
  const refreshOpacity = refreshProgress;
  const spinRotation = translateY.interpolate({
    inputRange: [0, threshold],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.pullToRefreshContainer}>
      {/* Refresh Indicator */}
      <Animated.View
        style={[
          styles.refreshIndicator,
          {
            opacity: refreshOpacity,
            transform: [
              { translateY: Animated.subtract(translateY, threshold) },
              { rotate: spinRotation },
            ],
          }
        ]}
      >
        <IconButton
          icon={isRefreshing ? 'loading' : 'refresh'}
          iconColor={MODERN_COLORS.primary[500]}
          size={24}
        />
      </Animated.View>

      {/* Content */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetY={[0, 10]}
      >
        <Animated.View
          style={[
            styles.pullToRefreshContent,
            { transform: [{ translateY: Animated.multiply(translateY, 0.5) }] }
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Smart Toast/Snackbar
interface SmartToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
  visible: boolean;
}

export const SmartToast: React.FC<SmartToastProps> = ({
  message,
  type = 'info',
  duration = 4000,
  action,
  onDismiss,
  visible,
}) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          onDismiss?.();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, duration, onDismiss]);

  const getTypeColors = () => {
    switch (type) {
      case 'success':
        return { bg: MODERN_COLORS.success[500], icon: 'check-circle' };
      case 'warning':
        return { bg: MODERN_COLORS.warning[500], icon: 'alert-circle' };
      case 'error':
        return { bg: MODERN_COLORS.error[500], icon: 'close-circle' };
      default:
        return { bg: MODERN_COLORS.primary[500], icon: 'information' };
    }
  };

  const colors = getTypeColors();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: colors.bg,
        }
      ]}
    >
      <IconButton
        icon={colors.icon}
        iconColor="white"
        size={20}
      />
      <Text style={styles.toastMessage}>{message}</Text>
      {action && (
        <TouchableOpacity
          style={styles.toastAction}
          onPress={action.onPress}
        >
          <Text style={styles.toastActionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.toastClose}
        onPress={onDismiss}
      >
        <IconButton icon="close" iconColor="white" size={18} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  leftActions: {
    left: 0,
  },
  rightActions: {
    right: 0,
  },
  actionButton: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING[2],
  },
  actionLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginTop: SPACING[1],
  },
  swipeableCard: {
    backgroundColor: 'white',
    zIndex: 2,
  },
  fabAction: {
    position: 'absolute',
    alignItems: 'center',
  },
  actionFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabLabel: {
    marginTop: SPACING[1],
    fontSize: 10,
    fontWeight: '600',
    color: MODERN_COLORS.gray[700],
    backgroundColor: 'white',
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: 12,
    elevation: 2,
  },
  mainFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: -1,
  },
  pullToRefreshContainer: {
    flex: 1,
    position: 'relative',
  },
  refreshIndicator: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    zIndex: 10,
  },
  pullToRefreshContent: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    bottom: SPACING[6],
    left: SPACING[4],
    right: SPACING[4],
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: SPACING[3],
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 9999,
  },
  toastMessage: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: SPACING[2],
  },
  toastAction: {
    marginLeft: SPACING[3],
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[2],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: SPACING[1],
  },
  toastActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  toastClose: {
    marginLeft: SPACING[2],
  },
});

export default {
  SwipeableCard,
  FloatingActionMenu,
  PullToRefresh,
  SmartToast,
}; 