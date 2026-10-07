import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { imageUrl } from '../api/client';
import type { PickedImage } from '../api/types';

export interface AlfajorFormValues {
  brand: string;
  name: string;
  rankPosition: string;
  wouldBuyAgain: boolean;
  notes: string;
}

interface AlfajorFormProps {
  initialValues: AlfajorFormValues;
  maxRankPosition: number;
  existingImagePath: string | null;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: AlfajorFormValues, pickedImage: PickedImage | null) => void;
}

export function AlfajorForm({
  initialValues,
  maxRankPosition,
  existingImagePath,
  submitLabel,
  submitting,
  onSubmit,
}: AlfajorFormProps) {
  const [brand, setBrand] = useState(initialValues.brand);
  const [name, setName] = useState(initialValues.name);
  const [rankPosition, setRankPosition] = useState(initialValues.rankPosition);
  const [wouldBuyAgain, setWouldBuyAgain] = useState(initialValues.wouldBuyAgain);
  const [notes, setNotes] = useState(initialValues.notes);
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewUri = pickedImage?.uri ?? imageUrl(existingImagePath) ?? undefined;

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Se necesita permiso para acceder a la galería de imágenes.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    const extension = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeByExtension: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };
    setPickedImage({
      uri: asset.uri,
      name: `upload.${extension}`,
      type: mimeByExtension[extension] ?? 'image/jpeg',
    });
  }

  function handleSubmit() {
    setError(null);
    if (brand.trim().length === 0) {
      setError('La marca es obligatoria.');
      return;
    }
    if (name.trim().length === 0) {
      setError('El nombre es obligatorio.');
      return;
    }
    const parsedRank = Number.parseInt(rankPosition, 10);
    if (!Number.isInteger(parsedRank) || parsedRank < 1 || parsedRank > maxRankPosition) {
      setError(`La posición debe ser un número entre 1 y ${maxRankPosition}.`);
      return;
    }
    onSubmit(
      {
        brand: brand.trim(),
        name: name.trim(),
        rankPosition: String(parsedRank),
        wouldBuyAgain,
        notes,
      },
      pickedImage,
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Marca</Text>
      <TextInput
        style={styles.input}
        value={brand}
        onChangeText={setBrand}
        placeholder="p. ej. Havanna"
        placeholderTextColor="#636366"
      />

      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="p. ej. 70% Cacao"
        placeholderTextColor="#636366"
      />

      <Text style={styles.label}>Posición (1-{maxRankPosition})</Text>
      <TextInput
        style={styles.input}
        value={rankPosition}
        onChangeText={setRankPosition}
        keyboardType="number-pad"
        placeholder="1"
        placeholderTextColor="#636366"
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>¿Lo comprarías de nuevo?</Text>
        <Switch value={wouldBuyAgain} onValueChange={setWouldBuyAgain} />
      </View>

      <Text style={styles.label}>Notas</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Opcional"
        placeholderTextColor="#636366"
        multiline
      />

      <Text style={styles.label}>Imagen</Text>
      {previewUri ? (
        <Image source={{ uri: previewUri }} style={styles.imagePreview} resizeMode="cover" />
      ) : null}
      <Pressable style={styles.secondaryButton} onPress={handlePickImage}>
        <Text style={styles.secondaryButtonText}>
          {previewUri ? 'Cambiar imagen' : 'Elegir imagen'}
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 4,
  },
  label: {
    color: '#aeaeb2',
    fontSize: 13,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#1c1c1e',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginTop: 8,
    backgroundColor: '#2c2c2e',
  },
  secondaryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#2c2c2e',
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#ff453a',
    marginTop: 16,
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: '#0a84ff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
