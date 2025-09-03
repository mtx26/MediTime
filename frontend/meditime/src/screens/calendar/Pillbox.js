import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { UserContext } from '../../contexts/UserContext';
import { PillboxDisplay, WeekDayCircles } from '../../components/calendar';

function PillboxScreen({ navigation: navProp, sharedProps }) {
  const navigation = navProp || useNavigation();
  const route = useRoute();
  const { userInfo } = useContext(UserContext);
  
  const { calendarId } = route.params || {};
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarData, setCalendarData] = useState(null);
  const [pillboxData, setPillboxData] = useState({});
  const [weekData, setWeekData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('day'); // 'day' ou 'week'

  useEffect(() => {
    loadPillboxData();
  }, [calendarId, selectedDate]);

  const loadPillboxData = async () => {
    try {
      // Ici vous chargerez les données du pilulier depuis l'API
      // const data = await pillboxService.getPillboxData(calendarId, selectedDate);
      
      // Données simulées pour l'instant
      const mockData = {
        [selectedDate]: {
          morning: [
            {
              id: '1',
              name: 'Doliprane 1000mg',
              dosage: '1 comprimé',
              time: '08:00',
              taken: false,
              color: '#007AFF'
            },
            {
              id: '2',
              name: 'Vitamine D',
              dosage: '1 goutte',
              time: '08:00',
              taken: true,
              color: '#34C759'
            }
          ],
          noon: [
            {
              id: '3',
              name: 'Antalgique',
              dosage: '1 comprimé',
              time: '12:00',
              taken: false,
              color: '#FF9500'
            }
          ],
          evening: [
            {
              id: '4',
              name: 'Doliprane 1000mg',
              dosage: '1 comprimé',
              time: '20:00',
              taken: false,
              color: '#007AFF'
            }
          ],
          night: []
        }
      };

      setPillboxData(mockData);

      // Charger les données de la semaine si en mode semaine
      if (viewMode === 'week') {
        const weekStart = getWeekStart(selectedDate);
        const weekMockData = {};
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          weekMockData[dateStr] = mockData[selectedDate] || { morning: [], noon: [], evening: [], night: [] };
        }
        setWeekData(weekMockData);
      }

      // Charger les infos du calendrier
      if (calendarId && sharedProps?.personalCalendars?.calendarsData) {
        const calendar = sharedProps.personalCalendars.calendarsData.find(c => c.id === calendarId);
        setCalendarData(calendar);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du pilulier:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPillboxData();
    setRefreshing(false);
  };

  const getWeekStart = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Premier jour de la semaine (lundi)
    return new Date(date.setDate(diff));
  };

  const handleMedicineTaken = async (medicineId, period) => {
    try {
      // await pillboxService.markMedicineAsTaken(medicineId);
      
      // Mise à jour locale
      const updatedPillboxData = { ...pillboxData };
      if (updatedPillboxData[selectedDate] && updatedPillboxData[selectedDate][period]) {
        updatedPillboxData[selectedDate][period] = updatedPillboxData[selectedDate][period].map(med =>
          med.id === medicineId ? { ...med, taken: !med.taken } : med
        );
        setPillboxData(updatedPillboxData);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer le médicament comme pris');
    }
  };

  const handleDatePress = (day) => {
    setSelectedDate(day.dateString);
  };

  const getPeriodIcon = (period) => {
    switch (period) {
      case 'morning': return 'sunny';
      case 'noon': return 'sunny-outline';
      case 'evening': return 'moon';
      case 'night': return 'moon-outline';
      default: return 'time';
    }
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'morning': return 'Matin';
      case 'noon': return 'Midi';
      case 'evening': return 'Soir';
      case 'night': return 'Nuit';
      default: return period;
    }
  };

  const getPeriodTime = (period) => {
    switch (period) {
      case 'morning': return '6h - 12h';
      case 'noon': return '12h - 14h';
      case 'evening': return '18h - 22h';
      case 'night': return '22h - 6h';
      default: return '';
    }
  };

  const renderPeriodMedicines = (period, medicines) => {
    if (!medicines || medicines.length === 0) {
      return (
        <View style={styles.emptyPeriod}>
          <Text style={styles.emptyText}>Aucun médicament</Text>
        </View>
      );
    }

    return (
      <View style={styles.medicinesGrid}>
        {medicines.map((medicine) => (
          <TouchableOpacity
            key={medicine.id}
            style={[
              styles.medicineCard,
              medicine.taken && styles.medicineCardTaken
            ]}
            onPress={() => handleMedicineTaken(medicine.id, period)}
          >
            <View style={[styles.medicineIndicator, { backgroundColor: medicine.color }]} />
            <View style={styles.medicineInfo}>
              <Text style={[styles.medicineName, medicine.taken && styles.medicineNameTaken]}>
                {medicine.name}
              </Text>
              <Text style={[styles.medicineDosage, medicine.taken && styles.medicineDosageTaken]}>
                {medicine.dosage}
              </Text>
              <Text style={[styles.medicineTime, medicine.taken && styles.medicineTimeTaken]}>
                {medicine.time}
              </Text>
            </View>
            <View style={styles.medicineStatus}>
              {medicine.taken ? (
                <Ionicons name="checkmark-circle" size={24} color="#34C759" />
              ) : (
                <Ionicons name="radio-button-off" size={24} color="#6c757d" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const dayPillboxData = pillboxData[selectedDate] || { morning: [], noon: [], evening: [], night: [] };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Pilulier</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'day' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('day')}
          >
            <Text style={[styles.viewModeText, viewMode === 'day' && styles.viewModeTextActive]}>
              Jour
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'week' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('week')}
          >
            <Text style={[styles.viewModeText, viewMode === 'week' && styles.viewModeTextActive]}>
              Semaine
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Calendrier */}
        <View style={styles.calendarContainer}>
          {viewMode === 'day' ? (
            <Calendar
              current={selectedDate}
              onDayPress={handleDatePress}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: '#007AFF',
                },
              }}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: '#007AFF',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#007AFF',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#34C759',
                selectedDotColor: '#ffffff',
                arrowColor: '#007AFF',
                disabledArrowColor: '#d9e1e8',
                monthTextColor: '#2d4150',
                indicatorColor: '#007AFF',
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13
              }}
            />
          ) : (
            <WeekDayCircles
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          )}
        </View>

        {/* Informations du calendrier */}
        {calendarData && (
          <View style={styles.calendarInfo}>
            <Text style={styles.calendarName}>{calendarData.name}</Text>
            <Text style={styles.selectedDateText}>
              Pilulier du {new Date(selectedDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        )}

        {/* Pilulier par période */}
        <View style={styles.pillboxContainer}>
          {['morning', 'noon', 'evening', 'night'].map((period) => (
            <View key={period} style={styles.periodSection}>
              <View style={styles.periodHeader}>
                <View style={styles.periodTitleContainer}>
                  <Ionicons 
                    name={getPeriodIcon(period)} 
                    size={24} 
                    color="#007AFF" 
                  />
                  <Text style={styles.periodTitle}>{getPeriodLabel(period)}</Text>
                  <Text style={styles.periodTime}>{getPeriodTime(period)}</Text>
                </View>
                <View style={styles.periodStats}>
                  <Text style={styles.periodCount}>
                    {dayPillboxData[period]?.filter(m => m.taken).length || 0}/
                    {dayPillboxData[period]?.length || 0}
                  </Text>
                </View>
              </View>
              
              {renderPeriodMedicines(period, dayPillboxData[period])}
            </View>
          ))}
        </View>

        {/* Résumé de la journée */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Résumé de la journée</Text>
          <PillboxDisplay 
            pillboxData={dayPillboxData}
            onMedicinePress={(medicine, period) => handleMedicineTaken(medicine.id, period)}
          />
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  headerActions: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewModeButtonActive: {
    backgroundColor: '#007AFF',
  },
  viewModeText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  viewModeTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
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
  calendarInfo: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
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
  calendarName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  selectedDateText: {
    fontSize: 14,
    color: '#6c757d',
  },
  pillboxContainer: {
    marginHorizontal: 16,
  },
  periodSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginLeft: 8,
  },
  periodTime: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8,
  },
  periodStats: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  periodCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  medicinesGrid: {
    gap: 8,
  },
  medicineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  medicineCardTaken: {
    backgroundColor: '#e8f5e8',
    borderColor: '#c3e6c3',
  },
  medicineIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  medicineNameTaken: {
    textDecorationLine: 'line-through',
    color: '#6c757d',
  },
  medicineDosage: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  medicineDosageTaken: {
    textDecorationLine: 'line-through',
  },
  medicineTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  medicineTimeTaken: {
    textDecorationLine: 'line-through',
  },
  medicineStatus: {
    marginLeft: 8,
  },
  emptyPeriod: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  summaryContainer: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
});

export default PillboxScreen;
