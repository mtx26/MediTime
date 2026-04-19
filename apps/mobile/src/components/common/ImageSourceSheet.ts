import { ActionSheetIOS, Alert, Platform } from 'react-native';

type ImageSourceSheetOptions = {
  cancelLabel: string;
  cameraLabel: string;
  fileLabel: string;
  libraryLabel: string;
  title: string;
  onCamera: () => void;
  onFile: () => void;
  onLibrary: () => void;
};

export function openImageSourceSheet({
  cancelLabel,
  cameraLabel,
  fileLabel,
  libraryLabel,
  title,
  onCamera,
  onFile,
  onLibrary,
}: ImageSourceSheetOptions) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [cameraLabel, libraryLabel, fileLabel, cancelLabel],
        cancelButtonIndex: 3,
        userInterfaceStyle: 'light',
      },
      (buttonIndex) => {
        if (buttonIndex === 0) onCamera();
        if (buttonIndex === 1) onLibrary();
        if (buttonIndex === 2) onFile();
      },
    );
    return;
  }

  Alert.alert(title, undefined, [
    { text: cameraLabel, onPress: onCamera },
    { text: libraryLabel, onPress: onLibrary },
    { text: fileLabel, onPress: onFile },
    { text: cancelLabel, style: 'cancel' },
  ]);
}
