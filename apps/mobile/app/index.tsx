import { Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../src/hooks/useAuth';

export default function Index() {
  const { userInfo, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!userInfo) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
