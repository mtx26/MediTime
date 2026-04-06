import type { ApiResult } from '../../../contracts';
export type {
  MedicineReviewConditionInput,
  MedicineReviewMedicineInput,
  MedicineReviewSuggestion,
} from '../../../models/medicine';
import type { MedicineReviewConditionInput, MedicineReviewMedicineInput } from '../../../models/medicine';

export interface ImageUploadImportState {
  hasFile: boolean;
  isProcessing: boolean;
}

export type AnalyzeImageResult = ApiResult & {
  medicines?: MedicineReviewMedicineInput[];
};

export interface ImageUploadImportPersonalCalendars {
  analyzeImage: (file: File) => Promise<AnalyzeImageResult>;
}

export interface ImageUploadImportProps {
  calendarName: string;
  personalCalendars: ImageUploadImportPersonalCalendars;
  onStateChange?: (state: ImageUploadImportState) => void;
}

export interface ImageUploadImportRef {
  handleImport: () => void;
}

export interface QRScannedMedicine {
  name: string;
  box_capacity: number;
  stock_alert_threshold: number;
  stock_quantity: number;
  dose: number | null;
  code_fmd?: string | null;
}

export type AddCalendarResult = ApiResult & {
  calendarId?: string;
};

export interface QRScanImportPersonalCalendars {
  addCalendar: (calendarName: string) => Promise<AddCalendarResult>;
  createPersonalBox: (
    calendarId: string,
    name: string,
    boxCapacity: number,
    stockAlertThreshold: number,
    stockQuantity: number,
    dose: number | null
  ) => Promise<ApiResult>;
}

export interface QRScanImportState {
  hasMedicine: boolean;
}

export interface QRScanImportResult {
  success: boolean;
  successCount?: number;
  errorCount?: number;
}

export interface QRScanImportProps {
  calendarName: string;
  personalCalendars: QRScanImportPersonalCalendars;
  onStateChange?: (state: QRScanImportState) => void;
}

export interface QRCodeScannerHandle {
  handleAddAll: () => Promise<void>;
}

export interface QRCodeScannerProps {
  modal?: boolean;
  singleScan?: boolean;
  show?: boolean;
  onAddAll?: ((medicines: QRScannedMedicine[]) => Promise<QRScanImportResult> | QRScanImportResult) | null;
  onStateChange?: ((state: QRScanImportState) => void) | null;
  onMedicineFound?: ((medicine: QRScannedMedicine) => void) | null;
  onClose?: (() => void) | null;
}

export interface AddCalendarPagePersonalCalendars
  extends ImageUploadImportPersonalCalendars,
    QRScanImportPersonalCalendars {}

export interface AddCalendarPageProps {
  personalCalendars: AddCalendarPagePersonalCalendars;
}

export interface MedicineReviewLocationState {
  importedMedicines?: MedicineReviewMedicineInput[];
  calendarName?: string;
}

export type SaveAnalysisResult = ApiResult & {
  calendar_id?: string;
};

export interface MedicineReviewPersonalCalendars {
  saveAnalysisResult: (
    calendarName: string,
    medicines: MedicineReviewMedicineInput[]
  ) => Promise<SaveAnalysisResult>;
}

export interface MedicineReviewProps {
  personalCalendars: MedicineReviewPersonalCalendars;
}
