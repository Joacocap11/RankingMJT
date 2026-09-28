import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          contentStyle: { backgroundColor: '#000' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Ranking Monsters' }} />
        <Stack.Screen name="create" options={{ title: 'Nueva Monster', presentation: 'modal' }} />
        <Stack.Screen name="edit/[id]" options={{ title: 'Editar Monster', presentation: 'modal' }} />
      </Stack>
    </>
  );
}
