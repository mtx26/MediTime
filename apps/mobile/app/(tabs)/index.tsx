import { ScrollView, View } from 'react-native';
import { List, Divider, ActivityIndicator, FAB, Text, Card, Button, Banner } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useCalendars } from '../../src/hooks/realtime/useCalendars';
import type { CalendarItem } from '@meditime/types';

function CalendarRow({ cal }: { cal: CalendarItem }) {
  const { t } = useTranslation();
  return (
    <>
      <List.Item
        title={cal.name}
        titleStyle={{ fontWeight: 'bold' }}
        description={`${t('medicines.label')}: ${cal.boxes_count ?? '...'}`}
        left={(props) => (
          <List.Icon {...props} icon="calendar-month" />
        )}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
      />
      {cal.ifLowStock && (
        <Banner
          visible
          icon="alert-circle-outline"
          style={{ paddingVertical: 0 }}
        >
          {t('stock_alert')}
        </Banner>
      )}
    </>
  );
}

function SharedCalendarRow({ cal }: { cal: CalendarItem }) {
  const { t } = useTranslation();
  return (
    <>
      <List.Item
        title={cal.name}
        titleStyle={{ fontWeight: 'bold' }}
        description={() => (
          <View>
            <Text variant="bodySmall">{t('medicines.label')}: {cal.boxes_count ?? '...'}</Text>
            {cal.owner_name ? <Text variant="bodySmall">{cal.owner_name}</Text> : null}
          </View>
        )}
        left={(props) => (
          <List.Icon {...props} icon="calendar-month" />
        )}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
      />
      {cal.ifLowStock && (
        <Banner
          visible
          icon="alert-circle-outline"
          style={{ paddingVertical: 0 }}
        >
          {t('stock_alert')}
        </Banner>
      )}
    </>
  );
}

export default function CalendarsScreen() {
  const { t } = useTranslation();
  const { calendars, sharedCalendars, loading } = useCalendars();

  if (loading) {
    return <ActivityIndicator style={{ flex: 1, marginTop: 40 }} />;
  }

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 80 }}>
        {/* ── Mes calendriers ── */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <List.Icon icon="calendar" />
            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>{t('my_calendars')}</Text>
          </View>

          <Card>
            <Card.Content style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
              {calendars.length > 0 ? (
                calendars.map((cal, index) => (
                  <View key={cal.id}>
                    <CalendarRow cal={cal} />
                    {index < calendars.length - 1 && <Divider />}
                  </View>
                ))
              ) : null}
              <Divider />
              <Button
                icon="plus"
                mode="text"
                style={{ marginVertical: 4 }}
              >
                {t('calendar.add_calendar')}
              </Button>
            </Card.Content>
          </Card>
        </View>

        {/* ── Calendriers partagés ── */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <List.Icon icon="account-group" />
            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>{t('shared_calendars')}</Text>
          </View>

          {sharedCalendars.length > 0 ? (
            <Card>
              <Card.Content style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
                {sharedCalendars.map((cal, index) => (
                  <View key={cal.id}>
                    <SharedCalendarRow cal={cal} />
                    {index < sharedCalendars.length - 1 && <Divider />}
                  </View>
                ))}
              </Card.Content>
            </Card>
          ) : (
            <Card>
              <Card.Content style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <List.Icon icon="information-outline" />
                <Text variant="bodyMedium" style={{ fontWeight: '600', flex: 1 }}>{t('no_shared_calendars')}</Text>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>
    </>
  );
}
