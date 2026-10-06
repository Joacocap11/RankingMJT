import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { ApiError, api, imageUrl } from '../../src/api/client';
import type { Beer } from '../../src/api/types';
import { BeerCard } from '../../src/components/BeerCard';
import { ImageViewerModal } from '../../src/components/ImageViewerModal';
import { RankingSwitcher } from '../../src/components/RankingSwitcher';

interface Section {
  title: string;
  data: Beer[];
}

export default function BeerRankingScreen() {
  const [beers, setBeers] = useState<Beer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  // Looked up by id inside stable callbacks below, so those callbacks never
  // need `beers` as a dependency (which would otherwise recreate them, and
  // every BeerCard prop with them, on every fetch).
  const beersRef = useRef<Beer[]>([]);
  useEffect(() => {
    beersRef.current = beers ?? [];
  }, [beers]);

  const loadBeers = useCallback(async () => {
    try {
      const data = await api.listBeers();
      setBeers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBeers();
    }, [loadBeers]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadBeers();
    setRefreshing(false);
  }

  const handleOpenEdit = useCallback((id: number) => {
    router.push(`/beers/edit/${id}`);
  }, []);

  const handleImagePress = useCallback((id: number) => {
    const beer = beersRef.current.find((b) => b.id === id);
    const uri = beer ? imageUrl(beer.image_path) : null;
    if (uri) setViewerUri(uri);
  }, []);

  const handleDeletePress = useCallback((id: number) => {
    const beer = beersRef.current.find((b) => b.id === id);
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
              await api.deleteBeer(beer.id);
              await loadBeers();
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
  }, [loadBeers]);

  const renderItem = useCallback(
    ({ item }: { item: Beer }) => (
      <BeerCard
        beer={item}
        onPress={handleOpenEdit}
        onImagePress={handleImagePress}
        onDelete={handleDeletePress}
      />
    ),
    [handleOpenEdit, handleImagePress, handleDeletePress],
  );

  const sections = useMemo<Section[]>(() => {
    if (!beers) return [];
    // Global rank_position order is preserved end-to-end; sections are a
    // visual grouping only, never a renumbering of the ranking.
    const sorted = [...beers].sort((a, b) => a.rank_position - b.rank_position);
    return [
      { title: 'COMPRARÍA', data: sorted.filter((b) => b.would_buy_again) },
      { title: 'NO COMPRARÍA', data: sorted.filter((b) => !b.would_buy_again) },
    ];
  }, [beers]);

  if (beers === null && !error) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (error && beers === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={loadBeers}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RankingSwitcher />
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>
            {section.title} ({section.data.length})
          </Text>
        )}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Todavía no hay cervezas en el ranking.</Text>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fff" />
        }
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        removeClippedSubviews
      />
      <Link href="/beers/create" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Link>
      <ImageViewerModal uri={viewerUri} onClose={() => setViewerUri(null)} />
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
