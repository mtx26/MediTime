import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Modal,
  SafeAreaView 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function QRScanImport({
  onQRCodeScanned,
  onError,
  style,
}) {
  const { t } = useTranslation();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setShowScanner(false);

    try {
      // Vérifier si c'est un QR code valide
      if (type === BarCodeScanner.Constants.BarCodeType.qr) {
        // Tenter de parser le JSON
        const parsedData = JSON.parse(data);
        
        if (onQRCodeScanned) {
          onQRCodeScanned(parsedData);
        }
        
        Alert.alert(
          t('qr.scan_success_title'),
          t('qr.scan_success_message'),
          [{ text: t('common.ok') }]
        );
      } else {
        throw new Error('Invalid QR code format');
      }
    } catch (error) {
      console.error('Erreur lors du scan QR:', error);
      Alert.alert(
        t('qr.scan_error_title'),
        t('qr.scan_error_message'),
        [
          { text: t('common.cancel') },
          { text: t('qr.try_again'), onPress: () => setScanned(false) }
        ]
      );
      
      if (onError) {
        onError(error);
      }
    }
  };

  const startScanning = () => {
    if (hasPermission === null) {
      requestCameraPermission();
      return;
    }
    
    if (hasPermission === false) {
      Alert.alert(
        t('permissions.camera_title'),
        t('permissions.camera_message'),
        [
          { text: t('common.cancel') },
          { text: t('permissions.go_to_settings'), onPress: () => {
            // Ouvrir les paramètres de l'app
            // Linking.openSettings();
          }}
        ]
      );
      return;
    }

    setScanned(false);
    setShowScanner(true);
  };

  const closeScanner = () => {
    setShowScanner(false);
    setScanned(false);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Zone principale */}
      <View style={styles.scanArea}>
        <Ionicons name="qr-code-outline" size={64} color="#007AFF" />
        <Text style={styles.title}>{t('qr.scan_title')}</Text>
        <Text style={styles.subtitle}>{t('qr.scan_subtitle')}</Text>
        
        <TouchableOpacity style={styles.scanButton} onPress={startScanning}>
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.scanButtonText}>{t('qr.start_scan')}</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>{t('qr.instructions_title')}</Text>
        <Text style={styles.instructionsText}>
          • {t('qr.instruction_1')}
        </Text>
        <Text style={styles.instructionsText}>
          • {t('qr.instruction_2')}
        </Text>
        <Text style={styles.instructionsText}>
          • {t('qr.instruction_3')}
        </Text>
      </View>

      {/* Modal du scanner */}
      <Modal
        visible={showScanner}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.scannerContainer}>
          {/* Header du scanner */}
          <View style={styles.scannerHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={closeScanner}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>{t('qr.scanner_title')}</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Scanner */}
          <View style={styles.scannerWrapper}>
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={styles.scanner}
              barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
            />
            
            {/* Overlay avec cadre de scan */}
            <View style={styles.scannerOverlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>
          </View>

          {/* Instructions du scanner */}
          <View style={styles.scannerInstructions}>
            <Text style={styles.scannerInstructionsText}>
              {t('qr.scanner_instruction')}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  scanArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#f8f9ff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scannerWrapper: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scannerInstructions: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  scannerInstructionsText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
