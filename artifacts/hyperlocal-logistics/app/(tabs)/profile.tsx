import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { addPost } from "@/services/firestoreService";

const ALGERIAN_CITIES = [
  "الجزائر العاصمة", "وهران", "قسنطينة", "عنابة", "بليدة",
  "سطيف", "باتنة", "تلمسان", "بجاية", "سيدي بلعباس",
  "المسيلة", "تيزي وزو", "الأغواط", "ورقلة", "بسكرة",
];

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
      <Feather name="chevron-left" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, courierMode, setCourierMode, deliveries } = useApp();
  const { signOut, userProfile } = useAuth();

  const [postModal, setPostModal] = useState(false);
  const [postText, setPostText] = useState("");
  const [postCity, setPostCity] = useState("الجزائر العاصمة");
  const [posting, setPosting] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const totalEarnings = deliveries.filter((d) => d.status === "delivered").reduce((s, d) => s + d.earnings, 0);
  const completedCount = deliveries.filter((d) => d.status === "delivered").length;

  const isCourier = user?.role === "courier";
  const roleLabel = isCourier ? "عامل توصيل" : "مرسل";

  const approvalLabel =
    userProfile?.approvalStatus === "approved" ? "موافق عليه"
    : userProfile?.approvalStatus === "pending"  ? "بانتظار الموافقة"
    : "مرفوض";

  const approvalColor =
    userProfile?.approvalStatus === "approved" ? colors.success
    : userProfile?.approvalStatus === "pending"  ? "#f59e0b"
    : colors.destructive;

  const handlePostSubmit = async () => {
    if (!postText.trim()) return;
    setPosting(true);
    try {
      await addPost({
        authorId: user?.id ?? "unknown",
        authorName: user?.name ?? "مستخدم",
        authorRole: isCourier ? "عامل توصيل" : "مرسل",
        content: postText.trim(),
        city: postCity,
      });
      setPostText("");
      setPostModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("خطأ", "فشل نشر التعليق. حاول مجدداً.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
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
            <Text style={[styles.profileName, { color: colors.foreground }]}>{user?.name ?? "ضيف"}</Text>
            <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user?.email ?? "—"}</Text>
            {userProfile?.customerId && (
              <Text style={[styles.customerId, { color: colors.mutedForeground }]}>
                {userProfile.customerId}
              </Text>
            )}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <View style={[styles.roleBadge, { backgroundColor: isCourier ? colors.primary + "20" : colors.accent + "20" }]}>
                <Feather name={isCourier ? "truck" : "send"} size={10} color={isCourier ? colors.primary : colors.accent} />
                <Text style={[styles.roleText, { color: isCourier ? colors.primary : colors.accent }]}>
                  {roleLabel}
                </Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: approvalColor + "20" }]}>
                <Text style={[styles.roleText, { color: approvalColor }]}>
                  {approvalLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: "التوصيلات", value: String(completedCount), icon: "package" as const },
            { label: "الأرباح", value: `${totalEarnings.toFixed(0)} دج`, icon: "dollar-sign" as const },
            { label: "التقييم", value: user?.rating?.toFixed(1) ?? "5.0", icon: "star" as const },
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

        {/* Courier mode selector */}
        {isCourier && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>وسيلة التنقل</Text>
            <CourierModeSelector selected={courierMode} onSelect={setCourierMode} label="" />
          </View>
        )}

        {/* Share experience */}
        <View style={{ gap: 10 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>شارك تجربتك</Text>
          <Pressable
            style={[styles.shareBtn, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "35" }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setPostModal(true); }}
          >
            <Feather name="edit-3" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.shareBtnTitle, { color: colors.primary }]}>انشر تجربتك مع التطبيق</Text>
              <Text style={[styles.shareBtnDesc, { color: colors.mutedForeground }]}>
                تجربتك تساعد الآخرين على الانضمام
              </Text>
            </View>
            <Feather name="chevron-left" size={16} color={colors.primary} />
          </Pressable>
        </View>

        {/* Sign out */}
        <View style={{ gap: 10 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الحساب</Text>
          <SettingRow
            icon="log-out"
            label="تسجيل الخروج"
            dangerous
            colors={colors}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              await signOut();
              router.replace("/welcome");
            }}
          />
        </View>
      </ScrollView>

      {/* Post modal */}
      <Modal visible={postModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>انشر تجربتك</Text>
              <Pressable onPress={() => setPostModal(false)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </Pressable>
            </View>

            <TextInput
              style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="شاركنا تجربتك مع التطبيق..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              value={postText}
              onChangeText={setPostText}
              textAlign="right"
              textAlignVertical="top"
            />

            <Text style={[styles.cityLabel, { color: colors.mutedForeground }]}>المدينة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {ALGERIAN_CITIES.map((city) => (
                  <Pressable
                    key={city}
                    style={[
                      styles.cityChip,
                      {
                        backgroundColor: postCity === city ? colors.primary : colors.background,
                        borderColor: postCity === city ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setPostCity(city); }}
                  >
                    <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: postCity === city ? "#fff" : colors.foreground }}>
                      {city}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable
              style={[styles.postBtn, { backgroundColor: postText.trim() ? colors.primary : colors.muted }]}
              onPress={handlePostSubmit}
              disabled={!postText.trim() || posting}
            >
              {posting
                ? <ActivityIndicator color="#fff" size="small" />
                : <><Feather name="send" size={16} color="#fff" /><Text style={styles.postBtnText}>نشر التجربة</Text></>
              }
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: 18, padding: 16, borderWidth: 1 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#ffffff", fontSize: 22, fontFamily: "Inter_700Bold" },
  profileName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  profileEmail: { fontSize: 13, fontFamily: "Inter_400Regular" },
  customerId: { fontSize: 11, fontFamily: "Inter_500Medium" },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, gap: 4 },
  statValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  section: { borderRadius: 16, padding: 14, borderWidth: 1, gap: 12 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  settingLabel: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  settingValue: { fontSize: 13, fontFamily: "Inter_400Regular" },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  shareBtnTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  shareBtnDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { borderRadius: 24, borderWidth: 1, padding: 20, gap: 12, margin: 12 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 110 },
  cityLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  cityChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  postBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12 },
  postBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
