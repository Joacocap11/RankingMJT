import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError, api } from '../../src/api/client';
import type { Monster, PickedImage } from '../../src/api/types';
import { MonsterForm, type MonsterFormValues } from '../../src/components/MonsterForm';

export default function EditMonsterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const monsterId = Number.parseInt(id, 10);

  const [monster, setMonster] = useState<Monster | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([api.getMonster(monsterId), api.listMonsters()])
        .then(([loadedMonster, list]) => {
          setMonster(loadedMonster);
          setTotalCount(list.length);
          setLoadError(null);
        })
        .catch((err) => {
          setLoadError(err instanceof ApiError ? err.message : 'No se pudo cargar la lata.');
        });
    }, [monsterId]),
  );

  async function handleSubmit(values: MonsterFormValues, pickedImage: PickedImage | null) {
    setSubmitting(true);
    try {
      await api.updateMonster(monsterId, {
        nickname: values.nickname,
        flavor: values.flavor,
        rank_position: Number.parseInt(values.rankPosition, 10),
        would_buy_again: values.wouldBuyAgain,
        notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
      });
      if (pickedImage) {
        await api.uploadImage(monsterId, pickedImage);
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'No se pudo guardar la lata.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete() {
    if (!monster) return;
    Alert.alert(
      'Eliminar Monster',
      `¿Eliminar "${monster.nickname} - ${monster.flavor}" del ranking?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteMonster(monsterId);
              router.back();
            } catch (err) {
              Alert.alert(
                'Error',
                err instanceof ApiError ? err.message : 'No se pudo eliminar la lata.',
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

  if (!monster) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MonsterForm
        initialValues={{
          nickname: monster.nickname,
          flavor: monster.flavor,
          rankPosition: String(monster.rank_position),
          wouldBuyAgain: monster.would_buy_again,
          notes: monster.notes ?? '',
        }}
        maxRankPosition={totalCount}
        existingImagePath={monster.image_path}
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
