import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Avatar, Text, useTheme, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomTheme } from '../theme';
import { safeThemeAccess } from '../utils/errorPrevention';

interface AvatarPlaceholderProps {
  name?: string;
  size?: number;
  style?: ViewStyle;
  backgroundColor?: string;
  textColor?: string;
}

export function AvatarPlaceholder({ backgroundColor, ...props }: AvatarPlaceholderProps) {
  const theme = useTheme() as CustomTheme;
  const themedStyles = StyleSheet.create({
    avatar: {
      backgroundColor: backgroundColor || safeThemeAccess.colors(theme, 'primaryContainer'),
    },
    avatarText: {
      color: props.textColor || safeThemeAccess.colors(theme, 'onPrimaryContainer'),
      fontWeight: 'bold',
      fontSize: (props.size || 40) * 0.4,
    },
  });
  const initials = (props.name || '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={[
        styles.avatarContainer,
        {
          width: props.size || 40,
          height: props.size || 40,
          borderRadius: (props.size || 40) / 2,
        },
        themedStyles.avatar,
        props.style,
      ]}
    >
      <Text style={themedStyles.avatarText}>{initials}</Text>
    </View>
  );
}

interface IconPlaceholderProps {
  name?: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function IconPlaceholder({ color, ...props }: IconPlaceholderProps) {
  const theme = useTheme() as CustomTheme;
  const themedStyles = StyleSheet.create({
    icon: {
      color: color || safeThemeAccess.colors(theme, 'onSurfaceVariant'),
    },
  });
  return (
    <MaterialCommunityIcons
      name={props.name as any}
      size={props.size || 24}
      style={[themedStyles.icon, props.style as any]}
    />
  );
}

interface ImagePlaceholderProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
  backgroundColor?: string;
}

export function ImagePlaceholder({ backgroundColor, ...props }: ImagePlaceholderProps) {
  const theme = useTheme() as CustomTheme;
  const themedStyles = StyleSheet.create({
    image: {
      backgroundColor: backgroundColor || safeThemeAccess.colors(theme, 'surfaceVariant'),
    },
  });
  return (
    <View
      style={[
        styles.imagePlaceholder,
        {
          width: props.width || 100,
          height: props.height || 100,
          borderRadius: 8,
        },
        themedStyles.image,
        props.style,
      ]}
    />
  );
}

interface PlaceholderCardProps {
  title?: string;
  description?: string;
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
}

export function PlaceholderCard({ title = 'Placeholder', description, backgroundColor, ...props }: PlaceholderCardProps) {
  const theme = useTheme() as CustomTheme;
  
  return (
    <Card style={[styles.card, { 
      backgroundColor: backgroundColor || safeThemeAccess.colors(theme, 'primaryContainer'),
    }]}>
      <Card.Content>
        <Text variant="titleMedium" style={{ 
          color: props.textColor || safeThemeAccess.colors(theme, 'onPrimaryContainer'),
        }}>
          {title}
        </Text>
        {description && (
          <Text variant="bodyMedium" style={{ marginTop: 8 }}>
            {description}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    borderRadius: 8,
  },
  card: {
    margin: 16,
  },
}); 
