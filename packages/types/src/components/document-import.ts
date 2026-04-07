import type { ApiResult } from '../api';
import type { MedicineReviewMedicineInput } from '../models/medicine';

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

// ─── QR Code Scanner ─────────────────────────────────────────────────────────

export interface QRCodeScannerState {
  hasMedicine: boolean;
}

export interface QRCodeScannerProps {
  onMedicineFound?: ((medicine: QRScannedMedicine) => void) | null;
  singleScan?: boolean;
  onClose?: (() => void) | null;
  onAddAll?: ((medicines: QRScannedMedicine[]) => Promise<{ success: boolean }>) | null;
  show?: boolean;
  modal?: boolean;
  onStateChange?: ((state: QRCodeScannerState) => void) | null;
}

export interface QRCodeScannerHandle {
  handleAddAll: () => Promise<void>;
}

// ─── Medicine Review ─────────────────────────────────────────────────────────

export type SaveAnalysisResultResult = ApiResult & {
  calendar_id?: string;
};

export interface MedicineReviewPersonalCalendars {
  saveAnalysisResult: (calendarName: string, boxes: MedicineReviewMedicineInput[]) => Promise<SaveAnalysisResultResult>;
}

export interface MedicineReviewProps {
  personalCalendars: MedicineReviewPersonalCalendars;
}

export interface MedicineReviewLocationState {
  importedMedicines?: MedicineReviewMedicineInput[];
  calendarName?: string;
}

