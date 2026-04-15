import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { UserRole } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"courier" | "sender">("sender");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [isCourierPending, setIsCourierPending] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("جميع الحقول مطلوبة.");
      return;
    }
    if (password.length < 6) {
      setError("يجب أن تكون كلمة المرور 6 أحرف على الأقل.");
      return;
    }
    setError("");
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signUp(email.trim(), password, name.trim(), role);
      if (role === "courier") {
        setIsCourierPending(true);
        setRegistered(true);
      } else {
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      const msg =
        e?.code === "auth/email-already-in-use"
          ? "هذا البريد الإلكتروني مستخدم بالفعل."
          : e?.code === "auth/weak-password"
          ? "كلمة المرور ضعيفة جداً. يجب أن تكون 6 أحرف على الأقل."
          : e?.code === "auth/invalid-email"
          ? "البريد الإلكتروني غير صالح."
          : "فشل إنشاء الحساب. يرجى المحاولة مجدداً.";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(colors);

  if (isCourierPending) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 32 }]}>
        <View style={[styles.pendingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.pendingIcon, { backgroundColor: "#f59e0b20" }]}>
            <Feather name="clock" size={40} color="#f59e0b" />
          </View>
          <Text style={[styles.pendingTitle, { color: colors.foreground }]}>
            طلبك قيد المراجعة
          </Text>
          <Text style={[styles.pendingDesc, { color: colors.mutedForeground }]}>
            تم إنشاء حسابك بنجاح! يحتاج حساب عامل التوصيل الخاص بك إلى موافقة المدير قبل التمكن من الدخول. سيتم إشعارك عند الموافقة.
          </Text>
          <Pressable
            style={[styles.backToLoginBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/auth/login")}
          >
            <Feather name="log-in" size={16} color="#fff" />
            <Text style={styles.backToLoginText}>العودة لتسجيل الدخول</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: botPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-right" size={20} color={colors.foreground} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>إنشاء حساب جديد</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            انضم إلى المنصة كمرسل أو عامل توصيل
          </Text>
        </View>

        <View style={styles.roleRow}>
          {([
            { key: "sender", label: "مرسل", desc: "أرسل الطرود", icon: "store" },
            { key: "courier", label: "عامل توصيل", desc: "وصّل الطرود", icon: "bike" },
          ] as const).map((r) => (
            <Pressable
              key={r.key}
              style={[
                styles.roleCard,
                {
                  backgroundColor: role === r.key ? colors.primary : colors.card,
                  borderColor: role === r.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setRole(r.key);
              }}
            >
              <MaterialCommunityIcons
                name={r.icon as any}
                size={28}
                color={role === r.key ? "#ffffff" : colors.primary}
              />
              <Text
                style={[
                  styles.roleLabel,
                  { color: role === r.key ? "#ffffff" : colors.foreground },
                ]}
              >
                {r.label}
              </Text>
              <Text
                style={[
                  styles.roleDesc,
                  {
                    color:
                      role === r.key ? "rgba(255,255,255,0.75)" : colors.mutedForeground,
                  },
                ]}
              >
                {r.desc}
              </Text>
            </Pressable>
          ))}
        </View>

        {role === "courier" && (
          <View
            style={[
              styles.infoBox,
              { backgroundColor: "#f59e0b18", borderColor: "#f59e0b" },
            ]}
          >
            <Feather name="info" size={14} color="#f59e0b" />
            <Text style={{ fontSize: 12, color: "#f59e0b", fontFamily: "Inter_400Regular", flex: 1 }}>
              حساب عامل التوصيل يحتاج موافقة المدير قبل التفعيل.
            </Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.fields}>
            {[
              {
                label: "الاسم الكامل",
                value: name,
                set: setName,
                icon: "user",
                placeholder: "أحمد محمد",
                type: "default" as const,
                capitalize: "words" as const,
              },
              {
                label: "البريد الإلكتروني",
                value: email,
                set: setEmail,
                icon: "mail",
                placeholder: "example@email.com",
                type: "email-address" as const,
                capitalize: "none" as const,
              },
            ].map((f) => (
              <View key={f.label}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>{f.label}</Text>
                <View
                  style={[
                    styles.inputRow,
                    { borderColor: colors.border, backgroundColor: colors.muted },
                  ]}
                >
                  <Feather name={f.icon as any} size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    value={f.value}
                    onChangeText={f.set}
                    autoCapitalize={f.capitalize}
                    keyboardType={f.type}
                    textAlign="right"
                  />
                </View>
              </View>
            ))}

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>كلمة المرور</Text>
              <View
                style={[
                  styles.inputRow,
                  { borderColor: colors.border, backgroundColor: colors.muted },
                ]}
              >
                <Feather name="lock" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="6 أحرف على الأقل"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textAlign="right"
                />
                <Pressable onPress={() => setShowPassword((v) => !v)}>
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={16}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </View>
            </View>

            {error ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: colors.destructive + "18" },
                ]}
              >
                <Feather name="alert-circle" size={14} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={[
                styles.submitBtn,
                {
                  backgroundColor: isLoading ? colors.mutedForeground : colors.primary,
                },
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Feather name="user-plus" size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>إنشاء الحساب</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            لديك حساب بالفعل؟{" "}
          </Text>
          <Pressable onPress={() => router.push("/auth/login")}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>تسجيل الدخول</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 24, gap: 20 },
    backBtn: { width: 36, height: 36, justifyContent: "center" },
    header: { gap: 6 },
    title: { fontSize: 26, fontFamily: "Inter_700Bold", color: colors.foreground },
    subtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
    roleRow: { flexDirection: "row", gap: 12 },
    roleCard: {
      flex: 1,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      borderWidth: 1.5,
      gap: 6,
    },
    roleLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    roleDesc: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
    infoBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 10,
      borderWidth: 1,
      padding: 12,
    },
    card: { borderRadius: 20, padding: 20, borderWidth: 1 },
    fields: { gap: 14 },
    label: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6 },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 10,
      padding: 12,
    },
    errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
    submitBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: 15,
      borderRadius: 14,
    },
    submitBtnText: { color: "#ffffff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
    footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
    footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    footerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    pendingCard: {
      borderRadius: 20,
      padding: 28,
      borderWidth: 1,
      alignItems: "center",
      gap: 16,
      maxWidth: 360,
      width: "100%",
    },
    pendingIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    pendingTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
    pendingDesc: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      lineHeight: 22,
    },
    backToLoginBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 14,
      marginTop: 8,
    },
    backToLoginText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  });
}
