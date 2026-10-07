import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// Add future rankings (Alfajores, ...) as one more entry here — no other
// navigation changes required.
const TABS = [
  { label: 'Monsters', path: '/' as const },
  { label: 'Cervezas', path: '/beers' as const },
  { label: 'Alfajores', path: '/alfajores' as const },
];

/** Lightweight header control to switch between ranking modules. Lives above
 * each ranking screen's own list; never touches the SectionList/FlatList
 * state of the screen it's rendered in. Tabs share width evenly (`flex: 1`)
 * so adding a fourth ranking later needs no layout changes here. */
export function RankingSwitcher() {
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const active = tab.path === '/' ? pathname === '/' : pathname.startsWith(tab.path);
        return (
          <Pressable
            key={tab.path}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => {
              if (!active) router.replace(tab.path);
            }}
          >
            <Text
              style={[styles.tabText, active && styles.tabTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#000',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  tabActive: {
    backgroundColor: '#0a84ff',
    borderColor: '#0a84ff',
  },
  tabText: {
    color: '#aeaeb2',
    fontWeight: '600',
    fontSize: 12,
  },
  tabTextActive: {
    color: '#fff',
  },
});
