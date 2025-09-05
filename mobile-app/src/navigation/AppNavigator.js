import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, ActivityIndicator, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { UserContext } from '../contexts/UserContext';

// Import des écrans
import HomePage from '../screens/general/HomePage';
/*
import Auth from '../pages/auth/Auth';
import ResetPassword from '../pages/auth/ResetPassword';
import ResetPasswordConfirm from '../pages/auth/ResetPasswordConfirm';
import VerifyEmail from '../pages/auth/VerifyEmail';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import SettingsPage from '../pages/settings/SettingsPage';
import AddCalendarPage from '../pages/calendar/AddCalendarPage';
import MedicineReview from '../pages/calendar/MedicineReview';
import AcceptInvitePage from '../pages/calendar/AcceptInvitePage';
import CalendarView from '../pages/calendar/CalendarView';
import PillboxPage from '../pages/calendar/Pillbox';
import CalendarList from '../pages/calendar/CalendarList';
import SharedList from '../pages/share/SharedList';
import StockAlertsPage from '../pages/calendar/StockAlertsPage';
import MedicinesList from '../pages/medicines/MedicinesList';
import BoxesView from '../pages/medicines/BoxesView';
import NotFound from '../pages/general/NotFound';
import PrivacyPage from '../pages/general/PrivacyPage';
import TermsPage from '../pages/general/TermsPage';
import AuthCallback from '../pages/auth/AuthCallback';
import CalendarSettingsPage from '../pages/calendar/CalendarSettingsPage';
*/
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Composant de chargement
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={{ marginTop: 10 }}>Chargement...</Text>
    </View>
  );
}

// Écran avec loader
function ScreenWithLoader({ component: Component, isLoading, ...props }) {
  if (isLoading) {
    return <LoadingScreen />;
  }
  return <Component {...props} />;
}

// Navigateur principal pour les écrans de calendrier
function CalendarTabNavigator({ sharedProps }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'CalendarList':
              iconName = 'calendar-today';
              break;
            case 'SharedCalendars':
              iconName = 'share';
              break;
            case 'Notifications':
              iconName = 'notifications';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'circle';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="CalendarList" 
        options={{ title: 'Calendriers' }}
      >
        {(props) => (
          <ScreenWithLoader
            component={CalendarList}
            isLoading={sharedProps.loadingStates.isInitialLoading}
            {...props}
            {...sharedProps}
          />
        )}
      </Tab.Screen>
      {/* <Tab.Screen 
        name="SharedCalendars" 
        options={{ title: 'Partagés' }}
      >
        {(props) => (
          <ScreenWithLoader
            component={SharedList}
            isLoading={sharedProps.loadingStates.isInitialLoading}
            {...props}
            {...sharedProps}
          />
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Notifications" 
        options={{ title: 'Notifications' }}
      >
        {(props) => (
          <ScreenWithLoader
            component={NotificationsPage}
            isLoading={sharedProps.loadingStates.isInitialLoading}
            {...props}
            {...sharedProps}
          />
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Settings" 
        options={{ title: 'Paramètres' }}
      >
        {(props) => (
          <ScreenWithLoader
            component={SettingsPage}
            isLoading={sharedProps.loadingStates.isInitialLoading}
            {...props}
            {...sharedProps}
          />
        )}
      </Tab.Screen> */}
    </Tab.Navigator>
  );
}

// Navigateur d'authentification
function AuthStackNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true 
      }}
    >
      <Stack.Screen name="Home" component={HomePage} />
      {/* <Stack.Screen name="Login" component={Auth} />
      <Stack.Screen name="Register" component={Auth} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
      <Stack.Screen name="ResetPasswordConfirm" component={ResetPasswordConfirm} />
      <Stack.Screen name="AuthCallback" component={AuthCallback} />
      <Stack.Screen name="Privacy" component={PrivacyPage} />
      <Stack.Screen name="Terms" component={TermsPage} /> */}
    </Stack.Navigator>
  );
}

// Navigateur principal de l'application
function MainStackNavigator({ sharedProps }) {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        gestureEnabled: true,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        options={{ headerShown: false }}
      >
        {(props) => <CalendarTabNavigator {...props} sharedProps={sharedProps} />}
      </Stack.Screen>
      
      {/* <Stack.Screen 
        name="VerifyEmail" 
        component={VerifyEmail}
        options={{ title: 'Vérifier Email' }}
      />
      
      <Stack.Screen 
        name="AddCalendar" 
        options={{ title: 'Ajouter Calendrier' }}
      >
        {(props) => <AddCalendarPage {...props} {...sharedProps} />}
      </Stack.Screen>
      
      <Stack.Screen 
        name="MedicineReview" 
        options={{ title: 'Révision Médicament' }}
      >
        {(props) => <MedicineReview {...props} {...sharedProps} />}
      </Stack.Screen>
      
      <Stack.Screen 
        name="AcceptInvite" 
        options={{ title: 'Accepter Invitation' }}
      >
        {(props) => <AcceptInvitePage {...props} {...sharedProps} />}
      </Stack.Screen>
      
      <Stack.Screen 
        name="CalendarView" 
        options={{ title: 'Calendrier' }}
      >
        {(props) => (
          <ScreenWithLoader
            component={CalendarView}
            isLoading={sharedProps.loadingStates.isInitialLoading}
            {...props}
            {...sharedProps}
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="BoxesView" 
        options={{ title: 'Boîtes' }}
      >
        {(props) => (
          <ScreenWithLoader
            component={BoxesView}
            isLoading={sharedProps.loadingStates.isInitialLoading}
            {...props}
            {...sharedProps}
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="PillboxPage" 
        options={{ title: 'Pilulier' }}
      >
        {(props) => (
          <ScreenWithLoader
            component={PillboxPage}
            isLoading={sharedProps.loadingStates.isInitialLoading}
            {...props}
            {...sharedProps}
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="CalendarSettings" 
        options={{ title: 'Paramètres Calendrier' }}
      >
        {(props) => (
          <ScreenWithLoader
            component={CalendarSettingsPage}
            isLoading={sharedProps.loadingStates.isInitialLoading}
            {...props}
            {...sharedProps}
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="StockAlerts" 
        options={{ title: 'Alertes Stock' }}
      >
        {(props) => (
          <ScreenWithLoader
            component={StockAlertsPage}
            isLoading={sharedProps.loadingStates.isInitialLoading}
            {...props}
            {...sharedProps}
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="MedicinesList" 
        options={{ title: 'Liste Médicaments' }}
      >
        {(props) => <MedicinesList {...props} {...sharedProps} />}
      </Stack.Screen>
      
      <Stack.Screen 
        name="Privacy" 
        component={PrivacyPage}
        options={{ title: 'Confidentialité' }}
      />
      
      <Stack.Screen 
        name="Terms" 
        component={TermsPage}
        options={{ title: 'Conditions' }}
      /> */}
    </Stack.Navigator>
  );
}

// Navigateur principal de l'application
export default function AppNavigator({ sharedProps }) {
  const { userInfo } = useContext(UserContext);

  if (!userInfo) {
    return <AuthStackNavigator />;
  }

  return <MainStackNavigator sharedProps={sharedProps} />;
}
