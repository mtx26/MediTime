import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Platform,
} from 'react-native';

const IOSSwitch = ({ 
  label, 
  value, 
  onValueChange, 
  disabled = false,
  style,
  ...props 
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: '#767577',
          true: '#34C759',
        }}
        thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  label: {
    fontSize: 17,
    color: '#000',
    flex: 1,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
    }),
  },
  labelDisabled: {
    color: '#8E8E93',
  },
});

export default IOSSwitch;
