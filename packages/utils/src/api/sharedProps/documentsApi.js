export function createDocumentsApi({ apiUrl, uid, showAlert, performApiCall, fileToBase64 }) {
  return {
    analyzeImage: async (file) => {
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

    saveAnalysisResult: async (calendarName, boxes) => {
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
