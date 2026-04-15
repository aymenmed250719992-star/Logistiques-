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

import CourierModeSelector from "@/components/CourierModeSelector";
import type { CourierMode } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const PACKAGE_SIZES = [
  { id: "small" as const, label: "Small", desc: "Envelope, docs", icon: "package" },
  { id: "medium" as const, label: "Medium", desc: "Shoebox size", icon: "box" },
  { id: "large" as const, label: "Large", desc: "Shopping bag+", icon: "archive" },
];

const EARNINGS: Record<string, number> = { small: 6, medium: 10, large: 15 };
const SPEED: Record<CourierMode, number> = { foot: 20, bicycle: 8, escooter: 6, car: 4 };
const MULTIPLIER: Record<CourierMode, number> = { foot: 1, bicycle: 1.2, escooter: 1.3, car: 1.5 };

export default function NewDeliveryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // FIX: use postDelivery (Firestore-backed) and user for senderId/senderName
  const { courierMode, postDelivery, user } = useApp();

  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [packageSize, setPackageSize] = useState<"small" | "medium" | "large">("small");
  const [selectedMode, setSelectedMode] = useState<CourierMode>(courierMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!pickupAddress.trim()) e.pickup = "Pickup address is required";
    if (!dropoffAddress.trim()) e.dropoff = "Dropoff address is required";
    if (!recipientName.trim()) e.recipient = "Recipient name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const distance = +(Math.random() * 4 + 0.5).toFixed(1);
    const estimatedMinutes = Math.round(distance * SPEED[selectedMode]);
    const earnings = +(EARNINGS[packageSize] * MULTIPLIER[selectedMode]).toFixed(2);

    try {
      // FIX: Build a FirestoreDelivery-compatible object and call postDelivery()
      await postDelivery({
        trackingId: `HLL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        status: "pending",
        senderId: user?.id ?? "anonymous",
        senderName: user?.name ?? "Sender",
        courierId: null,
        courierName: null,
        recipientName,
        packageSize,
        transportMode: selectedMode,   // NEW field name (was courierMode)
        pickup: {
          address: pickupAddress,
          lat: 37.7749 + (Math.random() - 0.5) * 0.05,
          lng: -122.4194 + (Math.random() - 0.5) * 0.05,
        },
        dropoff: {
          address: dropoffAddress,
          lat: 37.7749 + (Math.random() - 0.5) * 0.05,
          lng: -122.4194 + (Math.random() - 0.5) * 0.05,
        },
        estimatedMinutes,
        distance,
        earnings,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ submit: "Failed to create delivery. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.topBar, { paddingTop: Platform.OS === "web" ? 67 : insets.top, borderBottomColor: colors.border }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.foreground }]}>New Delivery</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 54 : insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Addresses */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Addresses</Text>
          <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.inputRow}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Pickup address"
                placeholderTextColor={colors.mutedForeground}
                value={pickupAddress}
                onChangeText={setPickupAddress}
              />
            </View>
            {errors.pickup && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.pickup}</Text>}
            <View style={[styles.inputDivider, { backgroundColor: colors.border }]} />
            <View style={styles.inputRow}>
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Dropoff address"
                placeholderTextColor={colors.mutedForeground}
                value={dropoffAddress}
                onChangeText={setDropoffAddress}
              />
            </View>
            {errors.dropoff && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.dropoff}</Text>}
          </View>
        </View>

        {/* Recipient */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recipient</Text>
          <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Recipient Name</Text>
            <TextInput
              style={[
                styles.inputPlain,
                {
                  color: colors.foreground,
                  borderBottomColor: errors.recipient ? colors.destructive : colors.border,
                },
              ]}
              placeholder="Who receives it?"
              placeholderTextColor={colors.mutedForeground}
              value={recipientName}
              onChangeText={setRecipientName}
            />
            {errors.recipient && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.recipient}</Text>}
          </View>
        </View>

        {/* Package Size */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Package Size</Text>
          <View style={styles.packageRow}>
            {PACKAGE_SIZES.map((size) => (
              <Pressable
                key={size.id}
                style={[
                  styles.packageCard,
                  {
                    backgroundColor: packageSize === size.id ? colors.primary : colors.card,
                    borderColor: packageSize === size.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { Haptics.selectionAsync(); setPackageSize(size.id); }}
              >
                <Feather name={size.icon as any} size={22} color={packageSize === size.id ? "#ffffff" : colors.primary} />
                <Text style={[styles.packageLabel, { color: packageSize === size.id ? "#ffffff" : colors.foreground }]}>
                  {size.label}
                </Text>
                <Text style={[styles.packageDesc, { color: packageSize === size.id ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>
                  {size.desc}
                </Text>
                <Text style={[styles.packageEarnings, { color: packageSize === size.id ? "rgba(255,255,255,0.9)" : colors.success }]}>
                  ${(EARNINGS[size.id] * MULTIPLIER[selectedMode]).toFixed(2)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Transport Mode */}
        <View style={styles.section}>
          <CourierModeSelector selected={selectedMode} onSelect={setSelectedMode} />
        </View>

        {/* Submit error */}
        {errors.submit && (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + "18" }]}>
            <Feather name="alert-circle" size={14} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive, flex: 1 }]}>{errors.submit}</Text>
          </View>
        )}

        {/* Submit */}
        <Pressable
          style={[styles.submitBtn, { backgroundColor: isSubmitting ? colors.mutedForeground : colors.primary }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? <><ActivityIndicator color="#ffffff" size="small" /><Text style={styles.submitText}>Creating...</Text></>
            : <><Feather name="check" size={18} color="#ffffff" /><Text style={styles.submitText}>Create Delivery</Text></>
          }
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
    },
    backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    topTitle: { flex: 1, textAlign: "center", fontSize: 16, fontFamily: "Inter_600SemiBold" },
    content: { padding: 20, gap: 20 },
    section: { gap: 10 },
    sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    inputGroup: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
    inputRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    input: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
    inputDivider: { height: 1, marginHorizontal: 14 },
    inputCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
    inputLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 4 },
    inputPlain: { fontSize: 14, fontFamily: "Inter_400Regular", paddingVertical: 6, borderBottomWidth: 1 },
    packageRow: { flexDirection: "row", gap: 10 },
    packageCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1.5, gap: 4 },
    packageLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 4 },
    packageDesc: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
    packageEarnings: { fontSize: 12, fontFamily: "Inter_700Bold", marginTop: 2 },
    errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 12 },
    errorText: { fontSize: 11, fontFamily: "Inter_400Regular", paddingHorizontal: 4, paddingBottom: 4 },
    submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, borderRadius: 14, marginTop: 8 },
    submitText: { color: "#ffffff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  });
}
