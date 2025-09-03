import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const getWeekDates = (startDate) => {
  const dates = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay() + 1); // Commencer par lundi
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const getWeekRange = (dates) => {
  if (!dates || dates.length === 0) return '';
  
  const first = dates[0];
  const last = dates[6];
  
  const firstStr = first.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short' 
  });
  const lastStr = last.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short' 
  });
  
  return `${firstStr} - ${lastStr}`;
};

export default function WeekCalendarSelector({
  selectedDate,
  onDateSelect,
  onWeekChange,
  schedule = [],
  style,
}) {
  const { t } = useTranslation();
  const [currentWeekDates, setCurrentWeekDates] = useState([]);
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());

  useEffect(() => {
    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    setSelectedDateObj(baseDate);
    setCurrentWeekDates(getWeekDates(baseDate));
  }, [selectedDate]);

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedDateObj);
    newDate.setDate(newDate.getDate() + (direction * 7));
    
    setSelectedDateObj(newDate);
    const newWeekDates = getWeekDates(newDate);
    setCurrentWeekDates(newWeekDates);
    
    if (onWeekChange) {
      onWeekChange(formatDate(newDate));
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDateObj(date);
    if (onDateSelect) {
      onDateSelect(formatDate(date));
    }
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDateObj(today);
    setCurrentWeekDates(getWeekDates(today));
    
    if (onDateSelect) {
      onDateSelect(formatDate(today));
    }
    if (onWeekChange) {
      onWeekChange(formatDate(today));
    }
  };

  const getDayScheduleCount = (date) => {
    const dateStr = formatDate(date);
    return schedule.filter(item => 
      item.date && item.date.startsWith(dateStr)
    ).length;
  };

  const isToday = (date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const isSelected = (date) => {
    return formatDate(date) === formatDate(selectedDateObj);
  };

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <View style={[styles.container, style]}>
      {/* Header avec navigation */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateWeek(-1)}
        >
          <Ionicons name="chevron-back" size={20} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.weekRange} onPress={goToToday}>
          <Text style={styles.weekRangeText}>
            {getWeekRange(currentWeekDates)}
          </Text>
          <Text style={styles.todayText}>{t('calendar.today')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateWeek(1)}
        >
          <Ionicons name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Grille des jours */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysContainer}
      >
        {currentWeekDates.map((date, index) => {
          const scheduleCount = getDayScheduleCount(date);
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayContainer,
                isSelectedDate && styles.dayContainerSelected,
                isTodayDate && styles.dayContainerToday,
              ]}
              onPress={() => handleDateSelect(date)}
            >
              <Text style={[
                styles.dayName,
                isSelectedDate && styles.dayNameSelected,
                isTodayDate && styles.dayNameToday,
              ]}>
                {dayNames[index]}
              </Text>
              
              <Text style={[
                styles.dayNumber,
                isSelectedDate && styles.dayNumberSelected,
                isTodayDate && styles.dayNumberToday,
              ]}>
                {date.getDate()}
              </Text>
              
              {/* Indicateur de médicaments */}
              {scheduleCount > 0 && (
                <View style={[
                  styles.scheduleIndicator,
                  isSelectedDate && styles.scheduleIndicatorSelected,
                ]}>
                  <Text style={[
                    styles.scheduleCount,
                    isSelectedDate && styles.scheduleCountSelected,
                  ]}>
                    {scheduleCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  weekRange: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  weekRangeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  todayText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  daysContainer: {
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  dayContainer: {
    width: 50,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  dayContainerSelected: {
    backgroundColor: '#007AFF',
  },
  dayContainerToday: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dayName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  dayNameSelected: {
    color: '#fff',
  },
  dayNameToday: {
    color: '#007AFF',
    fontWeight: '600',
  },
  dayNumber: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  dayNumberSelected: {
    color: '#fff',
  },
  dayNumberToday: {
    color: '#007AFF',
  },
  scheduleIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#dc3545',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleIndicatorSelected: {
    backgroundColor: '#fff',
  },
  scheduleCount: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  scheduleCountSelected: {
    color: '#dc3545',
  },
});
