import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { CustomTheme } from '../../theme';

export default function NotificationsScreen() {
  const theme = useTheme() as CustomTheme;
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Text>Notifications Screen</Text>
    </View>
  );
} 

