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

type AracTip = 'cekici' | 'dorse';

interface AracRow {
  id: string;
  plaka: string;
  tip: AracTip;
  marka: string;
  durum: string;
  surucuAd: string;
  bagliplaka: string;
  hat: string;
}

function normMarka(m: unknown): string {
  const u = (String(m ?? '')).toUpperCase().replace(/[\s\-.]/g, '');
  if (u.includes('MERCEDES')) return 'Mercedes-Benz';
  if (u.includes('SCANIA')) return 'Scania';
  if (u.includes('IVECO')) return 'IVECO';
  if (u.includes('RENAULT')) return 'Renault';
  if (u.includes('DAF')) return 'DAF';
  if (u.includes('MAN')) return 'MAN';
  if (u.includes('VOLVO')) return 'Volvo';
  if (u.includes('KRONE')) return 'KRONE';
  if (u.includes('TIRSAN') || u.includes('TİRSAN')) return 'TİRSAN';
  if (u.includes('SCHMITZ')) return 'Schmitz';
  if (u.includes('KASSBOHR')) return 'Kassboher';
  return String(m ?? '—') || '—';
}

function normHat(dept: unknown): string {
  const u = String(dept ?? '').toUpperCase();
  if (u.includes('AVRUPA')) return 'AVRUPA';
  if (u.includes('ASYA')) return 'ASYA';
  if (u.includes('YURT')) return 'YURTİÇİ';
  return 'DİĞER';
}

function rows2Cekici(rows: Record<string, unknown>[]): AracRow[] {
  return rows.map((r, i) => ({
    id: `c-${i}`,
    plaka: String(r['plakano'] ?? r['PLAKANO'] ?? '—'),
    tip: 'cekici' as const,
    marka: normMarka(r['marka']),
    durum: String(r['aracdurumad'] ?? r['durum'] ?? '—'),
    surucuAd: String(r['surucuad'] ?? r['surucu'] ?? '—'),
    bagliplaka: String(r['bagliplakano'] ?? '—'),
    hat: normHat(r['departmanad']),
  }));
}

function rows2Dorse(rows: Record<string, unknown>[]): AracRow[] {
  return rows.map((r, i) => ({
    id: `d-${i}`,
    plaka: String(r['plakano'] ?? r['PLAKANO'] ?? '—'),
    tip: 'dorse' as const,
    marka: normMarka(r['marka']),
    durum: String(r['aracdurumad'] ?? r['durum'] ?? '—'),
    surucuAd: String(r['surucuad'] ?? r['surucu'] ?? '—'),
    bagliplaka: String(r['bagliplakano'] ?? '—'),
    hat: normHat(r['departmanad'] ?? r['aractip']),
  }));
}

function useAracData() {
  const cekici = useQuery<AracRow[]>({
    queryKey: ['arac-cekici'],
    queryFn: async () => {
      const { rows } = await fetchSiberView('koch_cekici');
      return rows2Cekici(rows);
    },
    staleTime: 180000,
    retry: 1,
  });
  const dorse = useQuery<AracRow[]>({
    queryKey: ['arac-dorse'],
    queryFn: async () => {
      const { rows } = await fetchSiberView('koch_romorksayi');
      return rows2Dorse(rows);
    },
    staleTime: 180000,
    retry: 1,
  });
  return { cekici, dorse };
}

function DurumBadge({ durum }: { durum: string }) {
  const colors = useColors();
  const u = durum.toUpperCase();
  let bg = colors.statusSafeLight;
  let text = colors.statusSafe;
  if (u.includes('AKTİF') || u.includes('AKTIF') || u.includes('SEFERD')) {
    bg = colors.statusWarningLight; text = colors.statusWarning;
  } else if (u.includes('ARIZA') || u.includes('BAKIM') || u.includes('PASIF') || u.includes('PASİF')) {
    bg = colors.statusCriticalLight; text = colors.statusCritical;
  }
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text }]} numberOfLines={1}>{durum}</Text>
    </View>
  );
}

function HatBadge({ hat }: { hat: string }) {
  const colors = useColors();
  const colorMap: Record<string, string> = {
    AVRUPA: colors.chartBlue,
    ASYA: colors.chartGreen,
    YURTİÇİ: colors.chartOrange,
    DİĞER: colors.mutedForeground,
  };
  const c = colorMap[hat] ?? colors.mutedForeground;
  return (
    <View style={[styles.hatBadge, { borderColor: `${c}44`, backgroundColor: `${c}18` }]}>
      <Text style={[styles.hatBadgeText, { color: c }]}>{hat}</Text>
    </View>
  );
}

