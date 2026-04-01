import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { useParams } from 'react-router-dom';
import { useRealtimeTokenMedicines } from '@/hooks/realtime/useRealtimeMedicines';
import { useTranslation } from 'react-i18next';
import { useLoading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Pill, AlertCircle } from 'lucide-react';
import type { MedicineItem } from '@meditime/types';

type GroupedMedicines = Record<string, MedicineItem[]>;

interface MedicineDisplayItem extends MedicineItem {
  dose?: number | string | null;
  time_of_day?: string[];
  tablet_count?: number;
  interval_days?: number;
  start_date?: string;
}

function MedicinesList() {
  // 📍 Paramètres d’URL et navigation
  const { sharedToken } = useParams<{ sharedToken?: string }>(); // Récupération du token de partage depuis l'URL
  const { t, i18n } = useTranslation();

  // ✅ État de récupération des médicaments partagés
  const [loadingMedicines, setLoadingMedicines] = useState<boolean>(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [medicinesData, setMedicinesData] = useState<MedicineItem[]>([]); // Liste des médicaments du calendrier partagé

  const setLoadingFromHook: Dispatch<SetStateAction<boolean>> = (value) => {
    setHasLoaded(true);
    setLoadingMedicines((prev) => (typeof value === 'function' ? value(prev) : value));
  };

  useRealtimeTokenMedicines(sharedToken ?? null, setMedicinesData, setLoadingFromHook);

  const groupMedicinesByName = (medicines: MedicineItem[]): GroupedMedicines => {
    return medicines.reduce((acc, med) => {
      acc[med.name] = acc[med.name] || [];
      acc[med.name].push(med);
      return acc;
    }, {} as GroupedMedicines);
  };

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(Boolean(!hasLoaded && sharedToken), t('loading_medicines'));
  }, [hasLoaded, sharedToken, showLoading, t]);

  if (!hasLoaded && sharedToken) {
    return null;
  }

  if (loadingMedicines === false && sharedToken) {
    return (
      <Alert variant="destructive" className="text-center mt-8 max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t('invalid_or_expired_link')}</AlertDescription>
      </Alert>
    );
  }

  const groupedMedicines: GroupedMedicines = medicinesData
    ? groupMedicinesByName(medicinesData)
    : {};

  return (
    <div className="container mx-auto mt-4 px-4">
      <h4 className="text-xl font-bold flex items-center gap-2 mb-4">
        <Pill className="h-5 w-5" />
        <span>{t('medicines.list_title')}</span>
      </h4>

      {Object.keys(groupedMedicines).length === 0 ? (
        <div className="text-center mt-8 text-muted-foreground">
          {t('medicines.list_empty')}
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {Object.keys(groupedMedicines).map((key) => (
            <Card key={key}>
              <CardContent className="p-4">
                <strong className="block mb-2">
                  {key}{' '}
                  {groupedMedicines[key][0].dose != null
                    ? `${groupedMedicines[key][0].dose} ${t('mg')}`
                    : ''}
                </strong>
                {groupedMedicines[key].map((med, index) => {
                  const displayMed = med as MedicineDisplayItem;
                  const timeOfDayLabel = displayMed.time_of_day?.[0] === 'morning' ? t('morning') : t('evening');
                  return (
                  <div key={`${key}-${index}`} className="text-muted-foreground text-sm">
                    {timeOfDayLabel} -{' '}
                    {displayMed.tablet_count ?? 0}{' '}
                    {(displayMed.tablet_count ?? 0) > 1 ? t('boxes.tablets') : t('boxes.tablet')} -{' '}
                    {t('boxes.every')} {displayMed.interval_days ?? 1}{' '}
                    {(displayMed.interval_days ?? 1) > 1 ? t('boxes.days') : t('boxes.day')}
                    {displayMed.start_date && (
                      <>
                        {' '}
                        {t('boxes.from')} {' '}
                        {new Date(displayMed.start_date).toLocaleDateString(i18n.language, {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </>
                    )}
                  </div>
                );})}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default MedicinesList;
