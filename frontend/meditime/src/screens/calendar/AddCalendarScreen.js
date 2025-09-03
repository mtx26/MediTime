import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

function AddCalendarScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  
  const [newCalendarName, setNewCalendarName] = useState('');
  const [importType, setImportType] = useState('manual');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newCalendarName.trim()) {
      Alert.alert(
        t('common.error'),
        t('calendar.name_required')
      );
      return;
    }

    setIsLoading(true);
    
    try {
      if (importType === 'manual') {
        // Ici vous pourrez ajouter la logique pour créer un calendrier
        // const rep = await personalCalendars.addCalendar(newCalendarName);
        
        // Simulation pour l'instant
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        Alert.alert(
          t('common.success'),
          t('calendar.calendar_created'),
          [
            {
              text: t('common.confirm'),
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else if (importType === 'qr') {
        // Naviguer vers l'écran de scan QR
        navigation.navigate('QRScanner', {
          calendarName: newCalendarName,
          mode: 'create_calendar'
        });
      } else if (importType === 'file') {
        // Naviguer vers l'écran d'import de fichier
        navigation.navigate('FileImport', {
          calendarName: newCalendarName
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création du calendrier:', error);
      Alert.alert(
        t('common.error'),
        t('calendar.creation_error')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getImportTypeDescription = () => {
    switch (importType) {
      case 'manual':
        return t('calendar.import_type_manual_description');
      case 'qr':
        return t('calendar.import_type_qr_description');
      case 'file':
        return t('calendar.import_type_file_description');
      default:
        return '';
    }
  };

  const getImportTypeIcon = () => {
    switch (importType) {
      case 'manual':
        return 'edit';
      case 'qr':
        return 'qr-code-scanner';
      case 'file':
        return 'upload-file';
      default:
        return 'edit';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Icon name="event" size={24} color="#28a745" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>{t('calendar.add_calendar')}</Text>
        </View>

        <View style={styles.cardBody}>
          {/* Nom du calendrier */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('calendar.name')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('calendar.name')}
              value={newCalendarName}
              onChangeText={setNewCalendarName}
              editable={!isLoading}
            />
          </View>

          {/* Type d'import */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('calendar.import_type')} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={importType}
                onValueChange={setImportType}
                style={styles.picker}
                enabled={!isLoading}
              >
                <Picker.Item 
                  label={t('calendar.import_type_manual')} 
                  value="manual" 
                />
                <Picker.Item 
                  label={t('calendar.scan_qr_option')} 
                  value="qr" 
                />
                <Picker.Item 
                  label={t('calendar.import_type_file')} 
                  value="file" 
                />
              </Picker>
            </View>
          </View>

          {/* Description du type d'import */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon 
                name={getImportTypeIcon()} 
                size={20} 
                color="#17a2b8" 
                style={styles.infoIcon} 
              />
              <Text style={styles.infoTitle}>
                {importType === 'manual' && t('calendar.import_type_manual')}
                {importType === 'qr' && t('calendar.scan_qr_option')}
                {importType === 'file' && t('calendar.import_type_file')}
              </Text>
            </View>
            <Text style={styles.infoDescription}>
              {getImportTypeDescription()}
            </Text>
          </View>

          {/* Bouton de soumission */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!newCalendarName.trim() || isLoading) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!newCalendarName.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Icon 
                  name={importType === 'manual' ? 'add' : importType === 'qr' ? 'qr-code-scanner' : 'upload'} 
                  size={20} 
                  color="#ffffff" 
                  style={styles.buttonIcon} 
                />
                <Text style={styles.submitButtonText}>
                  {importType === 'manual' ? t('add') : 
                   importType === 'qr' ? t('calendar.scan_qr') :
                   t('calendar.import_file')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Instructions spécifiques selon le type */}
          {importType === 'qr' && (
            <View style={styles.additionalInfo}>
              <Text style={styles.additionalInfoText}>
                {t('calendar.qr_scan_instruction')}
              </Text>
            </View>
          )}

          {importType === 'file' && (
            <View style={styles.additionalInfo}>
              <Text style={styles.additionalInfoText}>
                {t('calendar.file_import_instruction')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
  },
  cardBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 8,
  },
  required: {
    color: '#dc3545',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  picker: {
    height: 50,
  },
  infoCard: {
    backgroundColor: '#d1ecf1',
    borderWidth: 1,
    borderColor: '#bee5eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c5460',
  },
  infoDescription: {
    fontSize: 14,
    color: '#0c5460',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#28a745',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  additionalInfo: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    borderRadius: 8,
    padding: 12,
  },
  additionalInfoText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
});

export default AddCalendarScreen;
