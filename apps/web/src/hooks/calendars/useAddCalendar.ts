import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ADD_CALENDAR_IMPORT_TYPES,
  type AddCalendarImportType,
} from '@meditime/constants';
import type {
  AddCalendarPageProps,
  ImageUploadImportRef,
  ImageUploadImportState,
  QRCodeScannerHandle,
  QRScanImportState,
} from '@meditime/types';

export function useAddCalendar({ personalCalendars }: AddCalendarPageProps) {
  const navigate = useNavigate();
  const { lng } = useParams<{ lng: string }>();
  const locale = lng ?? 'en';

  const [newCalendarName, setNewCalendarName] = useState('');
  const [importType, setImportType] = useState<AddCalendarImportType>(
    ADD_CALENDAR_IMPORT_TYPES.MANUAL,
  );
  const [imageImportState, setImageImportState] = useState<ImageUploadImportState>({
    hasFile: false,
    isProcessing: false,
  });
  const [qrScanState, setQrScanState] = useState<QRScanImportState>({ hasMedicine: false });

  const imageImportRef = useRef<ImageUploadImportRef | null>(null);
  const qrScanRef = useRef<QRCodeScannerHandle | null>(null);

  const handleSubmit = async () => {
    if (importType === ADD_CALENDAR_IMPORT_TYPES.MANUAL) {
      const rep = await personalCalendars.addCalendar(newCalendarName);
      if (rep.success && rep.calendarId) {
        navigate(`/${locale}/calendar/${rep.calendarId}/boxes`);
      }
    } else if (importType === ADD_CALENDAR_IMPORT_TYPES.QR && qrScanRef.current) {
      qrScanRef.current.handleAddAll();
    } else if (importType === ADD_CALENDAR_IMPORT_TYPES.FILE && imageImportRef.current) {
      imageImportRef.current.handleImport();
    }
  };

  return {
    personalCalendars,
    newCalendarName,
    setNewCalendarName,
    importType,
    setImportType,
    imageImportState,
    setImageImportState,
    qrScanState,
    setQrScanState,
    imageImportRef,
    qrScanRef,
    handleSubmit,
  };
}
