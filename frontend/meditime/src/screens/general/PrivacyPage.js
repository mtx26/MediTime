import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function PrivacyPage() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Politique de confidentialité</Text>
        <Text style={styles.text}>
          Votre vie privée est importante pour nous. Cette politique de confidentialité 
          explique comment nous collectons, utilisons et protégeons vos informations.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#343a40',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#495057',
  },
});

export default PrivacyPage;
