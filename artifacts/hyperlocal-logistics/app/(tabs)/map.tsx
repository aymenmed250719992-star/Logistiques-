import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import DeliveryCard from "@/components/DeliveryCard";
import RouteOptimizer from "@/components/RouteOptimizer";
import type { Delivery } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const { height } = Dimensions.get("window");

const MODE_ICON: Record<string, string> = {
  foot: "walk",
  bicycle: "bike",
  escooter: "scooter",
  car: "car",
};

function WebMapPlaceholder({
  colors,
  deliveries,
  selectedDelivery,
}: {
  colors: ReturnType<typeof useColors>;
  deliveries: Delivery[];
  selectedDelivery: Delivery | null;
}) {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: colors.muted,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <MaterialCommunityIcons name="map-outline" size={48} color={colors.mutedForeground} />
      <Text
        style={{
          color: colors.foreground,
          fontFamily: "Inter_600SemiBold",
          fontSize: 15,
          marginTop: 8,
        }}
      >
        Live Delivery Map
      </Text>
      <Text
        style={{
          color: colors.mutedForeground,
          fontFamily: "Inter_400Regular",
          fontSize: 12,
          marginTop: 4,
          textAlign: "center",
          paddingHorizontal: 24,
        }}
      >
        {selectedDelivery
          ? `${selectedDelivery.pickup.address} → ${selectedDelivery.dropoff.address}`
          : `${deliveries.length} active route${deliveries.length !== 1 ? "s" : ""} in San Francisco`}
      </Text>
      {deliveries.slice(0, 3).map((d) => (
        <View
          key={d.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
            backgroundColor: colors.card,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                d.status === "in_transit" ? colors.primary : colors.warning,
            }}
          />
          <Text
            style={{
              fontSize: 11,
              color: colors.foreground,
              fontFamily: "Inter_500Medium",
            }}
          >
            {d.trackingId} · {d.distance} mi
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deliveries, activeDelivery, courierMode } = useApp();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(activeDelivery);
  const mapRef = useRef<MapView>(null);
  const isWeb = Platform.OS === "web";

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const handleDeliveryPress = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    if (!isWeb && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: (delivery.pickup.lat + delivery.dropoff.lat) / 2,
          longitude: (delivery.pickup.lng + delivery.dropoff.lng) / 2,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        600
      );
    }
  };

  const activeDeliveries = deliveries.filter(
    (d) => d.status === "in_transit" || d.status === "pending"
  );

  const initialRegion = selectedDelivery
    ? {
        latitude: (selectedDelivery.pickup.lat + selectedDelivery.dropoff.lat) / 2,
        longitude: (selectedDelivery.pickup.lng + selectedDelivery.dropoff.lng) / 2,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }
    : {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.mapContainer, { height: height * 0.45 }]}>
        {isWeb ? (
          <WebMapPlaceholder
            colors={colors}
            deliveries={activeDeliveries}
            selectedDelivery={selectedDelivery}
          />
        ) : (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_DEFAULT}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {activeDeliveries.map((delivery) => (
              <React.Fragment key={delivery.id}>
                <Marker
                  coordinate={{ latitude: delivery.pickup.lat, longitude: delivery.pickup.lng }}
                  title="Pickup"
                  description={delivery.pickup.address}
                  pinColor={colors.primary}
                />
                <Marker
                  coordinate={{
                    latitude: delivery.dropoff.lat,
                    longitude: delivery.dropoff.lng,
                  }}
                  title="Dropoff"
                  description={delivery.dropoff.address}
                  pinColor={colors.accent}
                />
                <Polyline
                  coordinates={[
                    { latitude: delivery.pickup.lat, longitude: delivery.pickup.lng },
                    { latitude: delivery.dropoff.lat, longitude: delivery.dropoff.lng },
                  ]}
                  strokeColor={
                    selectedDelivery?.id === delivery.id ? colors.primary : colors.border
                  }
                  strokeWidth={selectedDelivery?.id === delivery.id ? 4 : 2}
                  lineDashPattern={[8, 4]}
                />
              </React.Fragment>
            ))}
          </MapView>
        )}

        <View style={[styles.mapOverlayTop, { top: topPadding + 12 }]}>
          <View style={[styles.modeChip, { backgroundColor: colors.card + "ee" }]}>
            <MaterialCommunityIcons
              name={MODE_ICON[courierMode] as any}
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.modeChipText, { color: colors.foreground }]}>
              {courierMode === "escooter"
                ? "E-Scooter"
                : courierMode.charAt(0).toUpperCase() + courierMode.slice(1)}
            </Text>
          </View>
        </View>

        {!isWeb && (
          <Pressable
            style={[styles.myLocationBtn, { backgroundColor: colors.card, bottom: 16 }]}
            onPress={() => {
              mapRef.current?.animateToRegion(
                {
                  latitude: 37.7749,
                  longitude: -122.4194,
                  latitudeDelta: 0.08,
                  longitudeDelta: 0.08,
                },
                600
              );
            }}
          >
            <Feather name="crosshair" size={18} color={colors.primary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.bottomSheet}
        contentContainerStyle={[
          styles.bottomContent,
          {
            paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 84,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeDeliveries.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="map-marker-off"
              size={40}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No active deliveries
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Create a new delivery to see it on the map
            </Text>
            <Pressable
              style={[styles.newDeliveryBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/delivery/new")}
            >
              <Feather name="plus" size={16} color="#ffffff" />
              <Text style={styles.newDeliveryText}>New Delivery</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Active Routes
              </Text>
              <Text style={[styles.count, { color: colors.mutedForeground }]}>
                {activeDeliveries.length}
              </Text>
            </View>
            {activeDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onPress={handleDeliveryPress}
                compact
              />
            ))}

            {selectedDelivery && (
              <RouteOptimizer
                pickupAddress={selectedDelivery.pickup.address}
                dropoffAddress={selectedDelivery.dropoff.address}
                courierMode={courierMode}
                distance={selectedDelivery.distance}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    mapContainer: { width: "100%" },
    mapOverlayTop: {
      position: "absolute",
      left: 16,
      right: 16,
      flexDirection: "row",
      justifyContent: "flex-start",
    },
    modeChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    modeChipText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
    myLocationBtn: {
      position: "absolute",
      right: 16,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    bottomSheet: {
      flex: 1,
      backgroundColor: colors.background,
    },
    bottomContent: {
      padding: 16,
      gap: 12,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      flex: 1,
    },
    count: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
      gap: 10,
    },
    emptyTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
    emptyText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    newDeliveryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 8,
    },
    newDeliveryText: {
      color: "#ffffff",
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
  });
}
