import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { Home, Users, Bell, FileText } from 'lucide-react-native';
import { CustomTheme } from '../../theme';
import { safeThemeAccess } from '../../utils/errorPrevention';

export default function TabsLayout() {
  const theme = useTheme() as CustomTheme;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: safeThemeAccess.colors(theme, 'primary'),
        tabBarInactiveTintColor: safeThemeAccess.colors(theme, 'onSurface'),
        tabBarStyle: {
          backgroundColor: safeThemeAccess.colors(theme, 'surface'),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: 'Employees',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="visa-form"
        options={{
          title: 'Visa',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
