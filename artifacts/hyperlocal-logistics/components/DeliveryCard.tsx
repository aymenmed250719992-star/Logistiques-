import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import type { FirestoreDelivery } from "@/services/firestoreService";
import { useColors } from "@/hooks/useColors";

type Delivery = FirestoreDelivery & { courierMode?: string };

interface DeliveryCardProps {
  delivery: Delivery;
  onPress?: (delivery: Delivery) => void;
  compact?: boolean;
}

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "#f59e0b", icon: "clock-outline" as const },
  in_transit: { label: "In Transit", color: "#1a6ef5", icon: "truck-fast-outline" as const },
  delivered: { label: "Delivered", color: "#10b981", icon: "check-circle-outline" as const },
  cancelled: { label: "Cancelled", color: "#ef4444", icon: "close-circle-outline" as const },
};

const MODE_ICON: Record<string, string> = {
  foot: "walk",
  bicycle: "bike",
  escooter: "scooter",
  car: "car",
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function DeliveryCard({ delivery, onPress, compact = false }: DeliveryCardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const status = STATUS_CONFIG[delivery.status];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(delivery);
  };

  const styles = createStyles(colors);

  return (
    <AnimatedPressable
      style={[styles.card, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <View style={styles.header}>
        <View style={styles.trackingRow}>
          <Text style={styles.trackingId}>{delivery.trackingId}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color + "20" }]}>
            <MaterialCommunityIcons name={status.icon} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.modeRow}>
          <MaterialCommunityIcons
            name={MODE_ICON[delivery.transportMode ?? delivery.courierMode ?? "bicycle"] as any}
            size={14}
            color={colors.mutedForeground}
          />
          <Text style={styles.modeText}>{(delivery.transportMode ?? delivery.courierMode ?? "bicycle").replace("escooter", "E-Scooter")}</Text>
          <Text style={styles.separator}>·</Text>
          <Text style={styles.modeText}>{delivery.distance} mi</Text>
          <Text style={styles.separator}>·</Text>
          <Feather name="clock" size={12} color={colors.mutedForeground} />
          <Text style={styles.modeText}>{delivery.estimatedMinutes} min</Text>
        </View>
      </View>

      {!compact && (
        <View style={styles.addressSection}>
          <View style={styles.addressRow}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={styles.address} numberOfLines={1}>{delivery.pickup.address}</Text>
          </View>
          <View style={styles.line} />
          <View style={styles.addressRow}>
            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
            <Text style={styles.address} numberOfLines={1}>{delivery.dropoff.address}</Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.namesRow}>
          <Text style={styles.nameLabel}>From </Text>
          <Text style={styles.name}>{delivery.senderName}</Text>
          <Text style={styles.nameLabel}> to </Text>
          <Text style={styles.name}>{delivery.recipientName}</Text>
        </View>
        <Text style={styles.earnings}>${delivery.earnings.toFixed(2)}</Text>
      </View>
    </AnimatedPressable>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    header: {
      marginBottom: 12,
    },
    trackingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    trackingId: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      letterSpacing: 0.5,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
    },
    statusText: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
    },
    modeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    modeText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textTransform: "capitalize",
    },
    separator: {
      color: colors.mutedForeground,
      fontSize: 12,
    },
    addressSection: {
      backgroundColor: colors.muted,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
    addressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    line: {
      width: 2,
      height: 12,
      backgroundColor: colors.border,
      marginLeft: 3,
      marginVertical: 2,
    },
    address: {
      fontSize: 13,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      flex: 1,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    namesRow: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    nameLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    name: {
      fontSize: 12,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
    },
    earnings: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: colors.success,
    },
  });
}
