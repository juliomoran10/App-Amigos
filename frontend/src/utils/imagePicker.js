import * as ImagePicker from 'expo-image-picker';

export async function pickImageFromGallery() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permiso denegado', 'Se requiere acceso a la galería.');
    return null;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      return result.assets[0].uri;
    }

    return null;
  } catch {
    Alert.alert('Error', 'No se pudo procesar la imagen.');
    return null;
  }
}
