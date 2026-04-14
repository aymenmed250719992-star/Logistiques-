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
  const [role, setRole] = useState<UserRole>("courier");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signUp(email.trim(), password, name.trim(), role);
      router.replace("/(tabs)");
    } catch (e: any) {
      const msg = e?.code === "auth/email-already-in-use"
        ? "This email is already in use."
        : e?.message ?? "Registration failed. Please try again.";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(colors);

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
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Join the platform as a Sender or Courier
          </Text>
        </View>

        <View style={styles.roleRow}>
          {(["courier", "sender"] as UserRole[]).map((r) => (
            <Pressable
              key={r}
              style={[
                styles.roleCard,
                {
                  backgroundColor: role === r ? colors.primary : colors.card,
                  borderColor: role === r ? colors.primary : colors.border,
                },
              ]}
              onPress={() => { Haptics.selectionAsync(); setRole(r); }}
            >
              <MaterialCommunityIcons
                name={r === "courier" ? "bike" : "store"}
                size={28}
                color={role === r ? "#ffffff" : colors.primary}
              />
              <Text style={[styles.roleLabel, { color: role === r ? "#ffffff" : colors.foreground }]}>
                {r === "courier" ? "Courier" : "Sender"}
              </Text>
              <Text style={[styles.roleDesc, { color: role === r ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>
                {r === "courier" ? "Deliver packages" : "Post deliveries"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.fields}>
            {[
              { label: "Full Name", value: name, set: setName, icon: "user", placeholder: "Alex Rivera", type: "default" as const },
              { label: "Email", value: email, set: setEmail, icon: "mail", placeholder: "you@example.com", type: "email-address" as const },
            ].map((f) => (
              <View key={f.label}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>{f.label}</Text>
                <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <Feather name={f.icon as any} size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    value={f.value}
                    onChangeText={f.set}
                    autoCapitalize={f.label === "Email" ? "none" : "words"}
                    keyboardType={f.type}
                  />
                </View>
              </View>
            ))}

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name="lock" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.destructive + "18" }]}>
                <Feather name="alert-circle" size={14} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.submitBtn, { backgroundColor: isLoading ? colors.mutedForeground : colors.primary }]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Feather name="user-plus" size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Create Account</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Already have an account?{" "}
          </Text>
          <Pressable onPress={() => router.push("/auth/login")}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
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
    errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 12 },
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
  });
}
