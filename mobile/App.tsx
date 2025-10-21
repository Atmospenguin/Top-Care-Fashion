import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import the Mix & Match screen
import { MixAndMatchScreen } from './src/screens/MixAndMatchScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Main app UI */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />

        {/* Mix & Match Screen */}
        <Stack.Screen
          name="MixAndMatch"
          component={MixAndMatchScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

// --- HOME SCREEN LOGIC (your current app) ---
function HomeScreen({ navigation }) {
  const [screen, setScreen] = useState<'landing' | 'register' | 'marketplace'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [items, setItems] = useState<
    Array<{ id: string; title: string; category: string; price: number }>
  >([]);

  async function mockRegister() {
    setStatus('Submitting...');
    await new Promise((r) => setTimeout(r, 500));
    setStatus('Success!');
  }

  async function loadListings() {
    try {
      const response = await fetch('http://localhost:3001/api/listings');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      } else {
        setItems([
          { id: '1', title: 'Classic White Tee', category: 'Tops', price: 19.99 },
          { id: '2', title: 'Denim Jacket', category: 'Outerwear', price: 59.99 },
          { id: '3', title: 'Black Slim Jeans', category: 'Bottoms', price: 39.99 },
          { id: '4', title: 'Floral Summer Dress', category: 'Dresses', price: 45.0 },
          { id: '5', title: 'Leather Boots', category: 'Shoes', price: 89.99 },
        ]);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      setItems([
        { id: '1', title: 'Classic White Tee', category: 'Tops', price: 19.99 },
        { id: '2', title: 'Denim Jacket', category: 'Outerwear', price: 59.99 },
        { id: '3', title: 'Black Slim Jeans', category: 'Bottoms', price: 39.99 },
        { id: '4', title: 'Floral Summer Dress', category: 'Dresses', price: 45.0 },
        { id: '5', title: 'Leather Boots', category: 'Shoes', price: 89.99 },
      ]);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {screen === 'landing' && (
        <View style={styles.centered}>
          <Text style={styles.title}>Top Care Fashion</Text>
          <Text style={styles.subtitle}>Discover, Mix & Match Fashion</Text>
          <View style={{ height: 16 }} />
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setScreen('register')}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>
          <View style={{ height: 8 }} />
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              setScreen('marketplace');
              loadListings();
            }}
          >
            <Text>Browse Marketplace</Text>
          </TouchableOpacity>
          <View style={{ height: 8 }} />
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('MixAndMatch')}
          >
            <Text>Go to Mix & Match</Text>
          </TouchableOpacity>
        </View>
      )}

      {screen === 'register' && (
        <View style={styles.formWrap}>
          <Text style={styles.title}>Create your account</Text>
          <View style={{ height: 16 }} />
          <Text>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={mockRegister}>
            <Text style={styles.primaryBtnText}>Register</Text>
          </TouchableOpacity>
          {status && <Text style={styles.status}>{status}</Text>}
          <View style={{ height: 12 }} />
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              setScreen('marketplace');
              loadListings();
            }}
          >
            <Text>Go to Marketplace</Text>
          </TouchableOpacity>
        </View>
      )}

      {screen === 'marketplace' && (
        <View style={styles.listWrap}>
          <Text style={styles.title}>Marketplace</Text>
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.thumbnail} />
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>{item.category}</Text>
                <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>
              </View>
            )}
            contentContainerStyle={{ paddingVertical: 12 }}
          />
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setScreen('landing')}
          >
            <Text>Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  formWrap: { flex: 1, padding: 24, gap: 8, justifyContent: 'center' },
  listWrap: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '600' },
  subtitle: { marginTop: 4, color: '#666' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  status: { marginTop: 8, color: '#333' },
  primaryBtn: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  thumbnail: {
    height: 120,
    backgroundColor: '#f3f3f3',
    borderRadius: 8,
    marginBottom: 8,
  },
  cardTitle: { fontWeight: '600' },
  cardMeta: { color: '#666', marginTop: 2 },
  cardPrice: { marginTop: 6, fontWeight: '600' },
});
