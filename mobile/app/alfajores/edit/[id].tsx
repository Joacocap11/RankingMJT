import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError, api } from '../../../src/api/client';
import type { Alfajor, PickedImage } from '../../../src/api/types';
import { AlfajorForm, type AlfajorFormValues } from '../../../src/components/AlfajorForm';

export default function EditAlfajorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const alfajorId = Number.parseInt(id, 10);

  const [alfajor, setAlfajor] = useState<Alfajor | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([api.getAlfajor(alfajorId), api.listAlfajores()])
        .then(([loadedAlfajor, list]) => {
          setAlfajor(loadedAlfajor);
          setTotalCount(list.length);
          setLoadError(null);
        })
        .catch((err) => {
          setLoadError(err instanceof ApiError ? err.message : 'No se pudo cargar el alfajor.');
        });
    }, [alfajorId]),
  );

  async function handleSubmit(values: AlfajorFormValues, pickedImage: PickedImage | null) {
    setSubmitting(true);
    try {
      await api.updateAlfajor(alfajorId, {
        brand: values.brand,
        name: values.name,
        rank_position: Number.parseInt(values.rankPosition, 10),
        would_buy_again: values.wouldBuyAgain,
        notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
      });
      if (pickedImage) {
        await api.uploadAlfajorImage(alfajorId, pickedImage);
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'No se pudo guardar el alfajor.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete() {
    if (!alfajor) return;
    Alert.alert(
      'Eliminar Alfajor',
      `¿Eliminar "${alfajor.brand} - ${alfajor.name}" del ranking?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAlfajor(alfajorId);
              router.back();
            } catch (err) {
              Alert.alert(
                'Error',
                err instanceof ApiError ? err.message : 'No se pudo eliminar el alfajor.',
              );
            }
          },
        },
      ],
    );
  }

  if (loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{loadError}</Text>
      </View>
    );
  }

  if (!alfajor) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AlfajorForm
        initialValues={{
          brand: alfajor.brand,
          name: alfajor.name,
          rankPosition: String(alfajor.rank_position),
          wouldBuyAgain: alfajor.would_buy_again,
          notes: alfajor.notes ?? '',
        }}
        maxRankPosition={totalCount}
        existingImagePath={alfajor.image_path}
        submitLabel="Guardar cambios"
        submitting={submitting}
        onSubmit={handleSubmit}
      />
      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Eliminar del ranking</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 24,
  },
  errorText: {
    color: '#ff453a',
    textAlign: 'center',
  },
  deleteButton: {
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff453a',
  },
  deleteButtonText: {
    color: '#ff453a',
    fontWeight: '700',
    fontSize: 16,
  },
});
