import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  Animated, 
  PanResponder 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

function ActionSheet({ actions, buttonSize = 'default', minimal = false }) {
  const [show, setShow] = useState(false);
  const { t } = useTranslation();
  const slideAnim = new Animated.Value(0);

  const showActionSheet = () => {
    setShow(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const hideActionSheet = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      setShow(false);
    });
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 0 && gestureState.vy > 0;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        const progress = Math.max(0, 1 - gestureState.dy / 200);
        slideAnim.setValue(progress);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100 || gestureState.vy > 0.5) {
        hideActionSheet();
      } else {
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const handleActionPress = (action) => {
    hideActionSheet();
    if (action.onPress) {
      setTimeout(() => action.onPress(), 150);
    }
  };

  const getButtonStyle = () => {
    if (minimal) {
      return styles.minimalButton;
    }
    return [
      styles.button,
      buttonSize === 'sm' ? styles.smallButton : styles.defaultButton
    ];
  };

  const getIconName = () => {
    return minimal ? 'ellipsis-horizontal' : 'chevron-down';
  };

  return (
    <>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={showActionSheet}
      >
        {!minimal && <Text style={styles.buttonText}>{t('common.actions')}</Text>}
        <Ionicons 
          name={getIconName()} 
          size={minimal ? 20 : 16} 
          color={minimal ? '#666' : '#333'} 
        />
      </TouchableOpacity>

      <Modal
        visible={show}
        transparent={true}
        animationType="none"
        onRequestClose={hideActionSheet}
      >
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={hideActionSheet}
          />
          
          <Animated.View
            style={[
              styles.actionSheet,
              {
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                }],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.handle} />
            
            <View style={styles.actionList}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionItem,
                    action.destructive && styles.destructiveAction,
                    index === actions.length - 1 && styles.lastAction
                  ]}
                  onPress={() => handleActionPress(action)}
                >
                  {action.icon && (
                    <Ionicons 
                      name={action.icon} 
                      size={20} 
                      color={action.destructive ? '#ff3b30' : '#007AFF'} 
                      style={styles.actionIcon}
                    />
                  )}
                  <Text style={[
                    styles.actionText,
                    action.destructive && styles.destructiveText
                  ]}>
                    {t(action.label)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={hideActionSheet}
            >
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  defaultButton: {
    paddingVertical: 8,
  },
  smallButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  minimalButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  buttonText: {
    marginRight: 6,
    fontSize: 14,
    color: '#333',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  actionSheet: {
    backgroundColor: '#f2f2f7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area bottom
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#c7c7cc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  actionList: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#c7c7cc',
  },
  lastAction: {
    borderBottomWidth: 0,
  },
  destructiveAction: {
    // Style spécial pour les actions destructives
  },
  actionIcon: {
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#007AFF',
  },
  destructiveText: {
    color: '#ff3b30',
  },
  cancelButton: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default ActionSheet;
