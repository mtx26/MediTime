import React, { useContext, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { UserProvider, UserContext } from './src/contexts/UserContext';
import AppNavigator from './src/navigation/AppNavigator';
import { View, Text, StyleSheet } from 'react-native';

function AppContent() {
  const { userInfo } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simule un chargement initial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <>
      <AppNavigator isAuthenticated={!!userInfo} />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#007AFF',
  },
});
