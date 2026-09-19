import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { fetchSiberView } from '@/lib/api';

type AlertLv = 'critical' | 'warning' | 'ok';

interface SeferRow {
  id: string;
  plaka: string;
  surucu: string;
  toplamGun: number | null;
  durum: AlertLv;
  siparisDurumu: string;
  guzergah: string;
}

function parseDateParts(v: unknown): { y: number; m: number; d: number } | null {
  if (!v) return null;
  const s = String(v);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return { y: parseInt(m[1] ?? '0', 10), m: parseInt(m[2] ?? '0', 10), d: parseInt(m[3] ?? '0', 10) };
}

function dateDiffOrNow(a: unknown, b: unknown): number | null {
  const pa = parseDateParts(a);
  if (!pa) return null;
  const da = new Date(pa.y, pa.m - 1, pa.d);
  if (b != null && b !== '') {
    const pb = parseDateParts(b);
    if (!pb) return null;
    const db = new Date(pb.y, pb.m - 1, pb.d);
    const diff = Math.round((db.getTime() - da.getTime()) / 86400000);
    return diff >= 0 && diff <= 730 ? diff : null;
  }
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const diff = Math.round((now.getTime() - da.getTime()) / 86400000);
  return diff >= 0 && diff <= 730 ? diff : null;
}

function row2sefer(r: Record<string, unknown>, idx: number): SeferRow {
  // Try to find plate column
  const plaka = String(
    r['plakano'] ?? r['plaka'] ?? r['araciplakano'] ?? r['PLAKANO'] ?? '—'
  );
  const surucu = String(
    r['surucuad'] ?? r['surucu'] ?? r['SURUCUAD'] ?? r['driver'] ?? '—'
  );
  const hazirolma = r['arachazirolmatarih'] ?? r['hazirolmatarih'];
  const yükleme = r['kesinyuklemetarih'];
  const bitis = r['bitistarihi'] ?? r['tamamlanmatarihi'];

  const toplamGun = dateDiffOrNow(hazirolma ?? yükleme, bitis ?? null);

  let durum: AlertLv = 'ok';
  if (toplamGun != null) {
    if (toplamGun >= 30) durum = 'critical';
    else if (toplamGun >= 20) durum = 'warning';
  }

  const siparisDurumu = String(r['siparisstatus'] ?? r['durum'] ?? r['status'] ?? '');
  const guzergah = String(r['guzergah'] ?? r['rota'] ?? r['destination'] ?? '');

  return { id: `${plaka}-${idx}`, plaka, surucu, toplamGun, durum, siparisDurumu, guzergah };
}

function useSeferData() {
  return useQuery<SeferRow[]>({
    queryKey: ['sefer-yuksure'],
    queryFn: async () => {
      const { rows } = await fetchSiberView('koch_seferyuksure');
      return rows.map((r, i) => row2sefer(r, i));
    },
    staleTime: 120000,
    retry: 1,
  });
}

type FilterType = 'all' | 'critical' | 'warning' | 'ok';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'critical', label: 'Kritik' },
  { key: 'warning', label: 'Uyarı' },
  { key: 'ok', label: 'Normal' },
];

function AlertBadge({ level }: { level: AlertLv }) {
  const colors = useColors();
  const cfg = {
    critical: { bg: colors.statusCriticalLight, text: colors.statusCritical, label: 'KRİTİK' },
    warning: { bg: colors.statusWarningLight, text: colors.statusWarning, label: 'UYARI' },
    ok: { bg: colors.statusSafeLight, text: colors.statusSafe, label: 'NORMAL' },
  }[level];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

function SeferItem({ item }: { item: SeferRow }) {
  const colors = useColors();
  return (
    <View style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.rowHeader}>
        <View style={[styles.plateWrap, { backgroundColor: colors.secondary }]}>
          <Feather name="truck" size={12} color={colors.primary} />
          <Text style={[styles.plateText, { color: colors.foreground }]}>{item.plaka}</Text>
        </View>
        <AlertBadge level={item.durum} />
      </View>
      <Text style={[styles.rowDriver, { color: colors.foreground }]} numberOfLines={1}>
        {item.surucu}
      </Text>
      {item.guzergah ? (
        <View style={styles.rowMeta}>
          <Feather name="map-pin" size={11} color={colors.mutedForeground} />
          <Text style={[styles.rowMetaText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.guzergah}
          </Text>
        </View>
      ) : null}
      <View style={styles.rowFooter}>
        <View style={styles.rowMeta}>
          <Feather name="clock" size={11} color={colors.mutedForeground} />
          <Text style={[styles.rowMetaText, { color: colors.mutedForeground }]}>
            {item.toplamGun != null ? `${item.toplamGun} gün` : 'Süre bilinmiyor'}
          </Text>
        </View>
        {item.siparisDurumu ? (
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>{item.siparisDurumu}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function SeferScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data = [], isLoading, isError, refetch, isFetching } = useSeferData();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let rows = data;
    if (filter !== 'all') rows = rows.filter((r) => r.durum === filter);
    if (search.trim()) {
      const q = search.trim().toUpperCase();
      rows = rows.filter((r) =>
        r.plaka.toUpperCase().includes(q) || r.surucu.toUpperCase().includes(q)
      );
    }
    return rows;
  }, [data, filter, search]);

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const criticalCount = data.filter((r) => r.durum === 'critical').length;
  const warningCount = data.filter((r) => r.durum === 'warning').length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Sefer Süre Takip</Text>
          <View style={styles.headerMeta}>
            {criticalCount > 0 && (
              <View style={[styles.miniPill, { backgroundColor: colors.statusCriticalLight }]}>
                <Text style={[styles.miniPillText, { color: colors.statusCritical }]}>{criticalCount} kritik</Text>
              </View>
            )}
            {warningCount > 0 && (
              <View style={[styles.miniPill, { backgroundColor: colors.statusWarningLight }]}>
                <Text style={[styles.miniPillText, { color: colors.statusWarning }]}>{warningCount} uyarı</Text>
              </View>
            )}
          </View>
        </View>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); refetch(); }}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
        >
          <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInput, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Feather name="search" size={14} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchText, { color: colors.foreground }]}
            placeholder="Plaka veya sürücü ara..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="characters"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => { Haptics.selectionAsync(); setFilter(f.key); }}
              style={[
                styles.filterTab,
                active && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Text style={[
                styles.filterTabText,
                { color: active ? colors.primary : colors.mutedForeground },
              ]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading && (
        <View style={styles.centerWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Sefer verileri yükleniyor...</Text>
        </View>
      )}

      {isError && !isLoading && (
        <View style={styles.centerWrap}>
          <Feather name="wifi-off" size={28} color={colors.statusCritical} />
          <Text style={[styles.errorText, { color: colors.statusCritical }]}>Veri alınamadı</Text>
          <Text style={[styles.errorSub, { color: colors.mutedForeground }]}>
            Siber Bridge bağlantısı kontrol edin
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Tekrar Dene</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
          renderItem={({ item }) => <SeferItem item={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.centerWrap}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {search ? 'Sonuç bulunamadı' : 'Aktif sefer yok'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
  miniPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  miniPillText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  filterRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  listContent: { padding: 16 },
  rowCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  plateText: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  badgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  rowDriver: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowMetaText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  rowFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  loadingText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  errorText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  errorSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
