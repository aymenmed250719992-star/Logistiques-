import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const ND = Platform.OS !== "web";

const CUSTOMER_FEATURES = [
  { icon: "clock-fast",       label: "توصيل سريع",     desc: "في أقل من 60 دقيقة" },
  { icon: "google-maps",      label: "تتبع مباشر",      desc: "تابع طردك لحظة بلحظة" },
  { icon: "shield-check",     label: "ضمان الأمان",     desc: "طردك في أيد أمينة" },
  { icon: "currency-usd-off", label: "أسعار شفافة",    desc: "لا رسوم خفية بالدينار" },
];

const COURIER_FEATURES = [
  { icon: "cash-multiple",  label: "أرباح يومية",    desc: "حتى 5000 دج في اليوم" },
  { icon: "calendar-check", label: "عمل مرن",         desc: "أنت تختار أوقاتك" },
  { icon: "bike-fast",      label: "كل وسيلة تنقل",  desc: "مشي، دراجة، سيارة" },
  { icon: "chart-line",     label: "تتابع أرباحك",   desc: "إحصائيات لحظية" },
];

const STATS = [
  { value: "< 60", unit: "دقيقة", label: "وقت التوصيل" },
  { value: "24/7",  unit: "",      label: "خدمة مستمرة" },
  { value: "100%",  unit: "",      label: "شفافية التسعير" },
];

function AnimatedLogo({ colors }: { colors: ReturnType<typeof useColors> }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse,  { toValue: 1.07, duration: 1100, useNativeDriver: ND }),
        Animated.timing(pulse,  { toValue: 1,    duration: 1100, useNativeDriver: ND }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -7, duration: 1500, useNativeDriver: ND }),
        Animated.timing(floatY, { toValue: 0,  duration: 1500, useNativeDriver: ND }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.logoBox,
        { backgroundColor: colors.primary },
        { transform: [{ scale: pulse }, { translateY: floatY }] },
      ]}
    >
      <MaterialCommunityIcons name="package-variant-closed" size={52} color="#fff" />
    </Animated.View>
  );
}

function FeatureChip({
  icon, label, desc, accent, colors,
}: {
  icon: string; label: string; desc: string; accent: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.chipIcon, { backgroundColor: accent + "18" }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.chipLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.chipDesc,  { color: colors.mutedForeground }]}>{desc}</Text>
      </View>
    </View>
  );
}

