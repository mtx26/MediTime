import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getMondayDate } from '../../utils/calendar/dateUtils';

export default function WeekDayCircles({ selectedDate, onSelectDate, monday: mondayProp }) {
  const { i18n } = useTranslation();
  
  // Normalise les dates à minuit pour comparaisons simples
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const mondayDate = mondayProp instanceof Date ? mondayProp : getMondayDate(selectedDate);
  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D']; // Français court

  return (
    <View style={styles.container}>
      {weekDates.map((day, index) => {
        const isSelected = day.getTime() === selectedDate.getTime();
        const isToday = day.getTime() === today.getTime();

        const getButtonStyle = () => {
          if (isToday) return [styles.dayButton, styles.todayButton];
          if (isSelected) return [styles.dayButton, styles.selectedButton];
          return [styles.dayButton, styles.defaultButton];
        };

        const getTextStyle = () => {
          if (isToday) return [styles.dayText, styles.todayText];
          if (isSelected) return [styles.dayText, styles.selectedText];
          return [styles.dayText, styles.defaultText];
        };

        return (
          <TouchableOpacity
            key={index}
            style={getButtonStyle()}
            onPress={() => onSelectDate(day)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dayName, getTextStyle()]}>
              {dayNames[index]}
            </Text>
            <Text style={[styles.dayNumber, getTextStyle()]}>
              {day.getDate()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  dayButton: {
    flex: 1,
    maxWidth: 48,
    height: 60,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  defaultButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  selectedButton: {
    backgroundColor: '#007AFF',
  },
  todayButton: {
    backgroundColor: '#28a745',
    shadowOpacity: 0.3,
    elevation: 4,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  dayText: {
    // Base text style
  },
  defaultText: {
    color: '#333',
  },
  selectedText: {
    color: '#fff',
  },
  todayText: {
    color: '#fff',
  },
});
