import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiError, api } from '../src/api/client';
import type { Monster } from '../src/api/types';
import { MonsterCard } from '../src/components/MonsterCard';

interface Section {
  title: string;
  data: Monster[];
}

export default function RankingScreen() {
  const [monsters, setMonsters] = useState<Monster[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadMonsters = useCallback(async () => {
    try {
      const data = await api.listMonsters();
      setMonsters(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMonsters();
    }, [loadMonsters]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadMonsters();
    setRefreshing(false);
  }

  function confirmDelete(monster: Monster) {
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
              await api.deleteMonster(monster.id);
              await loadMonsters();
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

  const sections = useMemo<Section[]>(() => {
    if (!monsters) return [];
    // Global rank_position order is preserved end-to-end; sections are a
    // visual grouping only, never a renumbering of the ranking.
    const sorted = [...monsters].sort((a, b) => a.rank_position - b.rank_position);
    return [
      { title: 'COMPRARÍA', data: sorted.filter((m) => m.would_buy_again) },
      { title: 'NO COMPRARÍA', data: sorted.filter((m) => !m.would_buy_again) },
    ];
  }, [monsters]);

  if (monsters === null && !error) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (error && monsters === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={loadMonsters}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>
            {section.title} ({section.data.length})
          </Text>
        )}
        renderItem={({ item }) => (
          <MonsterCard
            monster={item}
            onPress={() => router.push(`/edit/${item.id}`)}
            onDelete={() => confirmDelete(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Todavía no hay Monsters en el ranking.</Text>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fff" />
        }
      />
      <Link href="/create" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Link>
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
    gap: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 96,
  },
  sectionHeader: {
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 48,
  },
  errorText: {
    color: '#ff453a',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0a84ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0a84ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '400',
  },
});
