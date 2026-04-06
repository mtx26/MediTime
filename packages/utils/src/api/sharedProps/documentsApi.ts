import type { ApiFactoryOptions, MedicineReviewMedicineInput } from '@meditime/types';

interface DocumentsApiFactoryOptions extends ApiFactoryOptions {
  fileToBase64: (file: File) => Promise<string>;
}

export function createDocumentsApi({ apiUrl, uid, showAlert, performApiCall, fileToBase64 }: DocumentsApiFactoryOptions) {
  return {
    analyzeImage: async (file: File) => {
      const base64 = await fileToBase64(file);

      return performApiCall({
        url: `${apiUrl}/api/documents/analyze`,
        method: 'POST',
        body: { image: base64 },
        origin: 'DOCUMENT_ANALYZE',
        uid,
        analyticsEvent: 'DOCUMENT_ANALYZE',
        analyticsData: { uid },
        showAlert,
      });
    },

    saveAnalysisResult: async (calendarName: string, boxes: MedicineReviewMedicineInput[]) => {
      return performApiCall({
        url: `${apiUrl}/api/documents/analyze/save`,
        method: 'POST',
        body: { calendarName, boxes },
        origin: 'DOCUMENT_ANALYZE_SAVE',
        uid,
        analyticsEvent: 'DOCUMENT_ANALYZE_SAVE',
        analyticsData: { uid },
        showAlert,
      });
    },
  };
}