function SectionHeader({
  icon, title, accent, colors,
}: {
  icon: string; title: string; accent: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: accent + "18" }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={accent} />
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

export default function WelcomeScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 600, useNativeDriver: ND }),
      Animated.timing(slideUp, { toValue: 0, duration: 600, useNativeDriver: ND }),
    ]).start();
  }, []);

  const topPad = Platform.OS === "web" ? 24 : insets.top + 8;
  const botPad = Platform.OS === "web" ? 32 : insets.bottom + 16;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad + 110 }]}
      >
        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }], gap: 24 }}>

          {/* ── Hero ─── */}
          <View style={styles.hero}>
            <AnimatedLogo colors={colors} />
            <Text style={[styles.appName, { color: colors.foreground }]}>منصة التوصيل</Text>
            <Text style={[styles.tagline, { color: colors.primary }]}>وصّل أقرب، واربح أكثر</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              المنصة الأولى للتوصيل المحلي السريع بالجزائر —{"\n"}
              تربط العملاء بعمال التوصيل في دقائق
            </Text>
          </View>

          {/* ── Stats ─── */}
          <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {STATS.map((s, i) => (
              <React.Fragment key={s.label}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {s.value}{s.unit ? <Text style={[styles.statUnit, { color: colors.mutedForeground }]}> {s.unit}</Text> : null}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
                {i < STATS.length - 1 && (
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* ── Customers ─── */}
          <View style={styles.section}>
            <SectionHeader icon="account-group" title="للعملاء — أرسل طردك بسهولة" accent={colors.primary} colors={colors} />
            {CUSTOMER_FEATURES.map((f) => (
              <FeatureChip key={f.icon} {...f} accent={colors.primary} colors={colors} />
            ))}
          </View>

          {/* ── Couriers ─── */}
          <View style={styles.section}>
            <SectionHeader icon="bike" title="للعمال — اكسب دخلاً إضافياً" accent={colors.accent} colors={colors} />
            {COURIER_FEATURES.map((f) => (
              <FeatureChip key={f.icon} {...f} accent={colors.accent} colors={colors} />
            ))}
          </View>

          {/* ── Testimonial ─── */}
          <View style={[styles.testimonial, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "28" }]}>
            <MaterialCommunityIcons name="format-quote-open" size={28} color={colors.primary + "55"} />
            <Text style={[styles.testimonialText, { color: colors.foreground }]}>
              وصّلت أكثر من 20 طرداً في أسبوع واحد وربحت أكثر من 8000 دج. المنصة سهلة جداً ومريحة!
            </Text>
            <View style={styles.testimonialAuthor}>
              <View style={[styles.testimonialAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.testimonialInitial}>ع</Text>
              </View>
              <View>
                <Text style={[styles.testimonialName, { color: colors.foreground }]}>عمر م.</Text>
                <Text style={[styles.testimonialRole, { color: colors.mutedForeground }]}>عامل توصيل — الجزائر العاصمة</Text>
              </View>
            </View>
          </View>

          {/* ── How it works ─── */}
          <View style={styles.section}>
            <SectionHeader icon="lightning-bolt" title="كيف يعمل التطبيق؟" accent={colors.warning} colors={colors} />
            {[
              { num: "١", text: "سجّل حسابك كعميل أو عامل توصيل" },
              { num: "٢", text: "العميل ينشر طلب توصيل مع العنوان والسعر بالدينار" },
              { num: "٣", text: "عامل التوصيل يقبل ويصل لك في أقل من ساعة" },
            ].map((step) => (
              <View key={step.num} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumText}>{step.num}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.foreground }]}>{step.text}</Text>
              </View>
            ))}
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── Fixed CTA ─── */}
      <View style={[styles.ctaBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: botPad }]}>
        <Pressable
          style={[styles.ctaPrimary, { backgroundColor: colors.primary }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/auth/register"); }}
        >
          <Feather name="user-plus" size={18} color="#fff" />
          <Text style={styles.ctaPrimaryText}>إنشاء حساب مجاني</Text>
        </Pressable>

        <Pressable
          style={[styles.ctaSecondary, { borderColor: colors.border }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/auth/login"); }}
        >
          <Feather name="log-in" size={18} color={colors.primary} />
          <Text style={[styles.ctaSecondaryText, { color: colors.primary }]}>لدي حساب — تسجيل الدخول</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  logoBox: {
    width: 100, height: 100, borderRadius: 26,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#1a6ef5", shadowOpacity: 0.4,
    shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },

  hero:     { alignItems: "center", gap: 12, paddingTop: 12, paddingBottom: 4 },
  appName:  { fontSize: 30, fontFamily: "Inter_700Bold",    letterSpacing: -0.5 },
  tagline:  { fontSize: 19, fontFamily: "Inter_700Bold",    letterSpacing: -0.2 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },

  statsBar:    { flexDirection: "row", borderRadius: 18, borderWidth: 1, padding: 16, alignItems: "center" },
  statItem:    { flex: 1, alignItems: "center", gap: 3 },
  statValue:   { fontSize: 20, fontFamily: "Inter_700Bold" },
  statUnit:    { fontSize: 11, fontFamily: "Inter_400Regular" },
  statLabel:   { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center" },
  statDivider: { width: 1, height: 34, marginHorizontal: 4 },

  section:        { gap: 10 },
  sectionHeader:  { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle:   { fontSize: 14, fontFamily: "Inter_700Bold" },

  chip:     { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 14, borderWidth: 1, padding: 14 },
  chipIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  chipLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  chipDesc:  { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },

  testimonial:       { borderRadius: 18, borderWidth: 1, padding: 18, gap: 10 },
  testimonialText:   { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, textAlign: "right" },
  testimonialAuthor: { flexDirection: "row", alignItems: "center", gap: 10 },
  testimonialAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  testimonialInitial: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  testimonialName:   { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  testimonialRole:   { fontSize: 11, fontFamily: "Inter_400Regular" },

  stepRow:    { flexDirection: "row", alignItems: "center", gap: 12 },
  stepNum:    { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  stepText:   { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },

  ctaBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12, gap: 10,
  },
  ctaPrimary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, padding: 16, borderRadius: 14,
  },
  ctaPrimaryText:   { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  ctaSecondary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, padding: 13, borderRadius: 14, borderWidth: 1,
  },
  ctaSecondaryText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
