import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import RouteOptimizer from "@/components/RouteOptimizer";
import type { DeliveryStatus, FirestoreDelivery } from "@/services/firestoreService";
import { getDeliveryById } from "@/services/firestoreService";
import { optimizeRouteByDeliveryId, type SmartRouteStrategy } from "@/services/geminiService";
import { getCurrentLocation } from "@/services/locationService";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const STATUS_CONFIG: Record<
  DeliveryStatus,
  { label: string; color: string; next: DeliveryStatus | null; nextLabel: string }
> = {
  pending: { label: "Pending", color: "#f59e0b", next: "in_transit", nextLabel: "Start Delivery" },
  in_transit: { label: "In Transit", color: "#1a6ef5", next: "delivered", nextLabel: "Mark Delivered" },
  delivered: { label: "Delivered", color: "#10b981", next: null, nextLabel: "" },
  cancelled: { label: "Cancelled", color: "#ef4444", next: null, nextLabel: "" },
};

const MODE_ICON: Record<string, string> = {
  foot: "walk",
  bicycle: "bike",
  escooter: "scooter",
  car: "car",
};

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deliveries, updateStatus } = useApp();
  const { userProfile } = useAuth();

  const [delivery, setDelivery] = useState<FirestoreDelivery | null>(
    (deliveries.find((d) => d.id === id) as FirestoreDelivery | undefined) ?? null
  );
  const [loading, setLoading] = useState(!delivery);
  const [smartRoute, setSmartRoute] = useState<SmartRouteStrategy | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch from Firestore if not in local state
  useEffect(() => {
    if (!delivery && id) {
      setLoading(true);
      getDeliveryById(id).then((d) => {
        setDelivery(d);
        setLoading(false);
      });
    }
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!delivery || !statusConfig?.next) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateStatus(delivery.id!, statusConfig.next);
    setDelivery((prev) => prev ? { ...prev, status: statusConfig.next! } : prev);
  };

  const handleOptimizeRoute = async () => {
    if (!delivery?.id) return;
    setAiLoading(true);
    try {
      const loc = await getCurrentLocation();
      const result = await optimizeRouteByDeliveryId(delivery.id, loc ?? undefined);
      setSmartRoute(result);
    } catch {
      setSmartRoute({
        deliveryId: delivery.id,
        strategy: "Take the most direct route available for your transport mode.",
        tips: [],
        estimatedMinutes: delivery.estimatedMinutes,
        recommendedMode: delivery.transportMode,
      });
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium", fontSize: 16 }}>Delivery not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[delivery.status];
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 20 : insets.bottom + 20;
  const isCourier = userProfile?.role === "courier";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.topBar, { paddingTop: topPad, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.foreground }]}>{delivery.trackingId}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: botPad }} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={{ alignItems: "center", gap: 8, paddingVertical: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: statusConfig.color + "20" }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: statusConfig.color }} />
            <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: statusConfig.color }}>{statusConfig.label}</Text>
          </View>
          <Text style={{ fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground, letterSpacing: 1 }}>{delivery.trackingId}</Text>
        </View>

        {/* Route */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Route</Text>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 4 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>Pickup</Text>
              <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground }}>{delivery.pickup.address}</Text>
            </View>
          </View>
          <View style={{ width: 2, height: 16, backgroundColor: colors.border, marginLeft: 4 }} />
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, marginTop: 4 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>Dropoff</Text>
              <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground }}>{delivery.dropoff.address}</Text>
            </View>
          </View>
        </View>

        {/* Metrics */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { icon: MODE_ICON[delivery.transportMode], value: delivery.transportMode === "escooter" ? "E-Scooter" : delivery.transportMode.charAt(0).toUpperCase() + delivery.transportMode.slice(1), label: "Mode", isMC: true },
            { icon: "map-pin", value: `${delivery.distance} mi`, label: "Distance", isMC: false },
            { icon: "clock", value: `${delivery.estimatedMinutes}m`, label: "ETA", isMC: false },
            { icon: "dollar-sign", value: `$${delivery.earnings.toFixed(2)}`, label: "Earn", isMC: false },
          ].map((m) => (
            <View key={m.label} style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {m.isMC
                ? <MaterialCommunityIcons name={m.icon as any} size={20} color={colors.primary} />
                : <Feather name={m.icon as any} size={20} color={m.icon === "dollar-sign" ? colors.success : colors.primary} />
              }
              <Text style={[styles.metricValue, { color: m.icon === "dollar-sign" ? colors.success : colors.foreground }]}>{m.value}</Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* People */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>People</Text>
          {[
            { role: "Sender", name: delivery.senderName, color: colors.primary },
            { role: "Recipient", name: delivery.recipientName, color: colors.accent },
            delivery.courierName ? { role: "Courier", name: delivery.courierName, color: colors.success } : null,
          ].filter(Boolean).map((p, i, arr) => (
            <React.Fragment key={p!.role}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p!.color + "20", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: p!.color }}>{p!.name[0]}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{p!.role}</Text>
                  <Text style={{ fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground }}>{p!.name}</Text>
                </View>
              </View>
              {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: colors.border }} />}
            </React.Fragment>
          ))}
        </View>

        {/* AI Smart Route Strategy */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialCommunityIcons name="robot-excited-outline" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground, flex: 1 }]}>AI Smart Route Strategy</Text>
          </View>

          {smartRoute ? (
            <View style={{ gap: 10 }}>
              <View style={{ backgroundColor: colors.primary + "12", borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: colors.primary }}>
                <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.foreground, lineHeight: 20 }}>
                  {smartRoute.strategy}
                </Text>
              </View>
              {smartRoute.tips.length > 0 && (
                <View style={{ gap: 6 }}>
                  {smartRoute.tips.map((tip, i) => (
                    <View key={i} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                      <Text style={{ color: colors.primary, fontSize: 12, marginTop: 1 }}>•</Text>
                      <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 }}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Feather name="clock" size={12} color={colors.mutedForeground} />
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>{smartRoute.estimatedMinutes} min</Text>
                </View>
                <MaterialCommunityIcons name={MODE_ICON[smartRoute.recommendedMode] as any} size={14} color={colors.primary} />
                <Text style={{ fontSize: 11, color: colors.primary, fontFamily: "Inter_500Medium" }}>{smartRoute.recommendedMode}</Text>
              </View>
              <Pressable onPress={handleOptimizeRoute} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Feather name="refresh-cw" size={12} color={colors.mutedForeground} />
                <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>Refresh strategy</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.primary, borderRadius: 12, padding: 14 }}
              onPress={handleOptimizeRoute}
              disabled={aiLoading}
            >
              {aiLoading
                ? <><ActivityIndicator color="#fff" size="small" /><Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Analyzing route...</Text></>
                : <><MaterialCommunityIcons name="robot-excited-outline" size={16} color="#fff" /><Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Get Smart Route Strategy</Text></>
              }
            </Pressable>
          )}
        </View>

        {/* Classic route optimizer */}
        <RouteOptimizer
          pickupAddress={delivery.pickup.address}
          dropoffAddress={delivery.dropoff.address}
          courierMode={delivery.transportMode}
          distance={delivery.distance}
        />

        {/* Status action (courier only) */}
        {isCourier && statusConfig?.next && (
          <Pressable style={[styles.actionBtn, { backgroundColor: statusConfig.color }]} onPress={handleStatusUpdate}>
            <Feather name="check-circle" size={18} color="#ffffff" />
            <Text style={styles.actionText}>{statusConfig.nextLabel}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  topTitle: { flex: 1, textAlign: "center", fontSize: 15, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  cardTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  metricCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, gap: 4 },
  metricValue: { fontSize: 12, fontFamily: "Inter_700Bold" },
  metricLabel: { fontSize: 9, fontFamily: "Inter_400Regular" },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, borderRadius: 14, marginTop: 4 },
  actionText: { color: "#ffffff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
