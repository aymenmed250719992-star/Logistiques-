import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import type { FirestoreDelivery } from "@/services/firestoreService";
import { startLocationTracking, stopLocationTracking } from "@/services/locationService";
import { optimizeRouteByDeliveryId } from "@/services/geminiService";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import CourierModeSelector from "./CourierModeSelector";

const MODE_LABELS: Record<string, string> = {
  foot: "سيراً على الأقدام",
  bicycle: "دراجة هوائية",
  escooter: "سكوتر",
  car: "سيارة",
};

interface JobCardProps {
  job: FirestoreDelivery;
  onAccept: () => Promise<void>;
  colors: ReturnType<typeof useColors>;
}

function JobCard({ job, onAccept, colors }: JobCardProps) {
  const scale = useSharedValue(1);
  const [accepting, setAccepting] = useState(false);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleAccept = async () => {
    setAccepting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await onAccept();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Animated.View
      style={[animStyle, { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
        <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{job.trackingId}</Text>
        <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: colors.success }}>${job.earnings.toFixed(2)}</Text>
      </View>
      <View style={{ gap: 6, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
          <Text style={{ fontSize: 12, color: colors.foreground, fontFamily: "Inter_400Regular", flex: 1 }} numberOfLines={1}>
            {job.pickup.address}
          </Text>
        </View>
        <View style={{ width: 2, height: 8, backgroundColor: colors.border, marginLeft: 3 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
          <Text style={{ fontSize: 12, color: colors.foreground, fontFamily: "Inter_400Regular", flex: 1 }} numberOfLines={1}>
            {job.dropoff.address}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>{job.distance} كم</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Feather name="clock" size={12} color={colors.mutedForeground} />
          <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>{job.estimatedMinutes} دقيقة</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Feather name="package" size={12} color={colors.mutedForeground} />
          <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
            {job.packageSize === "small" ? "صغير" : job.packageSize === "medium" ? "متوسط" : "كبير"}
          </Text>
        </View>
      </View>
      <Pressable
        style={{ backgroundColor: accepting ? colors.mutedForeground : colors.primary, borderRadius: 10, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
        onPress={handleAccept}
        disabled={accepting}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        {accepting
          ? <ActivityIndicator color="#fff" size="small" />
          : <><Feather name="check-circle" size={15} color="#fff" /><Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>قبول الطلب</Text></>
        }
      </Pressable>
    </Animated.View>
  );
}

interface ActiveJobCardProps {
  job: FirestoreDelivery;
  colors: ReturnType<typeof useColors>;
  onUpdateStatus: (status: "delivered" | "cancelled") => void;
  courierId: string;
}

function ActiveJobCard({ job, colors, onUpdateStatus, courierId }: ActiveJobCardProps) {
  const [strategy, setStrategy] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const fetchStrategy = async () => {
    if (!job.id) return;
    setLoadingAI(true);
    try {
      const result = await optimizeRouteByDeliveryId(job.id);
      setStrategy(result.strategy);
    } catch {
      setStrategy("خذ أقصر طريق متاح للوصول إلى الوجهة.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <View style={{ backgroundColor: colors.primary + "12", borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: colors.primary, gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />
        <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: colors.foreground, flex: 1 }}>توصيل نشط</Text>
        <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.primary }}>{job.trackingId}</Text>
      </View>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }} numberOfLines={1}>
          الاستلام: {job.pickup.address}
        </Text>
        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }} numberOfLines={1}>
          التسليم: {job.dropoff.address}
        </Text>
        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
          إلى: {job.recipientName}
        </Text>
      </View>

      {strategy ? (
        <View style={{ backgroundColor: colors.secondary, borderRadius: 10, padding: 12, flexDirection: "row", gap: 8 }}>
          <MaterialCommunityIcons name="robot-excited-outline" size={16} color={colors.primary} />
          <Text style={{ fontSize: 12, color: colors.foreground, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 }}>{strategy}</Text>
        </View>
      ) : (
        <Pressable
          style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.secondary, borderRadius: 10, padding: 12 }}
          onPress={fetchStrategy}
          disabled={loadingAI}
        >
          {loadingAI
            ? <><ActivityIndicator size="small" color={colors.primary} /><Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>جاري تحليل المسار بالذكاء الاصطناعي...</Text></>
            : <><MaterialCommunityIcons name="robot-excited-outline" size={16} color={colors.primary} /><Text style={{ fontSize: 12, color: colors.primary, fontFamily: "Inter_600SemiBold" }}>اقتراح أفضل مسار بالذكاء الاصطناعي</Text></>
          }
        </Pressable>
      )}

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          style={{ flex: 1, backgroundColor: colors.success, borderRadius: 10, padding: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
          onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onUpdateStatus("delivered"); }}
        >
          <Feather name="check" size={14} color="#fff" />
          <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>تم التسليم</Text>
        </Pressable>
        <Pressable
          style={{ flex: 1, backgroundColor: colors.card, borderRadius: 10, padding: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: colors.border }}
          onPress={() => router.push(`/delivery/${job.id}`)}
        >
          <Feather name="map-pin" size={14} color={colors.foreground} />
          <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>التفاصيل</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CourierDashboard() {
  const colors = useColors();
  const { currentUser } = useAuth();
  const { user, deliveries, availableJobs, activeDelivery, courierMode, setCourierMode, acceptJob, updateStatus } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const trackingRef = useRef(false);

  useEffect(() => {
    if (activeDelivery && currentUser && !trackingRef.current) {
      trackingRef.current = true;
      startLocationTracking(currentUser.uid, courierMode);
    } else if (!activeDelivery && trackingRef.current) {
      trackingRef.current = false;
      stopLocationTracking();
    }
    return () => {
      if (trackingRef.current) {
        stopLocationTracking();
        trackingRef.current = false;
      }
    };
  }, [activeDelivery?.id, currentUser?.uid]);

  const completedToday = useMemo(
    () => deliveries.filter((d) => d.status === "delivered" && new Date((d.createdAt as any)?.toDate?.() ?? d.createdAt).toDateString() === new Date().toDateString()).length,
    [deliveries]
  );

  const todayEarnings = useMemo(
    () => deliveries.filter((d) => d.status === "delivered").reduce((s, d) => s + d.earnings, 0),
    [deliveries]
  );

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); };

  const styles = createStyles(colors);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 20 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "اليوم", value: String(completedToday), icon: "check-circle" as const, color: colors.success },
          { label: "الأرباح", value: `$${todayEarnings.toFixed(0)}`, icon: "dollar-sign" as const, color: colors.accent },
          { label: "التقييم", value: String(user?.rating?.toFixed(1) ?? "5.0"), icon: "star" as const, color: colors.warning },
          { label: "المتاحة", value: String(availableJobs.length), icon: "package" as const, color: colors.primary },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name={s.icon} size={14} color={s.color} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Mode Switcher */}
      <View style={[styles.modeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.modeTitle, { color: colors.foreground }]}>وسيلة التنقل</Text>
        <CourierModeSelector selected={courierMode} onSelect={setCourierMode} label="" />
      </View>

      {/* Active delivery */}
      {activeDelivery && currentUser && (
        <View>
          <ActiveJobCard
            job={activeDelivery}
            colors={colors}
            courierId={currentUser.uid}
            onUpdateStatus={(s) => updateStatus(activeDelivery.id!, s)}
          />
        </View>
      )}

      {/* Available jobs */}
      {!activeDelivery && (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الطلبات المتاحة</Text>
            <View style={{ backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" }}>{availableJobs.length}</Text>
            </View>
          </View>

          {availableJobs.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 32, gap: 8 }}>
              <MaterialCommunityIcons name="package-variant-closed" size={40} color={colors.mutedForeground} />
              <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>لا توجد طلبات متاحة</Text>
              <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" }}>
                اسحب للتحديث — تظهر الطلبات الجديدة في الوقت الفعلي
              </Text>
            </View>
          ) : (
            availableJobs.map((job) => (
              <JobCard key={job.id} job={job} colors={colors} onAccept={() => acceptJob(job.id!)} />
            ))
          )}
        </View>
      )}

      {/* History */}
      {deliveries.filter((d) => d.status === "delivered").length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>سجل التوصيلات</Text>
          {deliveries.filter((d) => d.status === "delivered").slice(0, 3).map((d) => (
            <Pressable
              key={d.id}
              style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10 }}
              onPress={() => router.push(`/delivery/${d.id}`)}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{d.trackingId}</Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }} numberOfLines={1}>{d.dropoff.address}</Text>
              </View>
              <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: colors.success }}>${d.earnings.toFixed(2)}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    statsRow: { flexDirection: "row", gap: 8 },
    statCard: { flex: 1, borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, gap: 3 },
    statValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
    statLabel: { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center" },
    modeCard: { borderRadius: 16, padding: 14, borderWidth: 1, gap: 12 },
    modeTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  });
}
