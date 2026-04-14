import { Feather } from "@expo/vector-icons";
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

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      const msg = e?.code === "auth/invalid-credential"
        ? "Invalid email or password."
        : e?.message ?? "Login failed. Please try again.";
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
        <View style={styles.logoArea}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Feather name="package" size={32} color="#ffffff" />
          </View>
          <Text style={styles.appName}>Hyper-Local</Text>
          <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>
            AI Logistics Platform
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
            Sign in to continue
          </Text>

          <View style={styles.fields}>
            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name="mail" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name="lock" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
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
              <View style={[styles.errorBox, { backgroundColor: colors.destructive + "18" }]}>
                <Feather name="alert-circle" size={14} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.loginBtn, { backgroundColor: isLoading ? colors.mutedForeground : colors.primary }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Feather name="log-in" size={16} color="#ffffff" />
                  <Text style={styles.loginBtnText}>Sign In</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Don't have an account?{" "}
          </Text>
          <Pressable onPress={() => router.push("/auth/register")}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Text>
          </Pressable>
        </View>

        <View style={[styles.demoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Text style={[styles.demoTitle, { color: colors.primary }]}>Demo Accounts</Text>
          <Pressable onPress={() => { setEmail("sender@demo.com"); setPassword("demo123"); }}>
            <Text style={[styles.demoItem, { color: colors.mutedForeground }]}>
              Sender: sender@demo.com / demo123
            </Text>
          </Pressable>
          <Pressable onPress={() => { setEmail("courier@demo.com"); setPassword("demo123"); }}>
            <Text style={[styles.demoItem, { color: colors.mutedForeground }]}>
              Courier: courier@demo.com / demo123
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 24, gap: 24 },
    logoArea: { alignItems: "center", gap: 10 },
    logoCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    appName: {
      fontSize: 28,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      letterSpacing: -0.5,
    },
    appTagline: { fontSize: 13, fontFamily: "Inter_400Regular" },
    card: {
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      gap: 20,
    },
    cardTitle: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    cardSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: -12 },
    fields: { gap: 16 },
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
    input: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
    },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 10,
      padding: 12,
    },
    errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
    loginBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: 15,
      borderRadius: 14,
    },
    loginBtnText: { color: "#ffffff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
    footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
    footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    footerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    demoBox: {
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      gap: 6,
    },
    demoTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    demoItem: { fontSize: 12, fontFamily: "Inter_400Regular" },
  });
}
