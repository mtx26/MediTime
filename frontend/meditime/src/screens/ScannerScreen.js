import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { QRCodeScanner } from '../components/scanner';
import { ImageUploadImport, QRScanImport } from '../components/import';

export default function ScannerScreen({ navigation }) {
  const { t } = useTranslation();
  const [activeMode, setActiveMode] = useState(null); // 'qr', 'image', 'camera'

  const handleQRScanSuccess = (result) => {
    console.log('QR Code scanné:', result);
    
    try {
      // Traiter les données du QR code
      if (result.data && typeof result.data === 'object') {
        // Données structurées (JSON)
        Alert.alert(
          t('scanner.success_title'),
          `Données importées: ${JSON.stringify(result.data, null, 2)}`,
          [{ text: t('common.ok') }]
        );
      } else {
        // Données brutes
        Alert.alert(
          t('scanner.success_title'),
          `Code scanné: ${result.raw}`,
          [{ text: t('common.ok') }]
        );
      }
      
      // Retourner au mode sélection
      setActiveMode(null);
      
    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleQRScanError = (error) => {
    console.error('Erreur de scan:', error);
    Alert.alert(
      t('scanner.error_title'),
      error.message || t('scanner.error_message'),
      [{ text: t('common.ok') }]
    );
  };

  const handleImageSelected = (imageUri) => {
    console.log('Image sélectionnée:', imageUri);
    // Ici vous pourriez traiter l'image avec OCR
  };

  const handleImageUploadComplete = (result) => {
    console.log('Upload terminé:', result);
    Alert.alert(
      t('common.success'),
      t('image.upload_success'),
      [{ text: t('common.ok') }]
    );
    setActiveMode(null);
  };

  const handleQRImportSuccess = (data) => {
    console.log('QR Import réussi:', data);
    Alert.alert(
      t('common.success'),
      'Données importées avec succès',
      [{ text: t('common.ok') }]
    );
    setActiveMode(null);
  };

  const handleBack = () => {
    if (activeMode) {
      setActiveMode(null);
    } else {
      navigation.goBack();
    }
  };

  // Modes d'affichage
  if (activeMode === 'camera') {
    return (
      <QRCodeScanner
        onScanSuccess={handleQRScanSuccess}
        onScanError={handleQRScanError}
        onClose={handleBack}
        allowedFormats={['qr', 'ean13', 'code128']}
        style={styles.fullScreen}
      />
    );
  }

  if (activeMode === 'qr') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('qr.scan_title')}</Text>
          <View style={styles.placeholder} />
        </View>

        <QRScanImport
          onQRCodeScanned={handleQRImportSuccess}
          onError={handleQRScanError}
          style={styles.content}
        />
      </SafeAreaView>
    );
  }

  if (activeMode === 'image') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('image.tap_to_upload')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ImageUploadImport
          onImageSelected={handleImageSelected}
          onUploadComplete={handleImageUploadComplete}
          onError={(error) => {
            console.error('Erreur image:', error);
            Alert.alert(t('common.error'), error.message);
          }}
          style={styles.content}
        />
      </SafeAreaView>
    );
  }

  // Mode de sélection principal
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('navigation.scanner')}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Choisissez comment importer vos médicaments
        </Text>

        <View style={styles.optionsContainer}>
          {/* Scanner QR/Code-barres */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setActiveMode('camera')}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="qr-code" size={48} color="#007AFF" />
            </View>
            <Text style={styles.optionTitle}>Scanner un code</Text>
            <Text style={styles.optionDescription}>
              QR code ou code-barres de médicament
            </Text>
          </TouchableOpacity>

          {/* Import QR Code */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setActiveMode('qr')}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="download" size={48} color="#28a745" />
            </View>
            <Text style={styles.optionTitle}>Importer QR Code</Text>
            <Text style={styles.optionDescription}>
              Importer des données via QR code
            </Text>
          </TouchableOpacity>

          {/* Upload d'image */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setActiveMode('image')}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="camera" size={48} color="#17a2b8" />
            </View>
            <Text style={styles.optionTitle}>Photo d'ordonnance</Text>
            <Text style={styles.optionDescription}>
              Prendre ou sélectionner une photo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  fullScreen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
