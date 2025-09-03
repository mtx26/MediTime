import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Import des écrans
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import MedicinesScreen from '../screens/MedicinesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AuthScreen from '../screens/AuthScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Medicines') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#F8F8F8',
          borderTopColor: '#C6C6C8',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -1 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        headerStyle: {
          backgroundColor: '#F8F8F8',
          borderBottomColor: '#C6C6C8',
          borderBottomWidth: 0.5,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
          ...Platform.select({
            ios: {
              fontFamily: 'System',
            },
          }),
        },
        headerLargeTitle: Platform.OS === 'ios',
        headerLargeTitleStyle: {
          fontWeight: '700',
          fontSize: 34,
          ...Platform.select({
            ios: {
              fontFamily: 'System',
            },
          }),
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Accueil',
          headerTitle: '',
          headerLargeTitle: true,
        }} 
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen} 
        options={{ 
          title: 'Calendrier',
          headerLargeTitle: true,
        }} 
      />
      <Tab.Screen 
        name="Medicines" 
        component={MedicinesScreen} 
        options={{ 
          title: 'Médicaments',
          headerLargeTitle: true,
        }} 
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ 
          title: 'Notifications',
          headerLargeTitle: true,
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ 
          title: 'Paramètres',
          headerTitle: '',
          headerLargeTitle: true,
        }} 
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ isAuthenticated }) {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: '#F2F2F7' },
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
