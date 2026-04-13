import type { ApiResult } from '../api';
import type { MedicineReviewConditionInput, MedicineReviewMedicineInput } from '../models/medicine';
import type { RefObject } from 'react';

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

// ─── Scanner Sub-Components ──────────────────────────────────────────────────

export interface ScannerControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isFrontCamera: boolean;
  onToggleFrontCamera: () => void;
  availableCameras: MediaDeviceInfo[];
  selectedCamera: MediaDeviceInfo | null;
  onCameraChange: (camera: MediaDeviceInfo) => void;
  showControls: boolean;
  onAutoHideControls: () => void;
  hideControlsTimeoutRef: RefObject<ReturnType<typeof setTimeout> | null>;
}

export interface ScannerResultsListProps {
  gtins: string[];
  medicines: Record<string, QRScannedMedicine | null>;
  loadingGtin: string | null;
  onRemoveMedicine: (gtin: string) => void;
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

export interface MedicineReviewConditionProps {
  condition: MedicineReviewConditionInput;
  conditionIndex: number;
  onChange: (index: number, field: string, value: string | number | null) => void;
  onDelete: (index: number) => void;
}

