import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

const LOGO_URL = 'https://kochex.com/wp-content/uploads/2025/12/logokoch.png';

const FEATURES = [
  { icon: 'clock' as const, label: 'Sefer Süre Takip', desc: 'RoRo & Liman Süreci' },
  { icon: 'truck' as const, label: 'Araç Envanter', desc: 'Çekici & Dorse Takibi' },
  { icon: 'users' as const, label: 'Sürücü Yönetimi', desc: 'Belge & Schengen Takibi' },
  { icon: 'dollar-sign' as const, label: 'Fiyat Oluşturma', desc: 'EUR Bazlı Hesaplama' },
];

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Kullanıcı adı ve şifre gereklidir.');
      return;
    }
    setError(null);
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else {
      setError(result.error ?? 'Giriş başarısız.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === 'web' ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <LinearGradient
      colors={['#060d1a', '#0c1525', '#0a1020']}
      style={{ flex: 1 }}
    >
      {/* Amber accent bar at top */}
      <View style={[styles.accentBar, { top: topPad }]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: topPad + 24, paddingBottom: bottomPad + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + Brand */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <View style={[styles.liveDot, { backgroundColor: colors.amber }]} />
              <Text style={[styles.liveBadgeText, { color: colors.amber }]}>KOCH LOJİSTİK HUB</Text>
            </View>
            <Image
              source={{ uri: LOGO_URL }}
              style={styles.logoImage}
              contentFit="contain"
              tintColor="#ffffff"
            />
            <Text style={styles.brandTitle}>Koch Lojistik</Text>
            <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>
              Filo yönetimi ve operasyonel takip sistemi
            </Text>
          </View>

          {/* Feature pills */}
          <View style={styles.featuresRow}>
            {FEATURES.map((f) => (
              <View key={f.label} style={[styles.featurePill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name={f.icon} size={13} color={colors.amber} />
                <Text style={[styles.featurePillText, { color: colors.mutedForeground }]}>{f.label}</Text>
              </View>
            ))}
          </View>

          {/* Login card */}
          <View style={[styles.card, { backgroundColor: 'rgba(17,29,46,0.95)', borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Sisteme Giriş</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Yetkili personel erişimi
            </Text>

            {/* Username */}
            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: error ? colors.statusCritical : colors.border }]}>
              <Feather name="user" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Kullanıcı adı"
                placeholderTextColor={colors.mutedForeground}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                testID="input-username"
              />
            </View>

            {/* Password */}
            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: error ? colors.statusCritical : colors.border, marginTop: 12 }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Şifre"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                testID="input-password"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {/* Error */}
            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.statusCriticalLight }]}>
                <Feather name="alert-circle" size={14} color={colors.statusCritical} />
                <Text style={[styles.errorText, { color: colors.statusCritical }]}>{error}</Text>
              </View>
            ) : null}

            {/* Login button */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              testID="button-login"
              style={({ pressed }) => [{ opacity: pressed || loading ? 0.8 : 1, marginTop: 20 }]}
            >
              <LinearGradient
                colors={['#1e3a5f', '#1a3154']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.loginBtn, { borderColor: colors.primary }]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>Giriş Yap</Text>
                    <Feather name="arrow-right" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Footer */}
          <Text style={[styles.footer, { color: colors.mutedForeground }]}>
            © {new Date().getFullYear()} Koch Logistics — Kısıtlı erişim alanı
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  accentBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#f59e0b',
    opacity: 0.6,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 2,
  },
  logoImage: {
    width: 160,
    height: 48,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  brandSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 28,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  featurePillText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 50,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  footer: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
