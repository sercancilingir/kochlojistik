import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

const LOGO_URL = 'https://kochex.com/wp-content/uploads/2025/12/logokoch.png';

const APP_VERSION = '2.0.0';

interface MenuItemProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

function MenuItem({ icon, label, value, onPress, destructive, showChevron }: MenuItemProps) {
  const colors = useColors();
  const iconColor = destructive ? colors.statusCritical : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: destructive ? colors.statusCriticalLight : `${colors.primary}22` }]}>
        <Feather name={icon} size={16} color={iconColor} />
      </View>
      <Text style={[styles.menuLabel, { color: destructive ? colors.statusCritical : colors.foreground }]}>
        {label}
      </Text>
      {value ? (
        <Text style={[styles.menuValue, { color: colors.mutedForeground }]}>{value}</Text>
      ) : null}
      {showChevron && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
    </Pressable>
  );
}

function MenuGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.menuGroup}>
      <Text style={[styles.menuGroupTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[styles.menuGroupContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

export default function ProfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      performLogout();
    } else {
      Alert.alert(
        'Çıkış Yap',
        'Hesabınızdan çıkmak istediğinizden emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Çıkış Yap', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  const performLogout = async () => {
    setLoggingOut(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
    setLoggingOut(false);
    router.replace('/login');
  };

  const roleLabel = (r: string | undefined) => {
    if (!r) return '—';
    if (r === 'admin') return 'Yönetici';
    if (r === 'viewer') return 'Görüntüleyici';
    return r;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profil</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User card */}
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatarLarge, { backgroundColor: `${colors.primary}22` }]}>
            <Text style={[styles.avatarChar, { color: colors.primary }]}>
              {user?.username?.charAt(0)?.toUpperCase() ?? 'K'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.foreground }]}>{user?.username ?? '—'}</Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.amberMuted }]}>
              <Text style={[styles.roleText, { color: colors.amber }]}>
                {roleLabel(user?.role)}
              </Text>
            </View>
          </View>
          <Image
            source={{ uri: LOGO_URL }}
            style={styles.userCardLogo}
            contentFit="contain"
            tintColor={colors.mutedForeground}
          />
        </View>

        {/* Account info */}
        <MenuGroup title="HESAP BİLGİLERİ">
          <MenuItem
            icon="user"
            label="Kullanıcı Adı"
            value={user?.username ?? '—'}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="shield"
            label="Rol"
            value={roleLabel(user?.role)}
          />
        </MenuGroup>

        {/* App info */}
        <MenuGroup title="UYGULAMA">
          <MenuItem
            icon="info"
            label="Versiyon"
            value={`v${APP_VERSION}`}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="globe"
            label="Platform"
            value={Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="server"
            label="Ortam"
            value="Canlı Sistem"
          />
        </MenuGroup>

        {/* Modules */}
        <MenuGroup title="MODÜLLER">
          <MenuItem icon="users" label="Sürücü Yönetimi" showChevron />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <MenuItem icon="clock" label="Sefer Süre Takip" showChevron />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <MenuItem icon="truck" label="Araç Envanter" showChevron />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <MenuItem icon="dollar-sign" label="Fiyat Oluşturma" showChevron />
        </MenuGroup>

        {/* Logout */}
        <MenuGroup title="">
          <MenuItem
            icon="log-out"
            label={loggingOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
            onPress={handleLogout}
            destructive
          />
        </MenuGroup>

        {/* Footer */}
        <View style={styles.footer}>
          <Image
            source={{ uri: LOGO_URL }}
            style={styles.footerLogo}
            contentFit="contain"
            tintColor={colors.mutedForeground}
          />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            © {new Date().getFullYear()} Koch Logistics
          </Text>
          <Text style={[styles.footerSub, { color: `${colors.mutedForeground}88` }]}>
            Kısıtlı erişim alanı — Sadece yetkili personel
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  content: { padding: 16, gap: 20 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChar: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  userInfo: { flex: 1, gap: 6 },
  userName: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 5,
  },
  roleText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  userCardLogo: { width: 60, height: 24, opacity: 0.5 },
  menuGroup: { gap: 6 },
  menuGroupTitle: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  menuGroupContent: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  menuValue: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  separator: { height: 1, marginLeft: 60 },
  footer: { alignItems: 'center', gap: 6, paddingTop: 12 },
  footerLogo: { width: 80, height: 28, opacity: 0.4 },
  footerText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  footerSub: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