function AracItem({ item }: { item: AracRow }) {
  const colors = useColors();
  return (
    <View style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.rowTop}>
        <View style={[styles.plateWrap, { backgroundColor: colors.secondary }]}>
          <Feather name={item.tip === 'cekici' ? 'truck' : 'box'} size={11} color={colors.primary} />
          <Text style={[styles.plateText, { color: colors.foreground }]}>{item.plaka}</Text>
        </View>
        <View style={styles.badgeGroup}>
          <HatBadge hat={item.hat} />
          <DurumBadge durum={item.durum} />
        </View>
      </View>
      <View style={styles.rowBody}>
        <View style={styles.metaItem}>
          <Feather name="award" size={11} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.marka}</Text>
        </View>
        {item.surucuAd !== '—' && (
          <View style={styles.metaItem}>
            <Feather name="user" size={11} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>{item.surucuAd}</Text>
          </View>
        )}
        {item.bagliplaka !== '—' && (
          <View style={styles.metaItem}>
            <Feather name="link" size={11} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.bagliplaka}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function AracScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cekici, dorse } = useAracData();
  const [activeTab, setActiveTab] = useState<AracTip>('cekici');
  const [search, setSearch] = useState('');

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const activeQuery = activeTab === 'cekici' ? cekici : dorse;
  const allData = activeQuery.data ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return allData;
    const q = search.trim().toUpperCase();
    return allData.filter(
      (r) =>
        r.plaka.toUpperCase().includes(q) ||
        r.marka.toUpperCase().includes(q) ||
        r.surucuAd.toUpperCase().includes(q)
    );
  }, [allData, search]);

  const refetchAll = () => {
    cekici.refetch();
    dorse.refetch();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Araç Envanter</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {(cekici.data?.length ?? 0)} çekici · {(dorse.data?.length ?? 0)} dorse
          </Text>
        </View>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); refetchAll(); }}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
        >
          <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Tab switcher */}
      <View style={[styles.tabRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(['cekici', 'dorse'] as AracTip[]).map((t) => {
          const active = t === activeTab;
          const label = t === 'cekici' ? 'Çekici' : 'Dorse/Römork';
          const count = t === 'cekici' ? (cekici.data?.length ?? 0) : (dorse.data?.length ?? 0);
          return (
            <Pressable
              key={t}
              onPress={() => { Haptics.selectionAsync(); setActiveTab(t); }}
              style={[
                styles.tabBtn,
                active && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Feather name={t === 'cekici' ? 'truck' : 'box'} size={13} color={active ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.tabBtnText, { color: active ? colors.primary : colors.mutedForeground }]}>
                {label}
              </Text>
              <View style={[styles.countPill, { backgroundColor: active ? `${colors.primary}22` : colors.secondary }]}>
                <Text style={[styles.countPillText, { color: active ? colors.primary : colors.mutedForeground }]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInput, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Feather name="search" size={14} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchText, { color: colors.foreground }]}
            placeholder="Plaka, marka veya sürücü ara..."
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

      {activeQuery.isLoading && (
        <View style={styles.centerWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.centerText, { color: colors.mutedForeground }]}>Araçlar yükleniyor...</Text>
        </View>
      )}

      {activeQuery.isError && !activeQuery.isLoading && (
        <View style={styles.centerWrap}>
          <Feather name="wifi-off" size={28} color={colors.statusCritical} />
          <Text style={[styles.errorText, { color: colors.statusCritical }]}>Veri alınamadı</Text>
          <Pressable
            onPress={refetchAll}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Tekrar Dene</Text>
          </Pressable>
        </View>
      )}

      {!activeQuery.isLoading && !activeQuery.isError && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl
              refreshing={activeQuery.isFetching && !activeQuery.isLoading}
              onRefresh={refetchAll}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => <AracItem item={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.centerWrap}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[styles.centerText, { color: colors.mutedForeground }]}>
                {search ? 'Sonuç bulunamadı' : 'Kayıt yok'}
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
  headerSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  countPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countPillText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  searchWrap: {
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
  listContent: { padding: 16 },
  rowCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  plateText: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  badgeGroup: { flexDirection: 'row', gap: 6, alignItems: 'center', flexShrink: 1 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, maxWidth: 120 },
  badgeText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  hatBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  hatBadgeText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  rowBody: { gap: 5 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  centerText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  errorText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 4 },
});
