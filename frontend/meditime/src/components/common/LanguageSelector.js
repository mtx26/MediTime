import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

function LanguageSelector() {
  const { i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(null);

  useEffect(() => {
    const lang = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];
    setCurrentLanguage(lang);
  }, [i18n.language]);

  const onSelectLanguage = (language) => {
    i18n.changeLanguage(language.code);
    setCurrentLanguage(language);
    setModalVisible(false);
  };

  const renderLanguageItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        item.code === currentLanguage?.code && styles.selectedLanguageItem
      ]}
      onPress={() => onSelectLanguage(item)}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <Text style={[
        styles.languageName,
        item.code === currentLanguage?.code && styles.selectedLanguageName
      ]}>
        {item.name}
      </Text>
      {item.code === currentLanguage?.code && (
        <Ionicons name="checkmark" size={20} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  if (!currentLanguage) return null;

  return (
    <View>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.currentFlag}>{currentLanguage.flag}</Text>
        <Text style={styles.currentLanguage}>{currentLanguage.code.toUpperCase()}</Text>
        <Ionicons name="chevron-down" size={16} color="#666" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir une langue</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={renderLanguageItem}
              style={styles.languageList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  currentFlag: {
    fontSize: 16,
    marginRight: 6,
  },
  currentLanguage: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    padding: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  selectedLanguageItem: {
    backgroundColor: '#e3f2fd',
  },
  flag: {
    fontSize: 20,
    marginRight: 12,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectedLanguageName: {
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default LanguageSelector;
