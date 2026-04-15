import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CourierModeSelector from "@/components/CourierModeSelector";
import type { CourierMode } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

// ─── Algerian DZD Pricing Model ─────────────────────────────────────────────
// Based on Yassir Express & local delivery app rates in Algeria
const BASE_FARE_DZD = 150;          // أجرة أساسية
const MIN_FARE_DZD = 250;           // حد أدنى

const RATE_PER_KM: Record<CourierMode, number> = {
  foot:     40,   // مشي
  bicycle:  55,   // دراجة
  escooter: 65,   // سكوتر
  car:      85,   // سيارة
};

const SIZE_MULTIPLIER: Record<string, number> = {
  small:  1.0,   // صغير  (أقل من 1 كغ)
  medium: 1.5,   // متوسط (1–5 كغ)
  large:  2.2,   // كبير  (أكثر من 5 كغ)
};

// الوقت المقدّر (دقيقة/كم)
const MIN_PER_KM: Record<CourierMode, number> = {
  foot: 12, bicycle: 5, escooter: 4, car: 3,
};

function calculatePriceDZD(distanceKm: number, size: string, mode: CourierMode): number {
  const price = (BASE_FARE_DZD + distanceKm * RATE_PER_KM[mode]) * SIZE_MULTIPLIER[size];
  return Math.max(MIN_FARE_DZD, Math.round(price / 10) * 10);
}

// ─── Package Sizes ────────────────────────────────────────────────────────────
const PACKAGE_SIZES = [
  { id: "small" as const,  label: "صغير",   desc: "أقل من 1 كغ\nوثائق، مظاريف",  icon: "package" as const },
  { id: "medium" as const, label: "متوسط",  desc: "1–5 كغ\nعلبة أحذية",         icon: "box" as const },
  { id: "large" as const,  label: "كبير",   desc: "أكثر من 5 كغ\nحقائب تسوق",  icon: "archive" as const },
];

