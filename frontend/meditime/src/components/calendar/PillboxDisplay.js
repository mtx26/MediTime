import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function PillboxDisplay({
  type,
  monday,
  calendarId,
  schedule = [],
  onUseMedicines,
}) {
  const { t } = useTranslation();
  const [selectedMedIndex, setSelectedMedIndex] = useState(0);
  const [orderedMeds, setOrderedMeds] = useState([]);
  const [calendarTable, setCalendarTable] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (schedule && schedule.length > 0) {
      // Organiser les médicaments par ordre alphabétique
      const meds = [...new Set(schedule.map(item => item.medicine_name))].sort();
      setOrderedMeds(meds);
      
      // Créer le tableau du pillulier
      const table = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayData = [];
        meds.forEach(medName => {
          const medSchedule = schedule.filter(item => 
            item.medicine_name === medName && 
            new Date(item.date).getDay() === (dayIndex + 1) % 7
          );
          dayData.push({
            medicine_name: medName,
            total_dose: medSchedule.reduce((sum, item) => sum + (item.dose || 0), 0),
            schedule: medSchedule,
          });
        });
        table.push(dayData);
      }
      setCalendarTable(table);
    }
  }, [schedule]);

  const handleNextMed = () => {
    setSelectedMedIndex((prev) => 
      prev + 1 < orderedMeds.length ? prev + 1 : prev
    );
  };

  const handlePrevMed = () => {
    setSelectedMedIndex((prev) => prev > 0 ? prev - 1 : prev);
  };

  const handleUseMedicines = async () => {
    if (!onUseMedicines) return;
    
    Alert.alert(
      t('pillbox.confirm_use_title'),
      t('pillbox.confirm_use_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.confirm'), 
          onPress: async () => {
            setLoading(true);
            try {
              await onUseMedicines();
              Alert.alert(t('common.success'), t('pillbox.medicines_used_success'));
            } catch (error) {
              Alert.alert(t('common.error'), error.message);
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  const formatDose = (dose) => {
    if (dose === 0.25) return '0.25';
    if (dose === 0.5) return '0.50';
    if (dose === 0.75) return '0.75';
    return dose.toFixed(2);
  };

  const currentMed = orderedMeds[selectedMedIndex];

  return (
    <View style={styles.container}>
      {/* Header avec navigation des médicaments */}
      {orderedMeds.length > 1 && (
        <View style={styles.medSelector}>
          <TouchableOpacity 
            style={[styles.navButton, selectedMedIndex === 0 && styles.navButtonDisabled]}
            onPress={handlePrevMed}
            disabled={selectedMedIndex === 0}
          >
            <Ionicons 
              name="chevron-back" 
              size={20} 
              color={selectedMedIndex === 0 ? '#ccc' : '#007AFF'} 
            />
          </TouchableOpacity>
          
          <View style={styles.medInfo}>
            <Text style={styles.medName}>{currentMed}</Text>
            <Text style={styles.medCounter}>
              {selectedMedIndex + 1} / {orderedMeds.length}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.navButton, selectedMedIndex === orderedMeds.length - 1 && styles.navButtonDisabled]}
            onPress={handleNextMed}
            disabled={selectedMedIndex === orderedMeds.length - 1}
          >
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={selectedMedIndex === orderedMeds.length - 1 ? '#ccc' : '#007AFF'} 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Tableau du pillulier */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableContainer}>
        <View>
          {/* En-tête des jours */}
          <View style={styles.headerRow}>
            <View style={styles.medNameCell}>
              <Text style={styles.headerText}>{t('pillbox.medicine')}</Text>
            </View>
            {days.map((day, index) => (
              <View key={index} style={styles.dayCell}>
                <Text style={styles.headerText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Données du pillulier */}
          {currentMed && (
            <View style={styles.dataRow}>
              <View style={styles.medNameCell}>
                <Text style={styles.medNameText} numberOfLines={2}>
                  {currentMed}
                </Text>
              </View>
              {calendarTable.map((dayData, dayIndex) => {
                const medData = dayData.find(item => item.medicine_name === currentMed);
                const dose = medData?.total_dose || 0;
                return (
                  <View key={dayIndex} style={styles.dayCell}>
                    <Text style={styles.doseText}>
                      {dose > 0 ? formatDose(dose) : '-'}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bouton d'action */}
      {type === 'personal' && (
        <TouchableOpacity 
          style={[styles.actionButton, loading && styles.actionButtonDisabled]}
          onPress={handleUseMedicines}
          disabled={loading}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>
            {loading ? t('common.loading') : t('pillbox.use_medicines')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  medSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  navButtonDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  medInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  medName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  medCounter: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tableContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderBottomWidth: 1,
    borderBottomColor: '#0056b3',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  medNameCell: {
    width: 120,
    padding: 12,
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRightWidth: 1,
    borderRightColor: '#dee2e6',
  },
  dayCell: {
    width: 60,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#dee2e6',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  medNameText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  doseText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
