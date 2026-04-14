import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { CourierMode } from "@/context/AppContext";
import type { RouteOptimizationResult } from "@/services/geminiService";
import { optimizeRoute } from "@/services/geminiService";
import { useColors } from "@/hooks/useColors";

interface RouteOptimizerProps {
  pickupAddress: string;
  dropoffAddress: string;
  courierMode: CourierMode;
  distance: number;
  weather?: string;
}

const MODE_ICON: Record<string, string> = {
  foot: "walk",
  bicycle: "bike",
  escooter: "scooter",
  car: "car",
};

export default function RouteOptimizer({
  pickupAddress,
  dropoffAddress,
  courierMode,
  distance,
  weather = "Clear",
}: RouteOptimizerProps) {
  const colors = useColors();
  const [result, setResult] = useState<RouteOptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await optimizeRoute({
        pickupAddress,
        dropoffAddress,
        courierMode,
        weatherCondition: weather,
        distance,
      });
      setResult(data);
    } catch {
      setError("Unable to optimize route. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="robot-excited-outline" size={20} color={colors.primary} />
        <Text style={styles.title}>AI Route Optimizer</Text>
        <Text style={styles.badge}>Gemini AI</Text>
      </View>

      {!result && !loading && (
        <View style={styles.promptSection}>
          <Text style={styles.promptText}>
            Get AI-powered route suggestions optimized for {courierMode === "escooter" ? "e-scooter" : courierMode} and current weather.
          </Text>
          <Pressable style={styles.optimizeBtn} onPress={handleOptimize}>
            <Feather name="zap" size={16} color="#ffffff" />
            <Text style={styles.optimizeBtnText}>Optimize Route</Text>
          </Pressable>
        </View>
      )}

      {loading && (
        <View style={styles.loadingSection}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.loadingText}>Analyzing route with Gemini AI...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorSection}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={handleOptimize}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </Pressable>
        </View>
      )}

      {result && (
        <View style={styles.resultSection}>
          <View style={styles.recommendRow}>
            <MaterialCommunityIcons
              name={MODE_ICON[result.recommendedMode] as any}
              size={22}
              color={colors.primary}
            />
            <View style={styles.recommendText}>
              <Text style={styles.recommendLabel}>Recommended Mode</Text>
              <Text style={styles.recommendMode}>
                {result.recommendedMode.replace("escooter", "E-Scooter").toUpperCase()} · {result.estimatedMinutes} min
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.routeSummary}>{result.routeSummary}</Text>

          <View style={styles.weatherRow}>
            <Feather name="cloud" size={13} color={colors.accent} />
            <Text style={styles.weatherText}>{result.weatherAdvice}</Text>
          </View>

          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Tips</Text>
            {result.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {result.alternativeMode && (
            <View style={styles.alternativeRow}>
              <MaterialCommunityIcons
                name={MODE_ICON[result.alternativeMode] as any}
                size={14}
                color={colors.mutedForeground}
              />
              <Text style={styles.alternativeText}>
                Alternative: {result.alternativeMode.replace("escooter", "E-Scooter")} in {result.alternativeMinutes} min
              </Text>
            </View>
          )}

          <Pressable style={styles.rerunBtn} onPress={handleOptimize}>
            <Feather name="refresh-cw" size={13} color={colors.primary} />
            <Text style={[styles.rerunText, { color: colors.primary }]}>Re-analyze</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    title: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      flex: 1,
    },
    badge: {
      fontSize: 10,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
      backgroundColor: colors.secondary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
    },
    promptSection: {
      gap: 12,
    },
    promptText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
    },
    optimizeBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    optimizeBtnText: {
      color: "#ffffff",
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
    loadingSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
    },
    loadingText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    errorSection: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    errorText: {
      fontSize: 13,
      color: colors.destructive,
      fontFamily: "Inter_400Regular",
    },
    retryText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
    resultSection: {
      gap: 12,
    },
    recommendRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 12,
    },
    recommendText: {
      flex: 1,
    },
    recommendLabel: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    recommendMode: {
      fontSize: 14,
      color: colors.primary,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.5,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    routeSummary: {
      fontSize: 13,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      lineHeight: 20,
    },
    weatherRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    weatherText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      flex: 1,
    },
    tipsSection: {
      gap: 6,
    },
    tipsTitle: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      marginBottom: 2,
    },
    tipRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    tipDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      marginTop: 6,
    },
    tipText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      flex: 1,
      lineHeight: 18,
    },
    alternativeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.muted,
      borderRadius: 8,
      padding: 10,
    },
    alternativeText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    rerunBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-end",
    },
    rerunText: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
    },
  });
}
