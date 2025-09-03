import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import des écrans (à créer)
import HomeScreen from '../screens/HomeScreen';
import CalendarsScreen from '../screens/CalendarsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ScannerScreen from '../screens/ScannerScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack pour les calendriers (avec navigation détaillée)
function CalendarsStack({ sharedProps }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="CalendarsList" 
        options={{ title: 'Mes Calendriers' }}
      >
        {props => <CalendarsScreen {...props} sharedProps={sharedProps} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Stack pour les notifications
function NotificationsStack({ sharedProps }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="NotificationsList" 
        options={{ title: 'Notifications' }}
      >
        {props => <NotificationsScreen {...props} sharedProps={sharedProps} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function TabNavigator({ sharedProps }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Calendars') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Scanner') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#f8f9fa',
          borderTopColor: '#e9ecef',
          borderTopWidth: 1,
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        options={{ title: 'Accueil' }}
      >
        {props => <HomeScreen {...props} sharedProps={sharedProps} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="Calendars" 
        options={{ title: 'Calendriers' }}
      >
        {props => <CalendarsStack {...props} sharedProps={sharedProps} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="Scanner" 
        options={{ title: 'Scanner' }}
      >
        {props => <ScannerScreen {...props} sharedProps={sharedProps} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="Notifications" 
        options={{ title: 'Notifications' }}
      >
        {props => <NotificationsStack {...props} sharedProps={sharedProps} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="Settings" 
        options={{ title: 'Paramètres' }}
      >
        {props => <SettingsScreen {...props} sharedProps={sharedProps} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default TabNavigator;
