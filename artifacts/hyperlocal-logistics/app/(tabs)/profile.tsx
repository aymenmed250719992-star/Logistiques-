import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

import CourierModeSelector from "@/components/CourierModeSelector";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  dangerous?: boolean;
  colors: ReturnType<typeof useColors>;
}

function SettingRow({ icon, label, value, onPress, dangerous, colors }: SettingRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingRow,
        {
          backgroundColor: pressed ? colors.muted : colors.card,
          borderColor: colors.border,
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
    >
      <Feather
        name={icon as any}
        size={18}
        color={dangerous ? colors.destructive : colors.primary}
      />
      <Text
        style={[
          styles.settingLabel,
          { color: dangerous ? colors.destructive : colors.foreground },
        ]}
      >
        {label}
      </Text>
      {value && (
        <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text>
      )}
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, courierMode, setCourierMode, deliveries, logout } = useApp();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const totalEarnings = deliveries
    .filter((d) => d.status === "delivered")
    .reduce((sum, d) => sum + d.earnings, 0);

  const completedCount = deliveries.filter((d) => d.status === "delivered").length;

  const styles_ = createStyles(colors);

  return (
    <ScrollView
      style={[styles_.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles_.content,
        {
          paddingTop: topPadding + 16,
          paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 84,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles_.profileCard}>
        <View style={[styles_.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles_.avatarText}>
            {user?.name?.split(" ").map((n) => n[0]).join("") ?? "?"}
          </Text>
        </View>
        <View style={styles_.profileInfo}>
          <Text style={styles_.profileName}>{user?.name ?? "Guest"}</Text>
          <Text style={[styles_.profileEmail, { color: colors.mutedForeground }]}>
            {user?.email ?? "—"}
          </Text>
          <View style={styles_.badgeRow}>
            <View style={[styles_.roleBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles_.roleText, { color: colors.primary }]}>
                {(user?.role ?? "courier").toUpperCase()}
              </Text>
            </View>
            {user?.isVerified && (
              <View style={[styles_.verifiedBadge, { backgroundColor: colors.accent + "20" }]}>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={12}
                  color={colors.accent}
                />
                <Text style={[styles_.verifiedText, { color: colors.accent }]}>Verified</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles_.statsRow}>
        <View style={[styles_.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles_.statValue, { color: colors.foreground }]}>
            {completedCount}
          </Text>
          <Text style={[styles_.statLabel, { color: colors.mutedForeground }]}>Deliveries</Text>
        </View>
        <View style={[styles_.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles_.statValue, { color: colors.foreground }]}>
            ${totalEarnings.toFixed(0)}
          </Text>
          <Text style={[styles_.statLabel, { color: colors.mutedForeground }]}>Earnings</Text>
        </View>
        <View style={[styles_.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles_.ratingRow}>
            <Feather name="star" size={14} color={colors.warning} />
            <Text style={[styles_.statValue, { color: colors.foreground }]}>
              {user?.rating?.toFixed(1) ?? "—"}
            </Text>
          </View>
          <Text style={[styles_.statLabel, { color: colors.mutedForeground }]}>Rating</Text>
        </View>
      </View>

      <View style={styles_.section}>
        <Text style={[styles_.sectionTitle, { color: colors.foreground }]}>Courier Mode</Text>
        <CourierModeSelector
          selected={courierMode}
          onSelect={setCourierMode}
          label=""
        />
        <Text style={[styles_.modeNote, { color: colors.mutedForeground }]}>
          AI route optimization will use this mode to calculate optimal delivery paths
        </Text>
      </View>

      <View style={styles_.section}>
        <Text style={[styles_.sectionTitle, { color: colors.foreground }]}>Account</Text>
        <SettingRow
          icon="user"
          label="Edit Profile"
          colors={colors}
          onPress={() => {}}
        />
        <SettingRow
          icon="bell"
          label="Notifications"
          value="On"
          colors={colors}
          onPress={() => {}}
        />
        <SettingRow
          icon="shield"
          label="Privacy & Security"
          colors={colors}
          onPress={() => {}}
        />
      </View>

      <View style={styles_.section}>
        <Text style={[styles_.sectionTitle, { color: colors.foreground }]}>Integration</Text>
        <SettingRow
          icon="cloud"
          label="Firebase Status"
          value="Template"
          colors={colors}
          onPress={() => {}}
        />
        <SettingRow
          icon="zap"
          label="Gemini AI"
          value="Active"
          colors={colors}
          onPress={() => {}}
        />
      </View>

      <View style={styles_.section}>
        <SettingRow
          icon="help-circle"
          label="Help & Support"
          colors={colors}
          onPress={() => {}}
        />
        <SettingRow
          icon="log-out"
          label="Sign Out"
          dangerous
          colors={colors}
          onPress={logout}
        />
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 20, gap: 20 },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: "#ffffff",
      fontSize: 22,
      fontFamily: "Inter_700Bold",
    },
    profileInfo: { flex: 1, gap: 4 },
    profileName: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    profileEmail: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
    badgeRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 4,
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    roleText: {
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.8,
    },
    verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    verifiedText: {
      fontSize: 10,
      fontFamily: "Inter_600SemiBold",
    },
    statsRow: {
      flexDirection: "row",
      gap: 10,
    },
    statCard: {
      flex: 1,
      borderRadius: 14,
      padding: 14,
      alignItems: "center",
      borderWidth: 1,
      gap: 4,
    },
    statValue: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
    },
    statLabel: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    section: { gap: 10 },
    sectionTitle: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
    modeNote: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      lineHeight: 16,
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
    settingLabel: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      flex: 1,
    },
    settingValue: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
  });
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
});
