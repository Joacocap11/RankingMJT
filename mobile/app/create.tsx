import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ApiError, api } from '../src/api/client';
import type { PickedImage } from '../src/api/types';
import { MonsterForm, type MonsterFormValues } from '../src/components/MonsterForm';

export default function CreateMonsterScreen() {
  const [monsterCount, setMonsterCount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api
        .listMonsters()
        .then((list) => setMonsterCount(list.length))
        .catch(() => setMonsterCount(0));
    }, []),
  );

  async function handleSubmit(values: MonsterFormValues, pickedImage: PickedImage | null) {
    setSubmitting(true);
    try {
      const created = await api.createMonster({
        nickname: values.nickname,
        flavor: values.flavor,
        rank_position: Number.parseInt(values.rankPosition, 10),
        would_buy_again: values.wouldBuyAgain,
        notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
      });
      if (pickedImage) {
        await api.uploadImage(created.id, pickedImage);
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'No se pudo crear la lata.');
    } finally {
      setSubmitting(false);
    }
  }

  if (monsterCount === null) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <MonsterForm
        initialValues={{
          nickname: '',
          flavor: '',
          rankPosition: String(monsterCount + 1),
          wouldBuyAgain: true,
          notes: '',
        }}
        maxRankPosition={monsterCount + 1}
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
