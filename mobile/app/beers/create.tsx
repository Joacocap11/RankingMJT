import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ApiError, api } from '../../src/api/client';
import type { PickedImage } from '../../src/api/types';
import { BeerForm, type BeerFormValues } from '../../src/components/BeerForm';

export default function CreateBeerScreen() {
  const [beerCount, setBeerCount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api
        .listBeers()
        .then((list) => setBeerCount(list.length))
        .catch(() => setBeerCount(0));
    }, []),
  );

  async function handleSubmit(values: BeerFormValues, pickedImage: PickedImage | null) {
    setSubmitting(true);
    try {
      const created = await api.createBeer({
        brand: values.brand,
        name: values.name,
        rank_position: Number.parseInt(values.rankPosition, 10),
        would_buy_again: values.wouldBuyAgain,
        notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
      });
      if (pickedImage) {
        await api.uploadBeerImage(created.id, pickedImage);
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'No se pudo crear la cerveza.');
    } finally {
      setSubmitting(false);
    }
  }

  if (beerCount === null) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <BeerForm
        initialValues={{
          brand: '',
          name: '',
          rankPosition: String(beerCount + 1),
          wouldBuyAgain: true,
          notes: '',
        }}
        maxRankPosition={beerCount + 1}
        existingImagePath={null}
        submitLabel="Crear"
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
