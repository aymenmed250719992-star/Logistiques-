import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import DeliveryCard from "@/components/DeliveryCard";
import StatsBar from "@/components/StatsBar";
import type { Delivery } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, deliveries, activeDelivery } = useApp();
  const [refreshing, setRefreshing] = React.useState(false);

  const activeDeliveries = useMemo(
    () => deliveries.filter((d) => d.status === "in_transit" || d.status === "pending"),
    [deliveries]
  );

  const completedToday = useMemo(
    () =>
      deliveries.filter(
        (d) =>
          d.status === "delivered" &&
          new Date(d.createdAt).toDateString() === new Date().toDateString()
      ).length,
    [deliveries]
  );

  const todayEarnings = useMemo(
    () =>
      deliveries
        .filter(
          (d) =>
            d.status === "delivered" &&
            new Date(d.createdAt).toDateString() === new Date().toDateString()
        )
        .reduce((sum, d) => sum + d.earnings, 0),
    [deliveries]
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const handleDeliveryPress = (delivery: Delivery) => {
    router.push(`/delivery/${delivery.id}`);
  };

  const handleNewDelivery = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/delivery/new");
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const styles = createStyles(colors);

  const stats = [
    {
      label: "Active",
      value: String(activeDeliveries.length),
      icon: "truck",
      color: colors.primary,
    },
    {
      label: "Today",
      value: String(completedToday),
      icon: "check-circle",
      color: colors.success,
    },
    {
      label: "Earnings",
      value: `$${todayEarnings.toFixed(0)}`,
      icon: "dollar-sign",
      color: colors.accent,
    },
    {
      label: "Rating",
      value: String(user?.rating ?? "—"),
      icon: "star",
      color: colors.warning,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPadding + 16,
          paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 84,
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(" ")[0] ?? "Courier"}</Text>
          <Text style={styles.subtitle}>Ready to deliver today?</Text>
        </View>
        <Pressable
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
          onPress={handleNewDelivery}
        >
          <Feather name="plus" size={20} color="#ffffff" />
        </Pressable>
      </View>

      <StatsBar stats={stats} />

      {activeDelivery && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.liveDot, { backgroundColor: colors.accent }]} />
            <Text style={styles.sectionTitle}>Active Delivery</Text>
          </View>
          <DeliveryCard delivery={activeDelivery} onPress={handleDeliveryPress} />
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Deliveries</Text>
          <Text style={[styles.count, { color: colors.mutedForeground }]}>
            {deliveries.length}
          </Text>
        </View>
        {deliveries.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={40}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No deliveries yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap the + button to create your first delivery
            </Text>
          </View>
        ) : (
          deliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              onPress={handleDeliveryPress}
              compact={delivery.status === "delivered"}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 20, gap: 20 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    greeting: {
      fontSize: 26,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    subtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    newBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    section: { gap: 12 },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      flex: 1,
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    count: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
    emptyText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
  });
}
