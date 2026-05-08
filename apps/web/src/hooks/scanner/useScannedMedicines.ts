import { useState, useEffect, useCallback } from 'react';
import { fetchMedicaments } from '@/utils/api/scanner';
import type { QRScannedMedicine, ToastType } from '@meditime/types';
import type { TFunction } from 'i18next';

interface UseScannedMedicinesParams {
  onMedicineFound: ((medicine: QRScannedMedicine) => void) | null;
  onAddAll: ((medicines: QRScannedMedicine[]) => Promise<{ success: boolean }>) | null;
  singleScan: boolean;
  showAlert: (type: ToastType, message: string) => void;
  t: TFunction;
  onStateChange?: ((state: { hasMedicine: boolean }) => void) | null;
}

export function useScannedMedicines({
  onMedicineFound,
  onAddAll,
  singleScan,
  showAlert,
  t,
  onStateChange,
}: UseScannedMedicinesParams) {
  const [gtins, setGtins] = useState<string[]>([]);
  const [medicines, setMedicines] = useState<Record<string, QRScannedMedicine | null>>(() => Object.create(null));
  const [loadingGtin, setLoadingGtin] = useState<string | null>(null);

  useEffect(() => {
    if (onStateChange) {
      const medicineBoxes = Object.values(medicines).filter(med => med !== null);
      onStateChange({ hasMedicine: medicineBoxes.length > 0 });
    }
  }, [medicines, onStateChange]);

  const setMedicineEntry = (key: string, value: unknown) => {
    setMedicines(prev => {
      const updated = Object.assign(Object.create(null), prev);
      Object.defineProperty(updated, key, { value, enumerable: true, configurable: true, writable: true });
      return updated;
    });
  };

  const resetScannedMedicines = useCallback(() => {
    setGtins([]);
    setMedicines(Object.create(null));
    setLoadingGtin(null);
  }, []);

  const searchMedicine = async (gtin: string) => {
    if (loadingGtin === gtin || (Object.prototype.hasOwnProperty.call(medicines, gtin) && gtins.includes(gtin))) return;
    setLoadingGtin(gtin);
    try {
      const results = await fetchMedicaments(gtin);
      if (results && results.length > 0) {
        const medicineData = results[0] as Record<string, string | undefined>;
        const dose = parseInt(medicineData.dose?.replace(/\D/g, '') || '0');
        const conditionnement = parseInt(medicineData.conditionnement?.replace(/\D/g, '') || '0');
        
        const medicineBox = {
          gtin,
          name: medicineData.name || 'Unknown',
          dose,
          box_capacity: conditionnement,
          stock_quantity: conditionnement,
          stock_alert_threshold: 10,
          conditions: [],
          original_data: medicineData,
        };

        setMedicineEntry(gtin, medicineBox);
        if (onMedicineFound) onMedicineFound(medicineBox);
      } else {
        setMedicineEntry(gtin, null);
      }
    } catch (error) {
      console.error("Erreur lors de la recherche du médicament:", error);
      setMedicineEntry(gtin, null);
    } finally {
      setLoadingGtin(null);
    }
  };

  const addGtin = useCallback((gtin: string) => {
    setGtins(prev => {
      if (prev.includes(gtin)) return prev;
      searchMedicine(gtin);
      return singleScan ? [gtin] : [...prev, gtin];
    });
  }, [singleScan]);

  const removeMedicine = (gtinToRemove: string) => {
    setGtins(prev => prev.filter(gtin => gtin !== gtinToRemove));
    setMedicines(prev => {
      if (!Object.prototype.hasOwnProperty.call(prev, gtinToRemove)) return prev;
      const rest = Object.entries(prev).reduce((acc, [k, v]) => {
        if (k !== gtinToRemove) {
          Object.defineProperty(acc, k, { value: v, enumerable: true, configurable: true, writable: true });
        }
        return acc;
      }, Object.create(null));
      return rest;
    });
    if (loadingGtin === gtinToRemove) setLoadingGtin(null);
  };

  const handleAddAll = async () => {
    if (!onAddAll) return;
    const medicineBoxes = Object.values(medicines).filter(med => med !== null);
    if (medicineBoxes.length === 0) {
      showAlert('warning', t('boxes.no_medicines_selected'));
      return;
    }
    const rep = await onAddAll(medicineBoxes);
    if (rep.success) resetScannedMedicines();
  };

  return {
    gtins,
    medicines,
    loadingGtin,
    addGtin,
    removeMedicine,
    resetScannedMedicines,
    handleAddAll,
  };
}
