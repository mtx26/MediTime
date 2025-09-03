import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MedicinesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Médicaments</Text>
      <Text style={styles.subtitle}>Gestion de vos médicaments</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007AFF',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});
