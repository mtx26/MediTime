import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    const newAlert = { id, message, type, duration };
    
    setAlerts(prev => [...prev, newAlert]);

    // Auto remove alert after duration
    setTimeout(() => {
      removeAlert(id);
    }, duration);

    return id;
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const showSuccess = useCallback((message, duration) => {
    return showAlert(message, 'success', duration);
  }, [showAlert]);

  const showError = useCallback((message, duration) => {
    return showAlert(message, 'error', duration);
  }, [showAlert]);

  const showWarning = useCallback((message, duration) => {
    return showAlert(message, 'warning', duration);
  }, [showAlert]);

  const showInfo = useCallback((message, duration) => {
    return showAlert(message, 'info', duration);
  }, [showAlert]);

  return (
    <AlertContext.Provider value={{
      showAlert,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      removeAlert,
    }}>
      {children}
      <AlertContainer alerts={alerts} onRemove={removeAlert} />
    </AlertContext.Provider>
  );
};

const AlertContainer = ({ alerts, onRemove }) => {
  return (
    <View style={styles.container}>
      {alerts.map((alert) => (
        <AlertItem
          key={alert.id}
          alert={alert}
          onRemove={() => onRemove(alert.id)}
        />
      ))}
    </View>
  );
};

const AlertItem = ({ alert, onRemove }) => {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(-100);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRemove = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onRemove();
    });
  };

  const getAlertStyle = () => {
    switch (alert.type) {
      case 'success':
        return { backgroundColor: '#4CAF50', iconName: 'checkmark-circle' };
      case 'error':
        return { backgroundColor: '#F44336', iconName: 'close-circle' };
      case 'warning':
        return { backgroundColor: '#FF9800', iconName: 'warning' };
      default:
        return { backgroundColor: '#2196F3', iconName: 'information-circle' };
    }
  };

  const alertStyle = getAlertStyle();

  return (
    <Animated.View
      style={[
        styles.alertItem,
        { backgroundColor: alertStyle.backgroundColor },
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Ionicons name={alertStyle.iconName} size={20} color="#fff" />
      <Text style={styles.alertText}>{alert.message}</Text>
      <TouchableOpacity onPress={handleRemove} style={styles.closeButton}>
        <Ionicons name="close" size={16} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar and potential header
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  alertText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
});

export default AlertProvider;
