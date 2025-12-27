import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRealtimeTokenMedicines } from '../../hooks/realtime/useRealtimeMedicines';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useLoading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Pill, AlertCircle } from 'lucide-react';

function MedicinesList() {
  // 📍 Paramètres d’URL et navigation
  const { sharedToken } = useParams(); // Récupération du token de partage depuis l'URL
  const { t, i18n } = useTranslation();

  // ✅ État de récupération des médicaments partagés
  const [loadingMedicines, setLoadingMedicines] = useState(undefined);
  const [medicinesData, setMedicinesData] = useState([]); // Liste des médicaments du calendrier partagé

  useRealtimeTokenMedicines(sharedToken, setMedicinesData, setLoadingMedicines);

  const groupMedicinesByName = (medicines) => {
    return medicines.reduce((acc, med) => {
      acc[med.name] = acc[med.name] || [];
      acc[med.name].push(med);
      return acc;
    }, {});
  };

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(loadingMedicines === undefined && sharedToken, t('loading_medicines'));
  }, [loadingMedicines, sharedToken, showLoading, t]);

  if (loadingMedicines === undefined && sharedToken) {
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

  const groupedMedicines = medicinesData
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
          {Object.keys(groupedMedicines).map((key, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <strong className="block mb-2">
                  {key}{' '}
                  {groupedMedicines[key][0].dose != null
                    ? `${groupedMedicines[key][0].dose} ${t('mg')}`
                    : ''}
                </strong>
                {groupedMedicines[key].map((med, index) => (
                  <div key={index} className="text-muted-foreground text-sm">
                    {med.time_of_day[0] === 'morning' ? t('morning') : t('evening')} -{' '}
                    {med.tablet_count}{' '}
                    {med.tablet_count > 1 ? t('boxes.tablets') : t('boxes.tablet')} -{' '}
                    {t('boxes.every')} {med.interval_days}{' '}
                    {med.interval_days > 1 ? t('boxes.days') : t('boxes.day')}
                    {med.start_date && (
                      <>
                        {' '}
                        {t('boxes.from')} {' '}
                        {new Date(med.start_date).toLocaleDateString(i18n.language, {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default MedicinesList;
