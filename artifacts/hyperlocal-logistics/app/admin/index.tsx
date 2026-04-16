import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { router } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { subscribeToAllUsers, getAllUsers, approveCourier, rejectCourier } from "@/services/firestoreService";
import { checkFirestoreConnection, type FirestoreStatus } from "@/services/firebase";
import type { FirestoreUser } from "@/services/authService";

type UserWithId = FirestoreUser & { id: string };

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signOut, currentUser } = useAuth();

  const [users, setUsers] = useState<UserWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<FirestoreStatus>("checking");

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  // فحص اتصال Firestore عند التحميل
  useEffect(() => {
    checkFirestoreConnection().then(setDbStatus);
  }, []);

  // اشتراك لحظي بقاعدة البيانات — مع بديل احتياطي
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsub = subscribeToAllUsers(
      (data) => {
        setUsers(data as unknown as UserWithId[]);
        setLoading(false);
        setRefreshing(false);
        setError(null);
      },
      async (err) => {
        // إذا فشل الاشتراك، نحاول جلب البيانات مرة واحدة
        console.warn("Subscription failed, trying fallback:", err.message);
        try {
          const data = await getAllUsers();
          setUsers(data as unknown as UserWithId[]);
          setError(null);
        } catch (e2) {
          setError("تعذّر تحميل المستخدمين. تحقق من إعدادات Firestore.");
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      }
    );
    return unsub;
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getAllUsers();
      setUsers(data as unknown as UserWithId[]);
    } catch {
      // يعتمد على الاشتراك اللحظي
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleApprove = async (uid: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await approveCourier(uid);
  };

  const handleReject = async (uid: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await rejectCourier(uid);
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      !searchId.trim() ||
      u.customerId?.toLowerCase().includes(searchId.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(searchId.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchId.toLowerCase());

    if (activeTab === "pending") {
      return u.role === "courier" && u.approvalStatus === "pending" && matchesSearch;
    }
    return matchesSearch && u.role !== "admin";
  });

  const pendingCount = users.filter(
    (u) => u.role === "courier" && u.approvalStatus === "pending"
  ).length;

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>لوحة الإدارة</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            إدارة المستخدمين والعمال
          </Text>
        </View>
        <Pressable
          style={[styles.signOutBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={async () => { await signOut(); router.replace("/welcome"); }}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
        </Pressable>
      </View>

      {/* Firestore not-found banner */}
      {dbStatus === "not-found" && (
        <View style={[styles.errorBanner, { backgroundColor: "#f59e0b18", borderColor: "#f59e0b60" }]}>
          <MaterialCommunityIcons name="database-alert" size={18} color="#f59e0b" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.errorTitle, { color: "#f59e0b" }]}>قاعدة Firestore غير مُنشأة</Text>
            <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
              افتح: console.firebase.google.com/project/logistiques/firestore وأنشئ قاعدة البيانات
            </Text>
          </View>
        </View>
      )}

      {/* Generic error banner */}
      {error && dbStatus !== "not-found" && (
        <View style={[styles.errorBanner, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "40" }]}>
          <Feather name="alert-circle" size={16} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      )}

      {/* Stats Row */}
      <View style={[styles.statsRow, { paddingHorizontal: 20 }]}>
        {[
          { label: "إجمالي المستخدمين", value: String(users.filter((u) => u.role !== "admin").length), color: colors.primary, icon: "users" as const },
          { label: "عمال بانتظار الموافقة", value: String(pendingCount), color: colors.warning, icon: "clock" as const },
          { label: "مستخدمون موافق عليهم", value: String(users.filter((u) => u.approvalStatus === "approved" && u.role !== "admin").length), color: colors.success, icon: "check-circle" as const },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name={s.icon} size={16} color={s.color} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { paddingHorizontal: 20 }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="ابحث بالرقم التعريفي أو الاسم أو البريد..."
            placeholderTextColor={colors.mutedForeground}
            value={searchId}
            onChangeText={setSearchId}
            autoCapitalize="none"
            textAlign="right"
          />
          {searchId ? (
            <Pressable onPress={() => setSearchId("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { paddingHorizontal: 20 }]}>
        {([
          { key: "pending", label: `بانتظار الموافقة (${pendingCount})` },
          { key: "all", label: "جميع المستخدمين" },
        ] as const).map((t) => (
          <Pressable
            key={t.key}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === t.key ? colors.primary : colors.card,
                borderColor: activeTab === t.key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === t.key ? "#fff" : colors.foreground },
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            جاري التحميل...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="account-search-outline"
                size={48}
                color={colors.mutedForeground}
              />
              <Text style={[styles.emptyText, { color: colors.foreground }]}>
                {activeTab === "pending" ? "لا يوجد عمال بانتظار الموافقة" : "لا يوجد مستخدمون"}
              </Text>
            </View>
          ) : (
            filtered.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                colors={colors}
                onApprove={() => handleApprove(user.id)}
                onReject={() => handleReject(user.id)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

interface UserCardProps {
  user: UserWithId;
  colors: ReturnType<typeof useColors>;
  onApprove: () => void;
  onReject: () => void;
}

function UserCard({ user, colors, onApprove, onReject }: UserCardProps) {
  const [loadingAction, setLoadingAction] = useState<"approve" | "reject" | null>(null);

  const roleLabels: Record<string, string> = {
    sender: "مرسل",
    courier: "عامل توصيل",
    admin: "مدير",
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "بانتظار الموافقة", color: "#f59e0b" },
    approved: { label: "موافق عليه", color: "#10b981" },
    rejected: { label: "مرفوض", color: "#ef4444" },
  };

  const statusInfo = statusLabels[user.approvalStatus] ?? statusLabels.pending;
  const isPending = user.approvalStatus === "pending" && user.role === "courier";

  const handle = async (action: "approve" | "reject") => {
    setLoadingAction(action);
    try {
      if (action === "approve") await onApprove();
      else await onReject();
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: isPending ? "#f59e0b" : colors.border,
        marginBottom: 12,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" }}>
            {user.displayName?.charAt(0)?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: colors.foreground }}>
            {user.displayName}
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
            {user.email}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: statusInfo.color + "20",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 11, color: statusInfo.color, fontFamily: "Inter_600SemiBold" }}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <InfoChip icon="hash" label={user.customerId ?? "—"} colors={colors} />
        <InfoChip
          icon="briefcase"
          label={roleLabels[user.role] ?? user.role}
          colors={colors}
        />
        {user.role === "courier" && (
          <InfoChip icon="star" label={`${user.rating?.toFixed(1) ?? "5.0"} ★`} colors={colors} />
        )}
      </View>

      {isPending && (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            style={{
              flex: 1,
              backgroundColor: colors.success,
              borderRadius: 10,
              padding: 10,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
            onPress={() => handle("approve")}
            disabled={loadingAction !== null}
          >
            {loadingAction === "approve" ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="check" size={14} color="#fff" />
                <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                  قبول
                </Text>
              </>
            )}
          </Pressable>
          <Pressable
            style={{
              flex: 1,
              backgroundColor: colors.destructive,
              borderRadius: 10,
              padding: 10,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
            onPress={() => handle("reject")}
            disabled={loadingAction !== null}
          >
            {loadingAction === "reject" ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="x" size={14} color="#fff" />
                <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                  رفض
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

function InfoChip({
  icon,
  label,
  colors,
}: {
  icon: any;
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: colors.muted,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
      }}
    >
      <Feather name={icon} size={11} color={colors.mutedForeground} />
      <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
        {label}
      </Text>
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
    headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
    headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
    signOutBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    errorTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 2 },
    errorText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, textAlign: "right" },
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    statCard: {
      flex: 1,
      borderRadius: 14,
      padding: 10,
      alignItems: "center",
      borderWidth: 1,
      gap: 4,
    },
    statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
    statLabel: { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center" },
    searchRow: { marginBottom: 12 },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
    tabRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1 },
    tabText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    list: { paddingHorizontal: 20, paddingTop: 4 },
    loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    emptyBox: { alignItems: "center", paddingVertical: 60, gap: 12 },
    emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  });
}
