import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import type { CourierMode } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface CourierModeSelectorProps {
  selected: CourierMode;
  onSelect: (mode: CourierMode) => void;
  label?: string;
}

const MODES: Array<{
  id: CourierMode;
  label: string;
  icon: string;
  description: string;
  speed: string;
}> = [
  {
    id: "foot",
    label: "Walking",
    icon: "walk",
    description: "Up to 1 mile",
    speed: "3 mph",
  },
  {
    id: "bicycle",
    label: "Bicycle",
    icon: "bike",
    description: "Up to 5 miles",
    speed: "12 mph",
  },
  {
    id: "escooter",
    label: "E-Scooter",
    icon: "scooter",
    description: "Up to 8 miles",
    speed: "15 mph",
  },
  {
    id: "car",
    label: "Car",
    icon: "car",
    description: "Any distance",
    speed: "25 mph",
  },
];

function ModeCard({
  mode,
  selected,
  onSelect,
  colors,
}: {
  mode: typeof MODES[0];
  selected: boolean;
  onSelect: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[
          styles.modeCard,
          {
            backgroundColor: selected ? colors.primary : colors.card,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSelect();
        }}
      >
        <MaterialCommunityIcons
          name={mode.icon as any}
          size={28}
          color={selected ? "#ffffff" : colors.primary}
        />
        <Text
          style={[
            styles.modeLabel,
            { color: selected ? "#ffffff" : colors.foreground },
          ]}
        >
          {mode.label}
        </Text>
        <Text
          style={[
            styles.modeSpeed,
            { color: selected ? "rgba(255,255,255,0.75)" : colors.mutedForeground },
          ]}
        >
          {mode.speed}
        </Text>
        <Text
          style={[
            styles.modeDesc,
            { color: selected ? "rgba(255,255,255,0.65)" : colors.mutedForeground },
          ]}
        >
          {mode.description}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function CourierModeSelector({
  selected,
  onSelect,
  label = "Select Transport Mode",
}: CourierModeSelectorProps) {
  const colors = useColors();

  return (
    <View>
      {label ? <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {MODES.map((mode) => (
          <ModeCard
            key={mode.id}
            mode={mode}
            selected={selected === mode.id}
            onSelect={() => onSelect(mode.id)}
            colors={colors}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  row: {
    gap: 10,
    paddingRight: 4,
  },
  modeCard: {
    width: 100,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1.5,
    gap: 4,
  },
  modeLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
    textAlign: "center",
  },
  modeSpeed: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  modeDesc: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
