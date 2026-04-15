import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { FirestoreDelivery } from "@/services/firestoreService";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const STATUS_CONFIG = {
  pending: { label: "بانتظار العامل", color: "#f59e0b", icon: "clock-outline" as const },
  in_transit: { label: "قيد التوصيل", color: "#1a6ef5", icon: "truck-fast-outline" as const },
  delivered: { label: "تم التسليم", color: "#10b981", icon: "check-circle-outline" as const },
  cancelled: { label: "ملغي", color: "#ef4444", icon: "close-circle-outline" as const },
};

interface NewJobFormProps {
  colors: ReturnType<typeof useColors>;
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

function NewJobForm({ colors, onSubmit, onClose }: NewJobFormProps) {
  const [pickupAddr, setPickupAddr] = useState("");
  const [dropoffAddr, setDropoffAddr] = useState("");
  const [recipient, setRecipient] = useState("");
  const [pkgSize, setPkgSize] = useState<"small" | "medium" | "large">("small");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    if (!pickupAddr || !dropoffAddr || !recipient) {
      setErr("جميع الحقول مطلوبة.");
      return;
    }
    setErr("");
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await onSubmit({ pickupAddr, dropoffAddr, recipient, pkgSize });
      onClose();
    } catch {
      setErr("فشل نشر الطلب. يرجى المحاولة مجدداً.");
    } finally {
      setSubmitting(false);
    }
  };

  const sizeLabels = { small: "صغير", medium: "متوسط", large: "كبير" };

  const styles = StyleSheet.create({
    overlay: { backgroundColor: colors.card, borderRadius: 20, padding: 20, gap: 16, borderWidth: 1, borderColor: colors.border },
    title: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground },
    label: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground, marginBottom: 4 },
    input: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.muted, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground, textAlign: "right" },
    sizeRow: { flexDirection: "row" as const, gap: 8 },
    sizeBtn: { flex: 1, borderRadius: 10, padding: 10, alignItems: "center" as const, borderWidth: 1 },
    sizeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
    row: { flexDirection: "row" as const, gap: 12 },
    cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center" as const },
    cancelText: { color: colors.foreground, fontFamily: "Inter_500Medium", fontSize: 14 },
    submitBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" as const, backgroundColor: colors.primary, flexDirection: "row" as const, justifyContent: "center" as const, gap: 8 },
    submitText: { color: "#ffffff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
    errText: { fontSize: 12, color: colors.destructive, fontFamily: "Inter_400Regular" },
  });

  return (
    <View style={styles.overlay}>
      <Text style={styles.title}>نشر طلب توصيل</Text>
      <View>
        <Text style={styles.label}>عنوان الاستلام</Text>
        <TextInput style={styles.input} value={pickupAddr} onChangeText={setPickupAddr} placeholder="مثال: شارع الملك فهد، الرياض" placeholderTextColor={colors.mutedForeground} />
      </View>
      <View>
        <Text style={styles.label}>عنوان التسليم</Text>
        <TextInput style={styles.input} value={dropoffAddr} onChangeText={setDropoffAddr} placeholder="مثال: شارع التحلية، جدة" placeholderTextColor={colors.mutedForeground} />
      </View>
      <View>
        <Text style={styles.label}>اسم المستلم</Text>
        <TextInput style={styles.input} value={recipient} onChangeText={setRecipient} placeholder="محمد أحمد" placeholderTextColor={colors.mutedForeground} />
      </View>
      <View>
        <Text style={styles.label}>حجم الطرد</Text>
        <View style={styles.sizeRow}>
          {(["small", "medium", "large"] as const).map((s) => (
            <Pressable key={s} style={[styles.sizeBtn, { backgroundColor: pkgSize === s ? colors.primary : colors.card, borderColor: pkgSize === s ? colors.primary : colors.border }]} onPress={() => setPkgSize(s)}>
              <Text style={[styles.sizeText, { color: pkgSize === s ? "#fff" : colors.foreground }]}>{sizeLabels[s]}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {err ? <Text style={styles.errText}>{err}</Text> : null}
      <View style={styles.row}>
        <Pressable style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelText}>إلغاء</Text></Pressable>
        <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" size="small" /> : <>
            <Feather name="send" size={14} color="#fff" />
            <Text style={styles.submitText}>نشر الطلب</Text>
          </>}
        </Pressable>
      </View>
    </View>
  );
}

