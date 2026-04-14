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
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const FIREBASE_PROJ = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  valueColor?: string;
  onPress?: () => void;
  dangerous?: boolean;
  colors: ReturnType<typeof useColors>;
}

function SettingRow({ icon, label, value, valueColor, onPress, dangerous, colors }: SettingRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingRow,
        { backgroundColor: pressed ? colors.muted : colors.card, borderColor: colors.border },
      ]}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
    >
      <Feather name={icon as any} size={18} color={dangerous ? colors.destructive : colors.primary} />
      <Text style={[styles.settingLabel, { color: dangerous ? colors.destructive : colors.foreground }]}>{label}</Text>
      {value && <Text style={[styles.settingValue, { color: valueColor ?? colors.mutedForeground }]}>{value}</Text>}
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, courierMode, setCourierMode, deliveries } = useApp();
  const { signOut } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const totalEarnings = deliveries.filter((d) => d.status === "delivered").reduce((s, d) => s + d.earnings, 0);
  const completedCount = deliveries.filter((d) => d.status === "delivered").length;

  const isCourier = user?.role === "courier";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: topPad + 16, paddingBottom: botPad, gap: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.name?.split(" ").map((n) => n[0]).join("") ?? "?"}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>{user?.name ?? "Guest"}</Text>
          <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user?.email ?? "—"}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <View style={[styles.roleBadge, { backgroundColor: isCourier ? colors.primary + "20" : colors.accent + "20" }]}>
              <Feather name={isCourier ? "truck" : "send"} size={10} color={isCourier ? colors.primary : colors.accent} />
              <Text style={[styles.roleText, { color: isCourier ? colors.primary : colors.accent }]}>
                {(user?.role ?? "courier").toUpperCase()}
              </Text>
            </View>
            {user?.isVerified && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.accent + "20" }]}>
                <MaterialCommunityIcons name="check-decagram" size={12} color={colors.accent} />
                <Text style={[styles.verifiedText, { color: colors.accent }]}>Verified</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {[
          { label: "Deliveries", value: String(completedCount), icon: "package" as const },
          { label: "Earnings", value: `$${totalEarnings.toFixed(0)}`, icon: "dollar-sign" as const },
          { label: "Rating", value: user?.rating?.toFixed(1) ?? "5.0", icon: "star" as const },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name={s.icon} size={14} color={s.icon === "star" ? colors.warning : colors.primary} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Courier mode selector (couriers only) */}
      {isCourier && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Transport Mode</Text>
          <CourierModeSelector selected={courierMode} onSelect={setCourierMode} label="" />
          <Text style={[styles.modeNote, { color: colors.mutedForeground }]}>
            Synced to Firestore — AI route optimization uses this mode for Smart Route Strategy
          </Text>
        </View>
      )}

      {/* Integration status */}
      <View style={{ gap: 10 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Integration Status</Text>
        <SettingRow
          icon="cloud"
          label="Firebase"
          value={FIREBASE_PROJ ? `✓ ${FIREBASE_PROJ}` : "Not configured"}
          valueColor={FIREBASE_PROJ ? colors.success : colors.destructive}
          colors={colors}
        />
        <SettingRow
          icon="zap"
          label="Gemini AI"
          value={GEMINI_KEY ? "✓ Active" : "Key not set"}
          valueColor={GEMINI_KEY ? colors.success : colors.warning}
          colors={colors}
        />
      </View>

      {/* Account */}
      <View style={{ gap: 10 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>
        <SettingRow icon="user" label="Edit Profile" colors={colors} onPress={() => {}} />
        <SettingRow icon="bell" label="Notifications" value="On" colors={colors} onPress={() => {}} />
        <SettingRow icon="shield" label="Privacy & Security" colors={colors} onPress={() => {}} />
      </View>

      {/* Sign out */}
      <View style={{ gap: 10 }}>
        <SettingRow icon="help-circle" label="Help & Support" colors={colors} onPress={() => {}} />
        <SettingRow
          icon="log-out"
          label="Sign Out"
          dangerous
          colors={colors}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); signOut(); }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: 18, padding: 16, borderWidth: 1 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#ffffff", fontSize: 22, fontFamily: "Inter_700Bold" },
  profileName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  profileEmail: { fontSize: 13, fontFamily: "Inter_400Regular" },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  verifiedText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, gap: 4 },
  statValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  section: { borderRadius: 16, padding: 14, borderWidth: 1, gap: 12 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modeNote: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  settingLabel: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  settingValue: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
