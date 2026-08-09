import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SwipeScreen from '../screens/SwipeScreen';
import ChatsScreen from '../screens/ChatsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useTheme } from '../theme/ThemeProvider';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: colors.text,
          fontSize: 18,
        },
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Explore') {
            iconName = focused ? 'flame' : 'flame-outline';
          } else if (route.name === 'Chats') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
          height: 60 + insets.bottom,
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
      })}
    >
      <Tab.Screen name="Explore" component={SwipeScreen} options={{ title: 'Explorar' }} />
      <Tab.Screen name="Chats" component={ChatsScreen} options={{ title: 'Chats' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
