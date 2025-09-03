import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const IOSButton = ({ 
  title, 
  onPress, 
  style = 'default', // 'default', 'destructive', 'cancel'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  children,
  ...props 
}) => {
  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    if (size === 'small') baseStyle.push(styles.buttonSmall);
    if (size === 'large') baseStyle.push(styles.buttonLarge);
    
    if (style === 'destructive') baseStyle.push(styles.buttonDestructive);
    if (style === 'cancel') baseStyle.push(styles.buttonCancel);
    
    if (disabled) baseStyle.push(styles.buttonDisabled);
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];
    
    if (size === 'small') baseStyle.push(styles.buttonTextSmall);
    if (size === 'large') baseStyle.push(styles.buttonTextLarge);
    
    if (style === 'destructive') baseStyle.push(styles.buttonTextDestructive);
    if (style === 'cancel') baseStyle.push(styles.buttonTextCancel);
    
    if (disabled) baseStyle.push(styles.buttonTextDisabled);
    
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.6}
      {...props}
    >
      {children || <Text style={getTextStyle()}>{title}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44, // iOS minimum touch target
    minHeight: 44,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonSmall: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 32,
  },
  buttonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 50,
  },
  buttonDestructive: {
    backgroundColor: '#FF3B30',
  },
  buttonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
    }),
  },
  buttonTextSmall: {
    fontSize: 15,
  },
  buttonTextLarge: {
    fontSize: 19,
  },
  buttonTextDestructive: {
    color: '#FFFFFF',
  },
  buttonTextCancel: {
    color: '#007AFF',
  },
  buttonTextDisabled: {
    color: '#FFFFFF',
  },
});

export default IOSButton;
