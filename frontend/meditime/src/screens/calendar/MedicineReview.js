import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';

function MedicineReviewScreen({ navigation: navProp, sharedProps }) {
  const navigation = navProp || useNavigation();
  const route = useRoute();
  const { userInfo } = useContext(UserContext);
  
  // Données du médicament scannées (passées en paramètres)
  const { medicineData, calendarId } = route.params || {};
  
  const [medicine, setMedicine] = useState({
    name: medicineData?.name || '',
    dosage: medicineData?.dosage || '',
    frequency: medicineData?.frequency || 1,
    duration: medicineData?.duration || 7,
    instructions: medicineData?.instructions || '',
    withFood: medicineData?.withFood || false,
    reminderEnabled: true,
    stock: medicineData?.stock || 30,
    ...medicineData
  });
  
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!medicine.name.trim()) {
      Alert.alert('Erreur', 'Le nom du médicament est obligatoire');
      return;
    }

    setLoading(true);
    try {
      // Ici vous ajouterez la logique pour sauvegarder le médicament
      // await medicineService.addMedicine(calendarId, medicine);
      
      // Simulation pour l'instant
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Succès',
        'Médicament ajouté avec succès',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de l\'ajout du médicament:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le médicament');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Annuler',
      'Êtes-vous sûr de vouloir annuler ? Les modifications seront perdues.',
      [
        { text: 'Continuer l\'édition', style: 'cancel' },
        { text: 'Annuler', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color="#FF3B30" />
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Révision du médicament</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={loading}
        >
          <Text style={styles.saveText}>
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Informations principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du médicament</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom du médicament *</Text>
            <TextInput
              style={styles.input}
              value={medicine.name}
              onChangeText={(text) => setMedicine({...medicine, name: text})}
              placeholder="Ex: Doliprane 1000mg"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dosage</Text>
            <TextInput
              style={styles.input}
              value={medicine.dosage}
              onChangeText={(text) => setMedicine({...medicine, dosage: text})}
              placeholder="Ex: 1 comprimé"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={medicine.instructions}
              onChangeText={(text) => setMedicine({...medicine, instructions: text})}
              placeholder="Instructions particulières..."
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Fréquence et durée */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posologie</Text>
          
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Fréquence (par jour)</Text>
              <TextInput
                style={styles.input}
                value={medicine.frequency.toString()}
                onChangeText={(text) => setMedicine({...medicine, frequency: parseInt(text) || 1})}
                keyboardType="numeric"
                placeholder="1"
              />
            </View>
            
            <View style={styles.halfInput}>
              <Text style={styles.label}>Durée (jours)</Text>
              <TextInput
                style={styles.input}
                value={medicine.duration.toString()}
                onChangeText={(text) => setMedicine({...medicine, duration: parseInt(text) || 1})}
                keyboardType="numeric"
                placeholder="7"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Stock disponible</Text>
              <TextInput
                style={styles.input}
                value={medicine.stock.toString()}
                onChangeText={(text) => setMedicine({...medicine, stock: parseInt(text) || 0})}
                keyboardType="numeric"
                placeholder="30"
              />
            </View>
          </View>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Ionicons name="restaurant" size={20} color="#007AFF" />
              <Text style={styles.switchText}>Prendre avec de la nourriture</Text>
            </View>
            <Switch
              value={medicine.withFood}
              onValueChange={(value) => setMedicine({...medicine, withFood: value})}
              trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              thumbColor={medicine.withFood ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Ionicons name="notifications" size={20} color="#007AFF" />
              <Text style={styles.switchText}>Activer les rappels</Text>
            </View>
            <Switch
              value={medicine.reminderEnabled}
              onValueChange={(value) => setMedicine({...medicine, reminderEnabled: value})}
              trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              thumbColor={medicine.reminderEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Prévisualisation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prévisualisation</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Ionicons name="medical" size={24} color="#007AFF" />
              <Text style={styles.previewName}>{medicine.name || 'Nom du médicament'}</Text>
            </View>
            <Text style={styles.previewDosage}>{medicine.dosage || 'Dosage'}</Text>
            <Text style={styles.previewFrequency}>
              {medicine.frequency} fois par jour pendant {medicine.duration} jours
            </Text>
            {medicine.instructions && (
              <Text style={styles.previewInstructions}>{medicine.instructions}</Text>
            )}
            <View style={styles.previewTags}>
              {medicine.withFood && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Avec nourriture</Text>
                </View>
              )}
              {medicine.reminderEnabled && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Rappels activés</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelText: {
    color: '#FF3B30',
    marginLeft: 4,
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchText: {
    fontSize: 16,
    color: '#212529',
    marginLeft: 12,
  },
  previewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginLeft: 12,
  },
  previewDosage: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 4,
  },
  previewFrequency: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  previewInstructions: {
    fontSize: 14,
    color: '#495057',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  previewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default MedicineReviewScreen;
