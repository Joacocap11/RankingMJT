import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { thumbnailUrl } from '../api/client';
import type { Alfajor } from '../api/types';

interface AlfajorCardProps {
  alfajor: Alfajor;
  onPress: (id: number) => void;
  onImagePress: (id: number) => void;
  onDelete: (id: number) => void;
}

/** Memoized: with stable `onPress`/`onImagePress`/`onDelete` (see
 * app/alfajores/index.tsx), a row only re-renders when its own `alfajor`
 * object actually changes, instead of on every list re-render. */
function AlfajorCardComponent({ alfajor, onPress, onImagePress, onDelete }: AlfajorCardProps) {
  const uri = thumbnailUrl(alfajor);

  return (
    <Pressable style={styles.card} onPress={() => onPress(alfajor.id)}>
      <Text style={styles.position}>#{alfajor.rank_position}</Text>
      {uri ? (
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onImagePress(alfajor.id);
          }}
          hitSlop={4}
        >
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
          />
        </Pressable>
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>?</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.nickname}>{alfajor.brand}</Text>
        <Text style={styles.flavor}>{alfajor.name}</Text>
        <View
          style={[
            styles.badge,
            alfajor.would_buy_again ? styles.badgeBuyAgain : styles.badgeNoBuyAgain,
          ]}
        >
          <Text style={styles.badgeText}>
            {alfajor.would_buy_again ? 'Compraría de nuevo' : 'No compraría'}
          </Text>
        </View>
      </View>
      <Pressable
        style={styles.deleteButton}
        onPress={(event) => {
          event.stopPropagation();
          onDelete(alfajor.id);
        }}
        hitSlop={8}
      >
        <Text style={styles.deleteButtonText}>✕</Text>
      </Pressable>
    </Pressable>
  );
}

export const AlfajorCard = memo(AlfajorCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    marginBottom: 8,
  },
  position: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    minWidth: 28,
    textAlign: 'center',
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#2c2c2e',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: '#636366',
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  nickname: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  flavor: {
    color: '#aeaeb2',
    fontSize: 13,
    marginTop: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeBuyAgain: {
    backgroundColor: '#1f4d2e',
  },
  badgeNoBuyAgain: {
    backgroundColor: '#5a1f24',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c2c2e',
  },
  deleteButtonText: {
    color: '#ff453a',
    fontSize: 14,
    fontWeight: '700',
  },
});
