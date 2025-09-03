import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function DailyMedicinesView({ date, medicines, onMedicineTaken, onMedicineDetails }) {
  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMedicinesByTime = () => {
    if (!medicines || medicines.length === 0) return {};
    
    return medicines.reduce((groups, medicine) => {
      const time = medicine.time || '08:00';
      if (!groups[time]) groups[time] = [];
      groups[time].push(medicine);
      return groups;
    }, {});
  };

  const medicinesByTime = getMedicinesByTime();
  const timeSlots = Object.keys(medicinesByTime).sort();

  if (timeSlots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="medical-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>Aucun médicament prévu pour cette date</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateTitle}>
          {new Date(date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      {timeSlots.map((time) => (
        <View key={time} style={styles.timeSlot}>
          <View style={styles.timeHeader}>
            <Ionicons name="time-outline" size={20} color="#007AFF" />
            <Text style={styles.timeText}>{formatTime(time)}</Text>
          </View>

          <View style={styles.medicinesContainer}>
            {medicinesByTime[time].map((medicine, index) => (
              <TouchableOpacity
                key={`${medicine.id}-${index}`}
                style={[
                  styles.medicineCard,
                  medicine.taken && styles.medicineCardTaken
                ]}
                onPress={() => onMedicineDetails?.(medicine)}
              >
                <View style={styles.medicineInfo}>
                  <Text style={[
                    styles.medicineName,
                    medicine.taken && styles.medicineNameTaken
                  ]}>
                    {medicine.name}
                  </Text>
                  
                  <Text style={styles.medicineDose}>
                    {medicine.dose} - {medicine.dosage_form}
                  </Text>
                  
                  {medicine.instructions && (
                    <Text style={styles.medicineInstructions}>
                      {medicine.instructions}
                    </Text>
                  )}
                  
                  {medicine.stock_quantity !== undefined && (
                    <Text style={[
                      styles.stockInfo,
                      medicine.stock_quantity <= medicine.stock_alert_threshold && styles.lowStock
                    ]}>
                      Stock: {medicine.stock_quantity}
                      {medicine.stock_quantity <= medicine.stock_alert_threshold && ' (Faible)'}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    medicine.taken ? styles.undoButton : styles.takeButton
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    onMedicineTaken?.(medicine, !medicine.taken);
                  }}
                >
                  <Ionicons
                    name={medicine.taken ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={medicine.taken ? "#4CAF50" : "#007AFF"}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  timeSlot: {
    marginBottom: 20,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  medicinesContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  medicineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medicineCardTaken: {
    backgroundColor: '#f8f9fa',
    borderLeftColor: '#4CAF50',
    opacity: 0.8,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  medicineNameTaken: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  medicineDose: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  medicineInstructions: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  stockInfo: {
    fontSize: 12,
    color: '#666',
  },
  lowStock: {
    color: '#FF9500',
    fontWeight: '600',
  },
  actionButton: {
    padding: 8,
  },
  takeButton: {
    // styles pour le bouton "prendre"
  },
  undoButton: {
    // styles pour le bouton "annuler"
  },
});

export default DailyMedicinesView;