interface DeliveryItemProps {
  delivery: FirestoreDelivery;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}

function DeliveryItem({ delivery, colors, onPress }: DeliveryItemProps) {
  const status = STATUS_CONFIG[delivery.status];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.muted : colors.card,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 10,
        gap: 10,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>
          {delivery.trackingId}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: status.color + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
          <MaterialCommunityIcons name={status.icon} size={11} color={status.color} />
          <Text style={{ fontSize: 11, color: status.color, fontFamily: "Inter_600SemiBold" }}>{status.label}</Text>
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }} numberOfLines={1}>
          من: {delivery.pickup.address}
        </Text>
        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }} numberOfLines={1}>
          إلى: {delivery.dropoff.address}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
          {delivery.courierName ? `العامل: ${delivery.courierName}` : "بانتظار عامل توصيل"}
        </Text>
        <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: colors.success }}>
          ${delivery.earnings.toFixed(2)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function SenderDashboard() {
  const colors = useColors();
  const { user, deliveries, postDelivery } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const active = useMemo(() => deliveries.filter((d) => d.status !== "delivered" && d.status !== "cancelled"), [deliveries]);
  const completed = useMemo(() => deliveries.filter((d) => d.status === "delivered"), [deliveries]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handlePost = async (form: any) => {
    if (!user) return;
    const baseEarnings = { small: 7, medium: 11, large: 16 };
    const distance = +(Math.random() * 3 + 0.5).toFixed(1);
    await postDelivery({
      trackingId: `TRK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      status: "pending",
      senderId: user.id,
      senderName: user.name,
      courierId: null,
      courierName: null,
      recipientName: form.recipient,
      packageSize: form.pkgSize,
      transportMode: "bicycle",
      pickup: { address: form.pickupAddr, lat: 24.7136 + (Math.random() - 0.5) * 0.04, lng: 46.6753 + (Math.random() - 0.5) * 0.04 },
      dropoff: { address: form.dropoffAddr, lat: 24.7136 + (Math.random() - 0.5) * 0.04, lng: 46.6753 + (Math.random() - 0.5) * 0.04 },
      estimatedMinutes: Math.round(distance * 8),
      distance,
      earnings: baseEarnings[form.pkgSize as "small" | "medium" | "large"],
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

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
          { label: "إجمالي الطلبات", value: String(deliveries.length), icon: "package" as const, color: colors.primary },
          { label: "النشطة", value: String(active.length), icon: "truck" as const, color: colors.warning },
          { label: "المسلّمة", value: String(completed.length), icon: "check-circle" as const, color: colors.success },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name={s.icon} size={16} color={s.color} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {!showForm && (
        <Pressable
          style={[styles.postBtn, { backgroundColor: colors.primary }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowForm(true); }}
        >
          <Feather name="plus" size={18} color="#ffffff" />
          <Text style={styles.postBtnText}>نشر طلب توصيل جديد</Text>
        </Pressable>
      )}

      {showForm && (
        <NewJobForm colors={colors} onSubmit={handlePost} onClose={() => setShowForm(false)} />
      )}

      {active.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionTitle}>الطلبات النشطة</Text>
          {active.map((d) => (
            <DeliveryItem key={d.id} delivery={d} colors={colors} onPress={() => router.push(`/delivery/${d.id}`)} />
          ))}
        </View>
      )}

      {completed.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionTitle}>الطلبات المكتملة</Text>
          {completed.slice(0, 5).map((d) => (
            <DeliveryItem key={d.id} delivery={d} colors={colors} onPress={() => router.push(`/delivery/${d.id}`)} />
          ))}
        </View>
      )}

      {deliveries.length === 0 && !showForm && (
        <View style={{ alignItems: "center", paddingVertical: 40, gap: 10 }}>
          <MaterialCommunityIcons name="package-variant-closed" size={44} color={colors.mutedForeground} />
          <Text style={{ fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>
            لا توجد طلبات توصيل بعد
          </Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" }}>
            انقر على "نشر طلب توصيل جديد" للبدء
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    statsRow: { flexDirection: "row", gap: 10 },
    statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, gap: 4 },
    statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
    statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
    postBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, borderRadius: 14 },
    postBtnText: { color: "#ffffff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
    sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
  });
}
