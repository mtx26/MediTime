import * as WebBrowser from 'expo-web-browser';

export async function openPdfUrl(url: string) {
  await WebBrowser.openBrowserAsync(url, {
    createTask: false,
    dismissButtonStyle: 'close',
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    showTitle: true,
  });
}
