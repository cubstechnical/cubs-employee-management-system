import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, IconButton, useTheme, Surface } from 'react-native-paper';
import { CustomTheme } from '../theme';

interface AssetPlaceholderProps {
  type: 'logo' | 'icon' | 'image' | 'illustration';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  label?: string;
  description?: string;
  iconName?: string;
  style?: ViewStyle;
  borderRadius?: number;
}

export const AssetPlaceholder: React.FC<AssetPlaceholderProps> = ({
  type,
  size = 'medium',
  label,
  description,
  iconName,
  style,
  borderRadius = 8,
}) => {
  const theme = useTheme() as CustomTheme;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40, padding: 8 };
      case 'medium':
        return { width: 80, height: 80, padding: 16 };
      case 'large':
        return { width: 120, height: 120, padding: 24 };
      case 'xlarge':
        return { width: 200, height: 200, padding: 32 };
      default:
        return { width: 80, height: 80, padding: 16 };
    }
  };

  const getDefaultIcon = () => {
    if (iconName) return iconName;
    
    switch (type) {
      case 'logo':
        return 'domain';
      case 'icon':
        return 'image-outline';
      case 'image':
        return 'image-multiple-outline';
      case 'illustration':
        return 'palette-outline';
      default:
        return 'image-outline';
    }
  };

  const getDefaultLabel = () => {
    if (label) return label;
    
    switch (type) {
      case 'logo':
        return 'Logo';
      case 'icon':
        return 'Icon';
      case 'image':
        return 'Image';
      case 'illustration':
        return 'Illustration';
      default:
        return 'Asset';
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <Surface
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius,
          ...sizeStyles,
        },
        style,
      ]}
      elevation={1}
    >
      <View style={styles.content}>
        <IconButton
          icon={getDefaultIcon()}
          size={size === 'small' ? 16 : size === 'large' ? 32 : size === 'xlarge' ? 48 : 24}
          iconColor={theme.colors.onSurfaceVariant}
          style={styles.icon}
        />
        {(size === 'large' || size === 'xlarge') && (
          <>
            <Text
              variant={size === 'xlarge' ? 'titleMedium' : 'bodyMedium'}
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              {getDefaultLabel()}
            </Text>
            {description && (
              <Text
                variant="bodySmall"
                style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
                numberOfLines={2}
              >
                {description}
              </Text>
            )}
          </>
        )}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  icon: {
    margin: 0,
  },
  label: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  description: {
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default AssetPlaceholder; 