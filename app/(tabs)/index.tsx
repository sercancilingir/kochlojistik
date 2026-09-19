import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

const LOGO_URL = 'https://kochex.com/wp-content/uploads/2025/12/logokoch.png';

interface DriverWithStatus {
  id: number;
  name: string;
  status: 'safe' | 'warning' | 'critical';
  remainingDays: number;
  daysSpent: number;
  hasActiveTrip: boolean;
  currentLocation: string | null;
}

function useDrivers() {
  return useQuery<DriverWithStatus[]>({
    queryKey: ['drivers'],
    queryFn: async () => {
      const res = await apiFetch('/api/drivers');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<DriverWithStatus[]>;
    },
    retry: 1,
  });
}

function StatCard({
  label,
  value,
  color,
  icon,
  onPress,
  active,
}: {
  label: string;
  value: number;
  color: string;
  colorBg: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress?: () => void;
  active?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderColor: active ? color : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: `${color}22` }]}>
        <Feather name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </Pressable>
  );
}

function StatusBadge({ status }: { status: 'safe' | 'warning' | 'critical' }) {
  const colors = useColors();
  const cfg = {
    safe: { bg: colors.statusSafeLight, text: colors.statusSafe, label: 'GÜVENLİ' },
    warning: { bg: colors.statusWarningLight, text: colors.statusWarning, label: 'UYARI' },
    critical: { bg: colors.statusCriticalLight, text: colors.statusCritical, label: 'KRİTİK' },
  }[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

function DriverRow({ driver }: { driver: DriverWithStatus }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.driverRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.avatarWrap, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>
          {driver.name?.charAt(0)?.toUpperCase() ?? '?'}
        </Text>
      </View>
      <View style={styles.driverInfo}>
        <Text style={[styles.driverName, { color: colors.foreground }]} numberOfLines={1}>
          {driver.name}
        </Text>
        <Text style={[styles.driverSub, { color: colors.mutedForeground }]}>
          {driver.daysSpent} gün kullanıldı · {driver.remainingDays} gün kaldı
        </Text>
      </View>
      <StatusBadge status={driver.status} />
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: drivers = [], isLoading, isError, refetch, isFetching } = useDrivers();

  const safe = drivers.filter((d) => d.status === 'safe').length;
  const warning = drivers.filter((d) => d.status === 'warning').length;
  const critical = drivers.filter((d) => d.status === 'critical').length;
  const abroad = drivers.filter((d) => d.hasActiveTrip).length;

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: LOGO_URL }} style={styles.headerLogo} contentFit="contain" tintColor={colors.foreground} />
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Dashboard</Text>
            <Text style={[styles.headerSub, { color: colors.amber }]}>
              Hoş geldiniz, {user?.username ?? '—'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => refetch()}
          style={({ pressed }) => [styles.refreshBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <FlatList
        data={drivers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Stat grid */}
            <View style={styles.statsGrid}>
              <StatCard
                label="Toplam"
                value={drivers.length}
                color={colors.primary}
                colorBg={colors.secondary}
                icon="users"
              />
              <StatCard
                label="Güvenli"
                value={safe}
                color={colors.statusSafe}
                colorBg={colors.statusSafeLight}
                icon="check-circle"
              />
              <StatCard
                label="Uyarı"
                value={warning}
                color={colors.statusWarning}
                colorBg={colors.statusWarningLight}
                icon="alert-triangle"
              />
              <StatCard
                label="Kritik"
                value={critical}
                color={colors.statusCritical}
                colorBg={colors.statusCriticalLight}
                icon="shield"
              />
            </View>

            {/* Yurt dışı bilgi */}
            <View style={[styles.abroadCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="globe" size={15} color={colors.amber} />
              <Text style={[styles.abroadText, { color: colors.foreground }]}>
                Şu an yurt dışında:{' '}
                <Text style={{ color: colors.amber, fontFamily: 'Inter_700Bold' }}>{abroad} sürücü</Text>
              </Text>
            </View>

            {/* Section title */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sürücü Listesi</Text>
              <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{drivers.length} kayıt</Text>
            </View>

            {isLoading && (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Yükleniyor...</Text>
              </View>
            )}

            {isError && (
              <View style={[styles.errorWrap, { backgroundColor: colors.statusCriticalLight, borderColor: colors.statusCritical }]}>
                <Feather name="wifi-off" size={20} color={colors.statusCritical} />
                <Text style={[styles.errorText, { color: colors.statusCritical }]}>
                  Veri alınamadı. Giriş yapmış olduğunuzdan emin olun.
                </Text>
                <Pressable onPress={() => refetch()} style={[styles.retryBtn, { borderColor: colors.statusCritical }]}>
                  <Text style={{ color: colors.statusCritical, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>Tekrar Dene</Text>
                </Pressable>
              </View>
            )}

            {!isLoading && !isError && drivers.length === 0 && (
              <View style={styles.emptyWrap}>
                <Feather name="users" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Sürücü bulunamadı</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => <DriverRow driver={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogo: { width: 36, height: 20 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 1 },
  refreshBtn: { padding: 8 },
  listContent: { padding: 16, gap: 0 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1,
    minWidth: '44%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 26, fontFamily: 'Inter_700Bold', lineHeight: 30 },
  statLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' },
  abroadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  abroadText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  sectionCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  driverSub: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  loadingWrap: { alignItems: 'center', padding: 32, gap: 10 },
  loadingText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  errorWrap: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  emptyWrap: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
