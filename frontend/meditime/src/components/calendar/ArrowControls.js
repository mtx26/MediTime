import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ArrowControls({ onLeft, onRight, style }) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.arrowButton} 
        onPress={onLeft}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color="#007AFF" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.arrowButton} 
        onPress={onRight}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-forward" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  arrowButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
});
