import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const IOSListItem = ({ 
  title, 
  subtitle,
  leftIcon,
  rightIcon = 'chevron-forward',
  showArrow = true,
  onPress,
  style,
  children,
  ...props 
}) => {
  const content = (
    <View style={[styles.container, style]} {...props}>
      <View style={styles.leftSection}>
        {leftIcon && (
          <View style={styles.iconContainer}>
            <Ionicons name={leftIcon} size={24} color="#007AFF" />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {children}
        </View>
      </View>
      
      {showArrow && (
        <View style={styles.rightSection}>
          <Ionicons name={rightIcon} size={20} color="#C7C7CC" />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const IOSList = ({ children, style, ...props }) => {
  return (
    <View style={[styles.list, style]} {...props}>
      {React.Children.map(children, (child, index) => (
        <View key={index}>
          {child}
          {index < React.Children.count(children) - 1 && (
            <View style={styles.separator} />
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
    width: 29,
    height: 29,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    color: '#000',
    fontWeight: '400',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
    }),
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 2,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
    }),
  },
  rightSection: {
    marginLeft: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 57, // Align with text content
  },
});

export { IOSListItem };
export default IOSList;
