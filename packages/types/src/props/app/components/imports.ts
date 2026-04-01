import type { ApiResult } from '../../../contracts';

export interface ImageUploadImportState {
  hasFile: boolean;
  isProcessing: boolean;
}

export type AnalyzeImageResult = ApiResult & {
  medicines?: unknown[];
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
  dose: number | string | null;
}

export type AddCalendarResult = ApiResult & {
  calendarId?: string | number;
};

export interface QRScanImportPersonalCalendars {
  addCalendar: (calendarName: string) => Promise<AddCalendarResult>;
  createPersonalBox: (
    calendarId: string | number,
    name: string,
    boxCapacity: number,
    stockAlertThreshold: number,
    stockQuantity: number,
    dose: number | string | null
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
  onAddAll?: (medicines: QRScannedMedicine[]) => Promise<QRScanImportResult> | QRScanImportResult;
  onStateChange?: (state: QRScanImportState) => void;
}

export interface AddCalendarPagePersonalCalendars
  extends ImageUploadImportPersonalCalendars,
    QRScanImportPersonalCalendars {}

export interface AddCalendarPageProps {
  personalCalendars: AddCalendarPagePersonalCalendars | Record<string, unknown>;
}

export interface MedicineReviewConditionInput {
  time_of_day?: string;
  interval_days?: number | string;
  start_date?: string | null;
  tablet_count?: number | string;
  max_date_mode?: string;
  max_date?: string | null;
  max_date_days?: number | string | null;
  [key: string]: unknown;
}

export interface MedicineReviewMedicineInput {
  name: string;
  dose: number | string | null;
  stock_quantity?: number | string;
  stock_max?: number | string;
  stock_alert_threshold?: number | string;
  conditions: MedicineReviewConditionInput[];
  [key: string]: unknown;
}

export interface MedicineReviewLocationState {
  importedMedicines?: MedicineReviewMedicineInput[];
  calendarName?: string;
}

export interface MedicineReviewSuggestion {
  name: string;
  dose: string;
  conditionnement: number | string;
  forme_pharmaceutique?: string;
}

export type SaveAnalysisResult = ApiResult & {
  calendar_id?: string | number;
};

export interface MedicineReviewPersonalCalendars {
  saveAnalysisResult: (
    calendarName: string,
    medicines: MedicineReviewMedicineInput[]
  ) => Promise<SaveAnalysisResult>;
}

export interface MedicineReviewProps {
  personalCalendars: MedicineReviewPersonalCalendars | Record<string, unknown>;
}
