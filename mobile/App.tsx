import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList } from 'react-native';

type Screen = 'landing' | 'login' | 'register' | 'marketplace';

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [items, setItems] = useState<Array<{id: string; title: string; category: string; price: number}>>([]);

  async function mockLogin() {
    setStatus('Logging in...');
    await new Promise((r) => setTimeout(r, 500));
    setStatus('Success!');
    setScreen('marketplace');
  }
  async function mockRegister() {
    setStatus('Submitting...');
    await new Promise((r) => setTimeout(r, 500));
    setStatus('Success!');
  }

  async function loadListings() {
    try {
      // Connect to the web app API to get real data from database
      const response = await fetch('http://localhost:3001/api/listings');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      } else {
        // Fallback to local data if API is not available
        const data = {
          items: [
            { id: '1', title: 'Classic White Tee', category: 'Tops', price: 19.99 },
            { id: '2', title: 'Denim Jacket', category: 'Outerwear', price: 59.99 },
            { id: '3', title: 'Black Slim Jeans', category: 'Bottoms', price: 39.99 },
            { id: '4', title: 'Floral Summer Dress', category: 'Dresses', price: 45.00 },
            { id: '5', title: 'Leather Boots', category: 'Shoes', price: 89.99 },
          ],
        };
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      // Fallback to local data on error
      const data = {
        items: [
          { id: '1', title: 'Classic White Tee', category: 'Tops', price: 19.99 },
          { id: '2', title: 'Denim Jacket', category: 'Outerwear', price: 59.99 },
          { id: '3', title: 'Black Slim Jeans', category: 'Bottoms', price: 39.99 },
          { id: '4', title: 'Floral Summer Dress', category: 'Dresses', price: 45.00 },
          { id: '5', title: 'Leather Boots', category: 'Shoes', price: 89.99 },
        ],
      };
      setItems(data.items);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {screen === 'landing' && (
        <View style={styles.centered}>
          <Text style={styles.title}>Top Care Fashion</Text>
          <Text style={styles.subtitle}>Discover, Mix & Match Fashion</Text>
          <View style={{ height: 16 }} />
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setScreen('login')}>
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>
          <View style={{ height: 8 }} />
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setScreen('marketplace'); loadListings(); }}>
            <Text>Browse Marketplace</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {screen === 'login' && (
  <View style={styles.loginWrap}>
    {/* 顶部返回圆角按钮（可选） */}
    <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('landing')}>
      <Text style={styles.backIcon}>‹</Text>
    </TouchableOpacity>

    {/* 标题 */}
    <Text style={styles.loginTitle}>Welcome!</Text>
    <Text style={styles.brandWord}>TOP</Text>

    {/* Email */}
    <TextInput
      style={styles.field}
      placeholder="Enter your email"
      placeholderTextColor="#9AA0A6"
      keyboardType="email-address"
      autoCapitalize="none"
      value={email}
      onChangeText={setEmail}
    />

    {/* Password（演示右侧“眼睛”占位） */}
    <View style={styles.fieldWithIcon}>
      <TextInput
        style={styles.fieldInput}
        placeholder="Enter your password"
        placeholderTextColor="#9AA0A6"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Text style={styles.eyeIcon}>👁️</Text>
    </View>

    {/* Forgot Password */}
    <TouchableOpacity onPress={() => { /* TODO */ }}>
      <Text style={styles.forgot}>Forgot Password?</Text>
    </TouchableOpacity>

    {/* Login 按钮 */}
    <TouchableOpacity style={styles.loginBtn} onPress={mockLogin}>
      <Text style={styles.loginBtnText}>Login</Text>
    </TouchableOpacity>

    {status && <Text style={styles.status}>{status}</Text>}

    {/* 底部注册引导 */}
    <Text style={styles.registerText}>
      Don’t have an account? <Text style={styles.registerLink} onPress={() => setScreen('register')}>Register Now</Text>
    </Text>
  </View>
)}

      

      {screen === 'register' && (
        <View style={styles.formWrap}>
          <Text style={styles.title}>Create your account</Text>
          <View style={{ height: 16 }} />
          <Text>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={styles.primaryBtn} onPress={mockRegister}>
            <Text style={styles.primaryBtnText}>Register</Text>
          </TouchableOpacity>
          {status && <Text style={styles.status}>{status}</Text>}
          <View style={{ height: 12 }} />
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setScreen('marketplace'); loadListings(); }}>
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
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setScreen('landing')}>
            <Text>Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

// 放在样式表外面（文件底部 styles 之前也可以）
const BRAND_RED = '#F54B3D';
const INPUT_BG  = '#F6F7F9';

const styles = StyleSheet.create({
  // 你原来的通用样式
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  formWrap: { flex: 1, padding: 24, gap: 8, justifyContent: 'center' },
  listWrap: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '600' },
  subtitle: { marginTop: 4, color: '#666' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  status: { marginTop: 8, color: '#333' },
  primaryBtn: { backgroundColor: '#000', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: { borderWidth: 1, borderColor: '#ddd', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginBottom: 12 },
  thumbnail: { height: 120, backgroundColor: '#f3f3f3', borderRadius: 8, marginBottom: 8 },
  cardTitle: { fontWeight: '600' },
  cardMeta: { color: '#666', marginTop: 2 },
  cardPrice: { marginTop: 6, fontWeight: '600' },

  // Login 专用样式（新加）
  loginWrap: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  backBtn: {
    width: 48, height: 48, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 8, marginBottom: 12,
  },
  backIcon: { fontSize: 28, color: '#111' },

  loginTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },
  brandWord: {
    fontSize: 72,
    lineHeight: 80,
    fontWeight: '900',
    color: BRAND_RED,
    marginTop: 12,
    marginBottom: 24,
  },

  field: {
    height: 64,
    borderRadius: 16,
    backgroundColor: INPUT_BG,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEF0F3',
  },
  fieldWithIcon: {
    height: 64,
    borderRadius: 16,
    backgroundColor: INPUT_BG,
    borderWidth: 1, borderColor: '#EEF0F3',
    paddingLeft: 20,
    paddingRight: 52,
    justifyContent: 'center',
    marginBottom: 8,
  },
  fieldInput: { fontSize: 16 },
  eyeIcon: {
    position: 'absolute',
    right: 18, top: 18,
    fontSize: 22,
    color: '#6B7280',
  },

  forgot: {
    alignSelf: 'flex-end',
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 24,
    fontSize: 16,
  },

  loginBtn: {
    height: 64,
    backgroundColor: BRAND_RED,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#F54B3D',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 3,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },

  registerText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
    color: '#1F2937',
  },
  registerLink: {
    color: '#00BFA6',
    fontWeight: '800',
  },
});


