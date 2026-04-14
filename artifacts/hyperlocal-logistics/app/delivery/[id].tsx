import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import RouteOptimizer from "@/components/RouteOptimizer";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "#f59e0b", next: "in_transit" as const, nextLabel: "Start Delivery" },
  in_transit: { label: "In Transit", color: "#1a6ef5", next: "delivered" as const, nextLabel: "Mark Delivered" },
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
  const { deliveries, updateDelivery } = useApp();

  const delivery = deliveries.find((d) => d.id === id);
  const statusConfig = delivery ? STATUS_CONFIG[delivery.status] : null;

  const handleStatusUpdate = () => {
    if (!delivery || !statusConfig?.next) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateDelivery(delivery.id, { status: statusConfig.next });
  };

  if (!delivery) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium", fontSize: 16 }}>
          Delivery not found
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const styles = createStyles(colors);
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPadding }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.topTitle}>{delivery.trackingId}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 34 + 20 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: statusConfig!.color + "20" },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusConfig!.color }]} />
            <Text style={[styles.statusText, { color: statusConfig!.color }]}>
              {statusConfig!.label}
            </Text>
          </View>
          <Text style={styles.trackingId}>{delivery.trackingId}</Text>
          <Text style={[styles.createdAt, { color: colors.mutedForeground }]}>
            {new Date(delivery.createdAt).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.infoTitle}>Route</Text>
          <View style={styles.addressRow}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <View style={styles.addressText}>
              <Text style={styles.addressLabel}>Pickup</Text>
              <Text style={styles.addressValue}>{delivery.pickup.address}</Text>
            </View>
          </View>
          <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
          <View style={styles.addressRow}>
            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
            <View style={styles.addressText}>
              <Text style={styles.addressLabel}>Dropoff</Text>
              <Text style={styles.addressValue}>{delivery.dropoff.address}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons
              name={MODE_ICON[delivery.courierMode] as any}
              size={22}
              color={colors.primary}
            />
            <Text style={styles.metricValue}>
              {delivery.courierMode === "escooter" ? "E-Scooter" : delivery.courierMode.charAt(0).toUpperCase() + delivery.courierMode.slice(1)}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Mode</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="map-pin" size={22} color={colors.primary} />
            <Text style={styles.metricValue}>{delivery.distance} mi</Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Distance</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="clock" size={22} color={colors.primary} />
            <Text style={styles.metricValue}>{delivery.estimatedMinutes}m</Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>ETA</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="dollar-sign" size={22} color={colors.success} />
            <Text style={[styles.metricValue, { color: colors.success }]}>
              ${delivery.earnings.toFixed(2)}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Earn</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.infoTitle}>People</Text>
          <View style={styles.personRow}>
            <View style={[styles.personAvatar, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.personInitial, { color: colors.primary }]}>
                {delivery.senderName[0]}
              </Text>
            </View>
            <View>
              <Text style={[styles.personRole, { color: colors.mutedForeground }]}>Sender</Text>
              <Text style={styles.personName}>{delivery.senderName}</Text>
            </View>
          </View>
          <View style={[styles.personDivider, { backgroundColor: colors.border }]} />
          <View style={styles.personRow}>
            <View style={[styles.personAvatar, { backgroundColor: colors.accent + "20" }]}>
              <Text style={[styles.personInitial, { color: colors.accent }]}>
                {delivery.recipientName[0]}
              </Text>
            </View>
            <View>
              <Text style={[styles.personRole, { color: colors.mutedForeground }]}>Recipient</Text>
              <Text style={styles.personName}>{delivery.recipientName}</Text>
            </View>
          </View>
        </View>

        <RouteOptimizer
          pickupAddress={delivery.pickup.address}
          dropoffAddress={delivery.dropoff.address}
          courierMode={delivery.courierMode}
          distance={delivery.distance}
        />

        {statusConfig?.next && (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: statusConfig.color }]}
            onPress={handleStatusUpdate}
          >
            <Feather name="check-circle" size={18} color="#ffffff" />
            <Text style={styles.actionText}>{statusConfig.nextLabel}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    topTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      letterSpacing: 0.5,
    },
    content: { padding: 20, gap: 16 },
    statusCard: {
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
    },
    statusIndicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
    trackingId: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      letterSpacing: 1,
    },
    createdAt: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
    },
    infoCard: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      gap: 12,
    },
    infoTitle: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    addressRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
    routeLine: {
      width: 2,
      height: 16,
      marginLeft: 4,
    },
    addressText: { flex: 1 },
    addressLabel: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    addressValue: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
    },
    metricsRow: {
      flexDirection: "row",
      gap: 8,
    },
    metricCard: {
      flex: 1,
      borderRadius: 14,
      padding: 12,
      alignItems: "center",
      borderWidth: 1,
      gap: 4,
    },
    metricValue: {
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    metricLabel: {
      fontSize: 9,
      fontFamily: "Inter_400Regular",
    },
    personRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    personAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    personInitial: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
    },
    personRole: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
    },
    personName: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.foreground,
    },
    personDivider: {
      height: 1,
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: 16,
      borderRadius: 14,
      marginTop: 4,
    },
    actionText: {
      color: "#ffffff",
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
  });
}
