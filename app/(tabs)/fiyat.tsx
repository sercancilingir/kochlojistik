import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
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
import { useColors } from '@/hooks/useColors';

type Route = 'AVRUPA' | 'ASYA' | 'YURTİÇİ';
type CargoType = 'STANDART' | 'FRİGO' | 'ADR' | 'TAŞIT';

interface PriceResult {
  baseRate: number;
  fuelSurcharge: number;
  cargoSurcharge: number;
  total: number;
  currency: 'EUR' | 'TRY';
}

const ROUTE_BASE: Record<Route, number> = {
  AVRUPA: 2.8,   // EUR/km
  ASYA: 3.2,     // EUR/km
  YURTİÇİ: 0.12, // EUR/km
};

const CARGO_MULT: Record<CargoType, number> = {
  STANDART: 1.0,
  FRİGO: 1.35,
  ADR: 1.5,
  TAŞIT: 1.2,
};

const FUEL_SURCHARGE = 0.18; // 18% fuel surcharge

function calcPrice(route: Route, cargo: CargoType, km: number): PriceResult {
  const base = ROUTE_BASE[route];
  const baseRate = base * km * CARGO_MULT[cargo];
  const fuelSurcharge = baseRate * FUEL_SURCHARGE;
  const cargoSurcharge = cargo !== 'STANDART' ? baseRate * 0.05 : 0;
  const total = baseRate + fuelSurcharge + cargoSurcharge;
  const currency = route === 'YURTİÇİ' ? 'EUR' : 'EUR';
  return { baseRate, fuelSurcharge, cargoSurcharge, total, currency };
}

function SegmentedControl<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { key: T; label: string; icon?: React.ComponentProps<typeof Feather>['name'] }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      {options.map((o) => {
        const active = o.key === selected;
        return (
          <Pressable
            key={o.key}
            onPress={() => { Haptics.selectionAsync(); onSelect(o.key); }}
            style={[
              styles.segmentBtn,
              active && { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {o.icon && <Feather name={o.icon} size={12} color={active ? colors.primary : colors.mutedForeground} />}
            <Text style={[
              styles.segmentText,
              { color: active ? colors.primary : colors.mutedForeground },
            ]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const ROUTE_OPTIONS: { key: Route; label: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { key: 'AVRUPA', label: 'Avrupa', icon: 'globe' },
  { key: 'ASYA', label: 'Asya', icon: 'map' },
  { key: 'YURTİÇİ', label: 'Yurtiçi', icon: 'home' },
];

const CARGO_OPTIONS: { key: CargoType; label: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { key: 'STANDART', label: 'Standart', icon: 'box' },
  { key: 'FRİGO', label: 'Frigo', icon: 'thermometer' },
  { key: 'ADR', label: 'ADR', icon: 'alert-triangle' },
  { key: 'TAŞIT', label: 'Taşıt', icon: 'truck' },
];

function PriceRow({ label, value, currency, highlight }: { label: string; value: number; currency: string; highlight?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.priceRow, highlight && { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 12 }]}>
      <Text style={[styles.priceLabel, { color: highlight ? colors.foreground : colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.priceValue, { color: highlight ? colors.amber : colors.foreground }, highlight && styles.priceValueLarge]}>
        {value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
      </Text>
    </View>
  );
}

export default function FiyatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [route, setRoute] = useState<Route>('AVRUPA');
  const [cargo, setCargo] = useState<CargoType>('STANDART');
  const [kmText, setKmText] = useState('');
  const [result, setResult] = useState<PriceResult | null>(null);

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const handleCalc = () => {
    const km = parseFloat(kmText.replace(',', '.'));
    if (!km || km <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setResult(calcPrice(route, cargo, km));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Fiyat Oluşturma</Text>
        <View style={[styles.betaBadge, { backgroundColor: colors.amberMuted }]}>
          <Text style={[styles.betaText, { color: colors.amber }]}>TAHMİNİ</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Route */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionLabel}>
              <Feather name="map-pin" size={14} color={colors.amber} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Güzergah</Text>
            </View>
            <SegmentedControl options={ROUTE_OPTIONS} selected={route} onSelect={setRoute} />
          </View>

          {/* Cargo type */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionLabel}>
              <Feather name="package" size={14} color={colors.amber} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Yük Tipi</Text>
            </View>
            <SegmentedControl options={CARGO_OPTIONS} selected={cargo} onSelect={setCargo} />
          </View>

          {/* Distance input */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionLabel}>
              <Feather name="navigation" size={14} color={colors.amber} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mesafe</Text>
            </View>
            <View style={[styles.kmInput, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TextInput
                style={[styles.kmText, { color: colors.foreground }]}
                value={kmText}
                onChangeText={setKmText}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.kmUnit, { color: colors.mutedForeground }]}>km</Text>
            </View>
          </View>

          {/* Rate info */}
          <View style={[styles.infoRow, { backgroundColor: colors.amberMuted, borderColor: `${colors.amber}33` }]}>
            <Feather name="info" size={12} color={colors.amber} />
            <Text style={[styles.infoText, { color: colors.amber }]}>
              Baz oran: {ROUTE_BASE[route]} EUR/km · Yakıt: %{(FUEL_SURCHARGE * 100).toFixed(0)} · Yük çarpanı: {CARGO_MULT[cargo]}x
            </Text>
          </View>

          {/* Calculate button */}
          <Pressable
            onPress={handleCalc}
            disabled={!kmText.trim()}
            style={({ pressed }) => [{ opacity: pressed || !kmText.trim() ? 0.6 : 1 }]}
          >
            <LinearGradient
              colors={['#1e3a5f', '#1a3154']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.calcBtn, { borderColor: colors.primary }]}
            >
              <Feather name="hash" size={18} color="#fff" />
              <Text style={styles.calcBtnText}>Fiyat Hesapla</Text>
            </LinearGradient>
          </Pressable>

          {/* Result */}
          {result && (
            <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.resultTitle, { color: colors.foreground }]}>Fiyat Tahmini</Text>
              <PriceRow label="Baz nakliye ücreti" value={result.baseRate} currency={result.currency} />
              <PriceRow label="Yakıt ek ücreti" value={result.fuelSurcharge} currency={result.currency} />
              {result.cargoSurcharge > 0 && (
                <PriceRow label="Yük ek ücreti" value={result.cargoSurcharge} currency={result.currency} />
              )}
              <PriceRow label="TOPLAM TUTAR" value={result.total} currency={result.currency} highlight />
              <View style={[styles.disclaimer, { borderTopColor: colors.border }]}>
                <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
                  * Bu fiyat tahmini olup ağırlık, özel koşullar ve piyasa döviz kuru farkına göre değişebilir.
                  Kesin teklif için web uygulamasını kullanın.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  betaBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  betaText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  content: { padding: 16, gap: 12 },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  segmented: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  kmInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 50,
    paddingHorizontal: 16,
  },
  kmText: { flex: 1, fontSize: 20, fontFamily: 'Inter_700Bold' },
  kmUnit: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoText: { fontSize: 11, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 16 },
  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
  },
  calcBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  resultCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 0,
  },
  resultTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  priceLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  priceValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  priceValueLarge: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  disclaimer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  disclaimerText: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
});
