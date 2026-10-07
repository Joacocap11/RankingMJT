import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ApiError, api } from '../../src/api/client';
import type { PickedImage } from '../../src/api/types';
import { AlfajorForm, type AlfajorFormValues } from '../../src/components/AlfajorForm';

export default function CreateAlfajorScreen() {
  const [alfajorCount, setAlfajorCount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api
        .listAlfajores()
        .then((list) => setAlfajorCount(list.length))
        .catch(() => setAlfajorCount(0));
    }, []),
  );

  async function handleSubmit(values: AlfajorFormValues, pickedImage: PickedImage | null) {
    setSubmitting(true);
    try {
      const created = await api.createAlfajor({
        brand: values.brand,
        name: values.name,
        rank_position: Number.parseInt(values.rankPosition, 10),
        would_buy_again: values.wouldBuyAgain,
        notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
      });
      if (pickedImage) {
        await api.uploadAlfajorImage(created.id, pickedImage);
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'No se pudo crear el alfajor.');
    } finally {
      setSubmitting(false);
    }
  }

  if (alfajorCount === null) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <AlfajorForm
        initialValues={{
          brand: '',
          name: '',
          rankPosition: String(alfajorCount + 1),
          wouldBuyAgain: true,
          notes: '',
        }}
        maxRankPosition={alfajorCount + 1}
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
