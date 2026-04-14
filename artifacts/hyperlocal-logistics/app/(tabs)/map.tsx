import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import type { FirestoreDelivery } from "@/services/firestoreService";
import {
  subscribeToAllCourierLocations,
  type CourierLocation,
} from "@/services/firestoreService";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
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
  courierLocations,
}: {
  colors: ReturnType<typeof useColors>;
  deliveries: FirestoreDelivery[];
  selectedDelivery: FirestoreDelivery | null;
  courierLocations: CourierLocation[];
}) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center", gap: 10 }]}>
      <MaterialCommunityIcons name="map-outline" size={48} color={colors.mutedForeground} />
      <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
        Live Delivery Map
      </Text>
      <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", paddingHorizontal: 24 }}>
        {selectedDelivery
          ? `${selectedDelivery.pickup.address} → ${selectedDelivery.dropoff.address}`
          : `${deliveries.length} route${deliveries.length !== 1 ? "s" : ""} • ${courierLocations.length} courier${courierLocations.length !== 1 ? "s" : ""} live`}
      </Text>
      {courierLocations.slice(0, 3).map((loc) => (
        <View key={loc.courierId} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.primary + "40" }}>
          <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.accent }} />
          <MaterialCommunityIcons name={MODE_ICON[loc.transportMode] as any} size={13} color={colors.primary} />
          <Text style={{ fontSize: 11, color: colors.foreground, fontFamily: "Inter_500Medium" }}>
            Courier live • {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
          </Text>
        </View>
      ))}
      {deliveries.slice(0, 3).map((d) => (
        <View key={d.id} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.status === "in_transit" ? colors.primary : colors.warning }} />
          <Text style={{ fontSize: 11, color: colors.foreground, fontFamily: "Inter_500Medium" }}>
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
  const { currentUser, userProfile } = useAuth();
  const [selectedDelivery, setSelectedDelivery] = useState<FirestoreDelivery | null>(activeDelivery);
  const [courierLocations, setCourierLocations] = useState<CourierLocation[]>([]);
  const mapRef = useRef<MapView>(null);
  const isWeb = Platform.OS === "web";
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  // Subscribe to all live courier locations
  useEffect(() => {
    const unsub = subscribeToAllCourierLocations(setCourierLocations);
    return unsub;
  }, []);

  const activeDeliveries = deliveries.filter((d) => d.status === "in_transit" || d.status === "pending");

  const handleDeliveryPress = (delivery: FirestoreDelivery) => {
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

  const initialRegion = selectedDelivery
    ? {
        latitude: (selectedDelivery.pickup.lat + selectedDelivery.dropoff.lat) / 2,
        longitude: (selectedDelivery.pickup.lng + selectedDelivery.dropoff.lng) / 2,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }
    : { latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.08, longitudeDelta: 0.08 };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.mapContainer, { height: height * 0.45 }]}>
        {isWeb ? (
          <WebMapPlaceholder
            colors={colors}
            deliveries={activeDeliveries}
            selectedDelivery={selectedDelivery}
            courierLocations={courierLocations}
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
            {/* Delivery pickup/dropoff markers */}
            {activeDeliveries.map((delivery) => (
              <React.Fragment key={delivery.id}>
                <Marker coordinate={{ latitude: delivery.pickup.lat, longitude: delivery.pickup.lng }} title="Pickup" description={delivery.pickup.address} pinColor={colors.primary} />
                <Marker coordinate={{ latitude: delivery.dropoff.lat, longitude: delivery.dropoff.lng }} title="Dropoff" description={delivery.dropoff.address} pinColor={colors.accent} />
                <Polyline
                  coordinates={[
                    { latitude: delivery.pickup.lat, longitude: delivery.pickup.lng },
                    { latitude: delivery.dropoff.lat, longitude: delivery.dropoff.lng },
                  ]}
                  strokeColor={selectedDelivery?.id === delivery.id ? colors.primary : colors.border}
                  strokeWidth={selectedDelivery?.id === delivery.id ? 4 : 2}
                  lineDashPattern={[8, 4]}
                />
              </React.Fragment>
            ))}

            {/* Live courier location dots */}
            {courierLocations.map((loc) => (
              <Marker
                key={loc.courierId}
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                title={`Courier (${loc.transportMode})`}
              >
                <View style={{ backgroundColor: colors.accent, borderRadius: 16, padding: 6, borderWidth: 2, borderColor: "#ffffff" }}>
                  <MaterialCommunityIcons name={MODE_ICON[loc.transportMode] as any} size={14} color="#ffffff" />
                </View>
              </Marker>
            ))}
          </MapView>
        )}

        {/* Mode chip */}
        <View style={[styles.mapOverlayTop, { top: topPadding + 12 }]}>
          <View style={[styles.modeChip, { backgroundColor: colors.card + "ee" }]}>
            <MaterialCommunityIcons name={MODE_ICON[courierMode] as any} size={16} color={colors.primary} />
            <Text style={[styles.modeChipText, { color: colors.foreground }]}>
              {courierMode === "escooter" ? "E-Scooter" : courierMode.charAt(0).toUpperCase() + courierMode.slice(1)}
            </Text>
          </View>

          {/* Live couriers badge */}
          {courierLocations.length > 0 && (
            <View style={[styles.modeChip, { backgroundColor: colors.accent + "ee", marginLeft: 8 }]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#ffffff" }} />
              <Text style={[styles.modeChipText, { color: "#ffffff" }]}>
                {courierLocations.length} live
              </Text>
            </View>
          )}
        </View>

        {!isWeb && (
          <Pressable
            style={[styles.myLocationBtn, { backgroundColor: colors.card, bottom: 16 }]}
            onPress={() => mapRef.current?.animateToRegion({ latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.08, longitudeDelta: 0.08 }, 600)}
          >
            <Feather name="crosshair" size={18} color={colors.primary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.bottomSheet}
        contentContainerStyle={[styles.bottomContent, { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 84 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeDeliveries.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="map-marker-off" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No active deliveries</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {userProfile?.role === "sender" ? "Post a job to see it on the map" : "Accept a job to start tracking"}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Routes</Text>
              <Text style={[styles.count, { color: colors.mutedForeground }]}>{activeDeliveries.length}</Text>
            </View>
            {activeDeliveries.map((delivery) => (
              <DeliveryCard key={delivery.id} delivery={delivery as any} onPress={() => handleDeliveryPress(delivery)} compact />
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
    mapOverlayTop: { position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "center" },
    modeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    modeChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    myLocationBtn: { position: "absolute", right: 16, width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    bottomSheet: { flex: 1, backgroundColor: colors.background },
    bottomContent: { padding: 16, gap: 12 },
    sectionHeader: { flexDirection: "row", alignItems: "center" },
    sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1 },
    count: { fontSize: 14, fontFamily: "Inter_400Regular" },
    emptyState: { alignItems: "center", paddingVertical: 40, gap: 10 },
    emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  });
}
