import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
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

import CourierDashboard from "@/components/CourierDashboard";
import SenderDashboard from "@/components/SenderDashboard";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useApp();
  const { isLoading: authLoading } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  // Wait for auth + profile to resolve before deciding which dashboard to show
  const loading = authLoading || isLoading;

  // Only treat as courier if explicitly set — never default based on null user
  const isCourier = user?.role === "courier";
  const isSender = user?.role === "sender";

  const greeting = user?.name?.split(" ")[0] ?? "Welcome";
  const subtitle = isCourier
    ? "Ready to deliver today?"
    : isSender
    ? "Manage your deliveries"
    : "Loading your dashboard…";

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={[styles.greeting, { color: colors.foreground }]}>Hello, {greeting}</Text>
            {user && (
              <View
                style={[
                  styles.roleBadge,
                  { backgroundColor: isCourier ? colors.primary + "20" : colors.accent + "20" },
                ]}
              >
                <Feather
                  name={isCourier ? "truck" : "send"}
                  size={11}
                  color={isCourier ? colors.primary : colors.accent}
                />
                <Text
                  style={[
                    styles.roleBadgeText,
                    { color: isCourier ? colors.primary : colors.accent },
                  ]}
                >
                  {isCourier ? "Courier" : "Sender"}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
        </View>

        {/* Only senders can post new deliveries */}
        {isSender && (
          <Pressable
            style={[styles.addBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/delivery/new")}
          >
            <Feather name="plus" size={20} color={colors.primary} />
          </Pressable>
        )}
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
        >
          {isCourier ? <CourierDashboard /> : isSender ? <SenderDashboard /> : null}
        </ScrollView>
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    greeting: { fontSize: 24, fontFamily: "Inter_700Bold" },
    roleBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    roleBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
    addBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
    content: { paddingHorizontal: 20 },
  });
}
