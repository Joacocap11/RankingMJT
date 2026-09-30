import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { thumbnailUrl } from '../api/client';
import type { Monster } from '../api/types';

interface MonsterCardProps {
  monster: Monster;
  onPress: (id: number) => void;
  onImagePress: (id: number) => void;
  onDelete: (id: number) => void;
}

/** Memoized: with stable `onPress`/`onImagePress`/`onDelete` (see index.tsx),
 * a row only re-renders when its own `monster` object actually changes,
 * instead of on every list re-render (refresh toggles, unrelated state). */
function MonsterCardComponent({ monster, onPress, onImagePress, onDelete }: MonsterCardProps) {
  const uri = thumbnailUrl(monster);

  return (
    <Pressable style={styles.card} onPress={() => onPress(monster.id)}>
      <Text style={styles.position}>#{monster.rank_position}</Text>
      {uri ? (
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onImagePress(monster.id);
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
        <Text style={styles.nickname}>{monster.nickname}</Text>
        <Text style={styles.flavor}>{monster.flavor}</Text>
        <View
          style={[
            styles.badge,
            monster.would_buy_again ? styles.badgeBuyAgain : styles.badgeNoBuyAgain,
          ]}
        >
          <Text style={styles.badgeText}>
            {monster.would_buy_again ? 'Compraría de nuevo' : 'No compraría'}
          </Text>
        </View>
      </View>
      <Pressable
        style={styles.deleteButton}
        onPress={(event) => {
          event.stopPropagation();
          onDelete(monster.id);
        }}
        hitSlop={8}
      >
        <Text style={styles.deleteButtonText}>✕</Text>
      </Pressable>
    </Pressable>
  );
}

export const MonsterCard = memo(MonsterCardComponent);

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
    width: 32,
    fontWeight: '700',
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#2c2c2e',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: '#636366',
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  nickname: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  flavor: {
    fontSize: 13,
    color: '#aeaeb2',
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  badgeBuyAgain: {
    backgroundColor: '#1f4d2e',
  },
  badgeNoBuyAgain: {
    backgroundColor: '#5a1f24',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
