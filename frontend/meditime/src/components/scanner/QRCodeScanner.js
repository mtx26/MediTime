import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  SafeAreaView,
  Vibration 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function QRCodeScanner({
  onScanSuccess,
  onScanError,
  onClose,
  allowedFormats = ['qr'],
  style,
}) {
  const { t } = useTranslation();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    Vibration.vibrate(100); // Vibration courte pour confirmer le scan

    try {
      // Vérifier le format du code
      const isValidFormat = allowedFormats.some(format => {
        switch (format.toLowerCase()) {
          case 'qr':
            return type === BarCodeScanner.Constants.BarCodeType.qr;
          case 'ean13':
            return type === BarCodeScanner.Constants.BarCodeType.ean13;
          case 'ean8':
            return type === BarCodeScanner.Constants.BarCodeType.ean8;
          case 'code128':
            return type === BarCodeScanner.Constants.BarCodeType.code128;
          default:
            return false;
        }
      });

      if (!isValidFormat) {
        throw new Error(`Format de code non supporté: ${type}`);
      }

      // Parser les données selon le format
      let parsedData = data;
      if (allowedFormats.includes('qr')) {
        try {
          // Tenter de parser en JSON pour les QR codes
          parsedData = JSON.parse(data);
        } catch {
          // Si ce n'est pas du JSON, garder les données brutes
          parsedData = { raw: data };
        }
      }

      if (onScanSuccess) {
        onScanSuccess({
          type,
          data: parsedData,
          raw: data,
        });
      }

      // Feedback utilisateur
      Alert.alert(
        t('scanner.success_title'),
        t('scanner.success_message'),
        [
          { 
            text: t('scanner.scan_another'), 
            onPress: () => setScanned(false) 
          },
          { 
            text: t('common.close'), 
            onPress: onClose 
          }
        ]
      );

    } catch (error) {
      console.error('Erreur lors du scan:', error);
      
      Alert.alert(
        t('scanner.error_title'),
        error.message || t('scanner.error_message'),
        [
          { text: t('common.cancel'), onPress: onClose },
          { 
            text: t('scanner.try_again'), 
            onPress: () => setScanned(false) 
          }
        ]
      );

      if (onScanError) {
        onScanError(error);
      }
    }
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  const resetScanner = () => {
    setScanned(false);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.container, style]}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={64} color="#ccc" />
          <Text style={styles.messageText}>{t('scanner.requesting_permission')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, style]}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-off-outline" size={64} color="#dc3545" />
          <Text style={styles.messageText}>{t('scanner.no_permission')}</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
            <Text style={styles.permissionButtonText}>
              {t('scanner.request_permission')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{t('scanner.title')}</Text>
        
        <TouchableOpacity style={styles.headerButton} onPress={toggleFlash}>
          <Ionicons 
            name={flashOn ? "flash" : "flash-off"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      {/* Scanner */}
      <View style={styles.scannerWrapper}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.scanner}
          flashMode={flashOn ? 'torch' : 'off'}
          barCodeTypes={allowedFormats.map(format => {
            switch (format.toLowerCase()) {
              case 'qr':
                return BarCodeScanner.Constants.BarCodeType.qr;
              case 'ean13':
                return BarCodeScanner.Constants.BarCodeType.ean13;
              case 'ean8':
                return BarCodeScanner.Constants.BarCodeType.ean8;
              case 'code128':
                return BarCodeScanner.Constants.BarCodeType.code128;
              default:
                return BarCodeScanner.Constants.BarCodeType.qr;
            }
          })}
        />
        
        {/* Overlay avec cadre de scan */}
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            
            {/* Animation de scan */}
            {!scanned && (
              <View style={styles.scanLine} />
            )}
          </View>
        </View>

        {/* Indication de scan réussi */}
        {scanned && (
          <View style={styles.scannedOverlay}>
            <View style={styles.scannedIndicator}>
              <Ionicons name="checkmark-circle" size={64} color="#28a745" />
              <Text style={styles.scannedText}>{t('scanner.scanned')}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Footer avec instructions */}
      <View style={styles.footer}>
        <Text style={styles.instructionText}>
          {allowedFormats.includes('qr') 
            ? t('scanner.qr_instruction')
            : t('scanner.barcode_instruction')
          }
        </Text>
        
        {scanned && (
          <TouchableOpacity style={styles.resetButton} onPress={resetScanner}>
            <Ionicons name="refresh" size={20} color="#007AFF" />
            <Text style={styles.resetButtonText}>{t('scanner.scan_again')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  scannerWrapper: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  scanFrame: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#007AFF',
    borderWidth: 4,
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
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#007AFF',
    opacity: 0.8,
  },
  scannedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannedIndicator: {
    alignItems: 'center',
  },
  scannedText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginTop: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  resetButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
