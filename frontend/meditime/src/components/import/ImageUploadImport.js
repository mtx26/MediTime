import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Image,
  ActivityIndicator 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function ImageUploadImport({
  onImageSelected,
  onUploadComplete,
  onError,
  style,
}) {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('permissions.camera_roll_title'),
        t('permissions.camera_roll_message'),
        [{ text: t('common.ok') }]
      );
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        
        if (onImageSelected) {
          onImageSelected(imageUri);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert(t('common.error'), t('image.selection_error'));
      if (onError) {
        onError(error);
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('permissions.camera_title'),
        t('permissions.camera_message'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        
        if (onImageSelected) {
          onImageSelected(imageUri);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert(t('common.error'), t('image.camera_error'));
      if (onError) {
        onError(error);
      }
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert(t('common.error'), t('image.no_image_selected'));
      return;
    }

    setUploading(true);

    try {
      // Convertir l'image en base64
      const base64 = await FileSystem.readAsStringAsync(selectedImage, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Simuler l'upload ou appeler votre API
      // Ici vous pouvez implémenter votre logique d'upload
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulation

      if (onUploadComplete) {
        onUploadComplete({
          uri: selectedImage,
          base64: base64,
        });
      }

      Alert.alert(t('common.success'), t('image.upload_success'));
      setSelectedImage(null);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      Alert.alert(t('common.error'), t('image.upload_error'));
      if (onError) {
        onError(error);
      }
    } finally {
      setUploading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      t('image.select_source'),
      t('image.select_source_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('image.take_photo'), onPress: takePhoto },
        { text: t('image.choose_from_gallery'), onPress: pickImageFromGallery },
      ]
    );
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (onImageSelected) {
      onImageSelected(null);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Zone de sélection d'image */}
      {!selectedImage ? (
        <TouchableOpacity style={styles.uploadArea} onPress={showImageOptions}>
          <Ionicons name="cloud-upload-outline" size={48} color="#007AFF" />
          <Text style={styles.uploadText}>{t('image.tap_to_upload')}</Text>
          <Text style={styles.uploadSubtext}>{t('image.upload_description')}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
              <Ionicons name="trash-outline" size={20} color="#dc3545" />
              <Text style={styles.removeButtonText}>{t('common.remove')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.changeButton} onPress={showImageOptions}>
              <Ionicons name="camera-outline" size={20} color="#007AFF" />
              <Text style={styles.changeButtonText}>{t('image.change')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bouton d'upload */}
      {selectedImage && (
        <TouchableOpacity 
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={uploadImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="cloud-upload" size={20} color="#fff" />
          )}
          <Text style={styles.uploadButtonText}>
            {uploading ? t('image.uploading') : t('image.upload')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>{t('image.instructions_title')}</Text>
        <Text style={styles.instructionsText}>
          • {t('image.instruction_1')}
        </Text>
        <Text style={styles.instructionsText}>
          • {t('image.instruction_2')}
        </Text>
        <Text style={styles.instructionsText}>
          • {t('image.instruction_3')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9ff',
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  imageActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc3545',
    backgroundColor: '#fff',
    gap: 6,
  },
  removeButtonText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '500',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
    gap: 6,
  },
  changeButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  uploadButtonText: {
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
});
