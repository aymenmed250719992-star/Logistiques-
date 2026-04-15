import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function Index() {
  const { currentUser, userProfile, isLoading, isAdmin } = useAuth();
  const colors = useColors();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (currentUser) {
    if (isAdmin) {
      return <Redirect href="/admin" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/welcome" />;
}
