import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NO_RATING_LABEL, RATING_MAX, RATING_MIN, stepRating } from '../rating';

interface RatingControlProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

/** Discrete rating control: [-] 8.5 / 10 [+] plus a "Sin puntuar" button.
 * Pure JS/TS (no native deps). Rating is a secondary reference; it never
 * touches rank_position. */
export function RatingControl({ value, onChange }: RatingControlProps) {
  return (
    <View>
      <Text style={styles.label}>Puntuación</Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.step, (value === null || value <= RATING_MIN) && styles.disabled]}
          onPress={() => onChange(stepRating(value, -1))}
          disabled={value === null || value <= RATING_MIN}
          accessibilityRole="button"
          accessibilityLabel="Bajar 0.5"
        >
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <View style={styles.valueBox}>
          {value === null ? (
            <Text style={styles.valueText}>{NO_RATING_LABEL}</Text>
          ) : (
            <Text style={styles.valueText}>
              {value.toFixed(1)}
              <Text style={styles.valueSuffix}> / 10</Text>
            </Text>
          )}
        </View>
        <Pressable
          style={[styles.step, value !== null && value >= RATING_MAX && styles.disabled]}
          onPress={() => onChange(stepRating(value, 1))}
          disabled={value !== null && value >= RATING_MAX}
          accessibilityRole="button"
          accessibilityLabel="Subir 0.5"
        >
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
      <Pressable
        style={[styles.clear, value === null && styles.disabled]}
        onPress={() => onChange(null)}
        disabled={value === null}
        accessibilityRole="button"
      >
        <Text style={styles.clearText}>{NO_RATING_LABEL}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: '#aeaeb2',
    fontSize: 13,
    marginTop: 12,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  step: {
    width: 56,
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c2c2e',
  },
  stepText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '600',
  },
  valueBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1c1c1e',
  },
  valueText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  valueSuffix: {
    color: '#8e8e93',
    fontSize: 14,
    fontWeight: '400',
  },
  clear: {
    marginTop: 8,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c2c2e',
  },
  clearText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
});
