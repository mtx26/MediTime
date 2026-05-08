import { useState } from 'react';
import type { BoxesViewBoxItem, QRScannedMedicine } from '@meditime/types';
import type { CalendarSourceGroup } from '@meditime/utils';

interface UseBoxScannerParams {
  calendarSource: CalendarSourceGroup;
  calendarId: string | undefined;
  boxes: BoxesViewBoxItem[];
  createTemporaryBox: (data?: Partial<BoxesViewBoxItem>) => void;
}

export function useBoxScanner({ calendarSource, calendarId, boxes, createTemporaryBox }: UseBoxScannerParams) {
  const [showQRModal, setShowQRModal] = useState(false);
  const [singleScan, setSingleScan] = useState(false);
  const [currentEditingBoxId, setCurrentEditingBoxId] = useState<string | null>(null);

  const processMedicineCreation = async (med: QRScannedMedicine) => {
    const res = await calendarSource.createBox!(
      calendarId!,
      med.name,
      med.box_capacity,
      med.stock_alert_threshold,
      med.stock_quantity,
      med.dose,
      [],
      med.code_fmd
    );
    return res.success;
  };

  const addScannedMedicines = async (medicines: QRScannedMedicine[]) => {
    setShowQRModal(false);
    
    if (medicines.length === 1) {
      createTemporaryBox(medicines[0] as unknown as Partial<BoxesViewBoxItem>);
      return { success: true, successCount: 1, errorCount: 0 };
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const med of medicines) {
      if (await processMedicineCreation(med)) {
        successCount++;
      } else {
        errorCount++;
      }
    }
    return { success: errorCount === 0, successCount, errorCount };
  };

  const updateScannedMedicine = async (medicines: QRScannedMedicine[]) => {
    const med = medicines[0];
    const currentBox = boxes.find((b) => b.id === currentEditingBoxId);
    
    const res = await calendarSource.updateBox!(
      calendarId!,
      currentEditingBoxId!,
      {
        name: med.name,
        dose: med.dose,
        box_capacity: med.box_capacity,
        stock_alert_threshold: med.stock_alert_threshold,
        stock_quantity: med.stock_quantity,
        code_fmd: med.code_fmd,
        conditions: currentBox?.conditions || [],
      }
    );
    
    setShowQRModal(false);
    setCurrentEditingBoxId(null);
    setSingleScan(false);
    
    return {
      success: res.success,
      successCount: res.success ? 1 : 0,
      errorCount: res.success ? 0 : 1,
    };
  };

  const openAddScan = () => {
    setSingleScan(false);
    setCurrentEditingBoxId(null);
    setShowQRModal(true);
  };

  const openUpdateScan = (boxId: string) => {
    setSingleScan(true);
    setCurrentEditingBoxId(boxId);
    setShowQRModal(true);
  };

  const closeScanner = () => {
    setShowQRModal(false);
    setCurrentEditingBoxId(null);
    setSingleScan(false);
  };

  return {
    showQRModal,
    singleScan,
    addScannedMedicines,
    updateScannedMedicine,
    openAddScan,
    openUpdateScan,
    closeScanner,
  };
}
