import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function DateModal({
  visible,
  onClose,
  onDateSelect,
  selectedDate,
  minDate,
  maxDate,
  title = 'Sélectionner une date',
}) {
  const { t } = useTranslation();
  const [tempSelectedDate, setTempSelectedDate] = useState(selectedDate);

  const handleDateSelect = (day) => {
    setTempSelectedDate(day.dateString);
  };

  const handleConfirm = () => {
    if (tempSelectedDate && onDateSelect) {
      onDateSelect(tempSelectedDate);
    }
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>{title}</Text>
          
          <TouchableOpacity 
            onPress={handleConfirm} 
            style={[styles.confirmButton, !tempSelectedDate && styles.confirmButtonDisabled]}
            disabled={!tempSelectedDate}
          >
            <Text style={[styles.confirmText, !tempSelectedDate && styles.confirmTextDisabled]}>
              {t('common.confirm')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected date display */}
        {tempSelectedDate && (
          <View style={styles.selectedDateContainer}>
            <Ionicons name="calendar" size={20} color="#007AFF" />
            <Text style={styles.selectedDateText}>
              {formatDate(tempSelectedDate)}
            </Text>
          </View>
        )}

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={tempSelectedDate ? {
              [tempSelectedDate]: {
                selected: true,
                selectedColor: '#007AFF',
              }
            } : {}}
            minDate={minDate}
            maxDate={maxDate}
            enableSwipeMonths={true}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#b6c1cd',
              selectedDayBackgroundColor: '#007AFF',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#007AFF',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              dotColor: '#00adf5',
              selectedDotColor: '#ffffff',
              arrowColor: '#007AFF',
              disabledArrowColor: '#d9e1e8',
              monthTextColor: '#2d4150',
              indicatorColor: '#007AFF',
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            firstDay={1} // Commencer par lundi
            showWeekNumbers={false}
          />
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setTempSelectedDate(new Date().toISOString().split('T')[0])}
          >
            <Text style={styles.quickActionText}>{t('calendar.today')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              setTempSelectedDate(tomorrow.toISOString().split('T')[0]);
            }}
          >
            <Text style={styles.quickActionText}>{t('calendar.tomorrow')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.3,
  },
  confirmText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  confirmTextDisabled: {
    color: '#ccc',
  },
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
  },
  selectedDateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  calendarContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickActionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});
