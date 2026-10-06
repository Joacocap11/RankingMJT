import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError, api } from '../../../src/api/client';
import type { Beer, PickedImage } from '../../../src/api/types';
import { BeerForm, type BeerFormValues } from '../../../src/components/BeerForm';

export default function EditBeerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const beerId = Number.parseInt(id, 10);

  const [beer, setBeer] = useState<Beer | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([api.getBeer(beerId), api.listBeers()])
        .then(([loadedBeer, list]) => {
          setBeer(loadedBeer);
          setTotalCount(list.length);
          setLoadError(null);
        })
        .catch((err) => {
          setLoadError(err instanceof ApiError ? err.message : 'No se pudo cargar la cerveza.');
        });
    }, [beerId]),
  );

  async function handleSubmit(values: BeerFormValues, pickedImage: PickedImage | null) {
    setSubmitting(true);
    try {
      await api.updateBeer(beerId, {
        brand: values.brand,
        name: values.name,
        rank_position: Number.parseInt(values.rankPosition, 10),
        would_buy_again: values.wouldBuyAgain,
        notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
      });
      if (pickedImage) {
        await api.uploadBeerImage(beerId, pickedImage);
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'No se pudo guardar la cerveza.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete() {
    if (!beer) return;
    Alert.alert(
      'Eliminar Cerveza',
      `¿Eliminar "${beer.brand} - ${beer.name}" del ranking?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteBeer(beerId);
              router.back();
            } catch (err) {
              Alert.alert(
                'Error',
                err instanceof ApiError ? err.message : 'No se pudo eliminar la cerveza.',
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

  if (!beer) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BeerForm
        initialValues={{
          brand: beer.brand,
          name: beer.name,
          rankPosition: String(beer.rank_position),
          wouldBuyAgain: beer.would_buy_again,
          notes: beer.notes ?? '',
        }}
        maxRankPosition={totalCount}
        existingImagePath={beer.image_path}
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