const MODE_LABEL: Record<CourierMode, string> = {
  foot: "مشي", bicycle: "دراجة", escooter: "سكوتر", car: "سيارة",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function NewDeliveryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { courierMode, postDelivery, user } = useApp();

  const [pickupAddress, setPickupAddress]   = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [recipientName, setRecipientName]   = useState("");
  const [packageSize, setPackageSize]       = useState<"small" | "medium" | "large">("small");
  const [selectedMode, setSelectedMode]     = useState<CourierMode>(courierMode);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [errors, setErrors]                 = useState<Record<string, string>>({});

  // مسافة تقديرية عشوائية (1–8 كم) — ستُستبدل بحساب حقيقي لاحقاً
  const previewDistance = 3.5;
  const previewPrice = useMemo(
    () => calculatePriceDZD(previewDistance, packageSize, selectedMode),
    [packageSize, selectedMode]
  );
  const previewTime = Math.round(previewDistance * MIN_PER_KM[selectedMode]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!pickupAddress.trim())  e.pickup    = "عنوان الانطلاق مطلوب";
    if (!dropoffAddress.trim()) e.dropoff   = "عنوان الوجهة مطلوب";
    if (!recipientName.trim())  e.recipient = "اسم المستلم مطلوب";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // مسافة عشوائية حقيقية بين 0.8 و 9 كم
    const distance = +(Math.random() * 8.2 + 0.8).toFixed(1);
    const estimatedMinutes = Math.round(distance * MIN_PER_KM[selectedMode]);
    const earnings = calculatePriceDZD(distance, packageSize, selectedMode);

    try {
      await postDelivery({
        trackingId: `DZ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        status: "pending",
        senderId: user?.id ?? "anonymous",
        senderName: user?.name ?? "مرسل",
        courierId: null,
        courierName: null,
        recipientName,
        packageSize,
        transportMode: selectedMode,
        pickup: {
          address: pickupAddress,
          lat: 36.737 + (Math.random() - 0.5) * 0.05,  // منطقة الجزائر العاصمة
          lng: 3.086  + (Math.random() - 0.5) * 0.05,
        },
        dropoff: {
          address: dropoffAddress,
          lat: 36.737 + (Math.random() - 0.5) * 0.08,
          lng: 3.086  + (Math.random() - 0.5) * 0.08,
        },
        estimatedMinutes,
        distance,
        earnings,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ submit: "فشل إنشاء الطلب. حاول مجدداً." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: Platform.OS === "web" ? 67 : insets.top, borderBottomColor: colors.border }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-right" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.foreground }]}>طلب توصيل جديد</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 54 : insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Price preview card */}
        <View style={[styles.priceCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>السعر التقديري</Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>{previewPrice} دج</Text>
            <Text style={[styles.priceNote, { color: colors.mutedForeground }]}>
              {MODE_LABEL[selectedMode]} • ~{previewTime} دقيقة
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Text style={[styles.priceNote, { color: colors.mutedForeground }]}>الحجم</Text>
            <Text style={[styles.priceSizeText, { color: colors.foreground }]}>
              {PACKAGE_SIZES.find(s => s.id === packageSize)?.label}
            </Text>
            <Text style={[styles.priceNote, { color: colors.mutedForeground }]}>×{SIZE_MULTIPLIER[packageSize]}</Text>
          </View>
        </View>

        {/* Addresses */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>العناوين</Text>
          <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.inputRow}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="عنوان الانطلاق"
                placeholderTextColor={colors.mutedForeground}
                value={pickupAddress}
                onChangeText={setPickupAddress}
                textAlign="right"
              />
            </View>
            {errors.pickup && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.pickup}</Text>}
            <View style={[styles.inputDivider, { backgroundColor: colors.border }]} />
            <View style={styles.inputRow}>
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="عنوان الوجهة"
                placeholderTextColor={colors.mutedForeground}
                value={dropoffAddress}
                onChangeText={setDropoffAddress}
                textAlign="right"
              />
            </View>
            {errors.dropoff && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.dropoff}</Text>}
          </View>
        </View>

        {/* Recipient */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>المستلم</Text>
          <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>اسم المستلم</Text>
            <TextInput
              style={[styles.inputPlain, { color: colors.foreground, borderBottomColor: errors.recipient ? colors.destructive : colors.border }]}
              placeholder="من يستلم الطرد؟"
              placeholderTextColor={colors.mutedForeground}
              value={recipientName}
              onChangeText={setRecipientName}
              textAlign="right"
            />
            {errors.recipient && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.recipient}</Text>}
          </View>
        </View>

        {/* Package Size */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>حجم الطرد</Text>
          <View style={styles.packageRow}>
            {PACKAGE_SIZES.map((size) => {
              const price = calculatePriceDZD(previewDistance, size.id, selectedMode);
              const active = packageSize === size.id;
              return (
                <Pressable
                  key={size.id}
                  style={[
                    styles.packageCard,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setPackageSize(size.id); }}
                >
                  <Feather name={size.icon} size={22} color={active ? "#ffffff" : colors.primary} />
                  <Text style={[styles.packageLabel, { color: active ? "#ffffff" : colors.foreground }]}>
                    {size.label}
                  </Text>
                  <Text style={[styles.packageDesc, { color: active ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>
                    {size.desc}
                  </Text>
                  <Text style={[styles.packagePrice, { color: active ? "rgba(255,255,255,0.9)" : colors.success }]}>
                    ~{price} دج
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {/* Pricing info */}
          <View style={[styles.pricingInfo, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="info" size={12} color={colors.mutedForeground} />
            <Text style={[styles.pricingInfoText, { color: colors.mutedForeground }]}>
              السعر = {BASE_FARE_DZD} دج أساسية + {RATE_PER_KM[selectedMode]} دج/كم × ضريب الحجم. الحد الأدنى {MIN_FARE_DZD} دج.
            </Text>
          </View>
        </View>

        {/* Transport Mode */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>وسيلة التنقل</Text>
          <CourierModeSelector selected={selectedMode} onSelect={setSelectedMode} label="" />
          <View style={[styles.ratesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.ratesTitle, { color: colors.mutedForeground }]}>تعريفة الوسائل (دج/كم)</Text>
            <View style={styles.ratesRow}>
              {(Object.entries(RATE_PER_KM) as [CourierMode, number][]).map(([mode, rate]) => (
                <View
                  key={mode}
                  style={[
                    styles.rateItem,
                    {
                      backgroundColor: selectedMode === mode ? colors.primary + "15" : "transparent",
                      borderColor: selectedMode === mode ? colors.primary + "40" : "transparent",
                    },
                  ]}
                >
                  <Text style={[styles.rateMode, { color: selectedMode === mode ? colors.primary : colors.mutedForeground }]}>
                    {MODE_LABEL[mode]}
                  </Text>
                  <Text style={[styles.rateValue, { color: selectedMode === mode ? colors.primary : colors.foreground }]}>
                    {rate}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Submit error */}
        {errors.submit && (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + "18" }]}>
            <Feather name="alert-circle" size={14} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive, flex: 1 }]}>{errors.submit}</Text>
          </View>
        )}

        {/* Submit */}
        <Pressable
          style={[styles.submitBtn, { backgroundColor: isSubmitting ? colors.mutedForeground : colors.primary }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <><ActivityIndicator color="#ffffff" size="small" /><Text style={styles.submitText}>جاري الإنشاء...</Text></>
          ) : (
            <><Feather name="check" size={18} color="#ffffff" /><Text style={styles.submitText}>تأكيد الطلب • {previewPrice} دج</Text></>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.background, borderBottomWidth: 1 },
    backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    topTitle: { flex: 1, textAlign: "center", fontSize: 16, fontFamily: "Inter_600SemiBold" },
    content: { padding: 20, gap: 20 },
    priceCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
    priceLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 2 },
    priceValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
    priceNote: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
    priceSizeText: { fontSize: 15, fontFamily: "Inter_700Bold" },
    section: { gap: 10 },
    sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    inputGroup: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
    inputRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    input: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
    inputDivider: { height: 1, marginHorizontal: 14 },
    inputCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
    inputLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 4 },
    inputPlain: { fontSize: 14, fontFamily: "Inter_400Regular", paddingVertical: 6, borderBottomWidth: 1 },
    packageRow: { flexDirection: "row", gap: 10 },
    packageCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1.5, gap: 3 },
    packageLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 4 },
    packageDesc: { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center" },
    packagePrice: { fontSize: 12, fontFamily: "Inter_700Bold", marginTop: 2 },
    pricingInfo: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 10, borderWidth: 1, padding: 10 },
    pricingInfoText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
    ratesCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 8 },
    ratesTitle: { fontSize: 11, fontFamily: "Inter_500Medium" },
    ratesRow: { flexDirection: "row", gap: 6 },
    rateItem: { flex: 1, alignItems: "center", borderRadius: 8, borderWidth: 1, paddingVertical: 6 },
    rateMode: { fontSize: 10, fontFamily: "Inter_500Medium" },
    rateValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
    errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 12 },
    errorText: { fontSize: 11, fontFamily: "Inter_400Regular", paddingHorizontal: 4, paddingBottom: 4 },
    submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, borderRadius: 14, marginTop: 8 },
    submitText: { color: "#ffffff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  });
}
