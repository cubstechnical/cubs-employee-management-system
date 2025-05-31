import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Banner, Text } from 'react-native-paper';
import { isSupabaseConfigured } from '../services/supabase';

export default function DemoModeMessage() {
  if (isSupabaseConfigured) {
    return null;
  }

  return (
    <Banner
      visible={true}
      style={styles.banner}
      icon="information"
    >
      <Text variant="bodyMedium" style={styles.text}>
        🚀 Demo Mode: Supabase not configured. Login with any email (use "admin" in email for admin access)
      </Text>
    </Banner>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFF3CD',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4A3',
  },
  text: {
    color: '#856404',
    flexWrap: 'wrap',
  },
}); 