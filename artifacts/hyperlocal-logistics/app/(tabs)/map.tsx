import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  subscribeToAllCourierLocations,
  type CourierLocation,
  type FirestoreDelivery,
} from "@/services/firestoreService";

const MODE_ICON: Record<string, string> = {
  foot: "walk",
  bicycle: "bike",
  escooter: "scooter",
  car: "car",
};

const MODE_LABEL: Record<string, string> = {
  foot: "مشي",
  bicycle: "دراجة",
  escooter: "سكوتر",
  car: "سيارة",
};

function openInGoogleMaps(pickup: { address: string; lat: number; lng: number }, dropoff: { address: string; lat: number; lng: number }) {
  const origin = `${pickup.lat},${pickup.lng}`;
  const destination = `${dropoff.lat},${dropoff.lng}`;
  const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  Linking.openURL(url);
}

function openSingleLocationInMaps(lat: number, lng: number, label: string) {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  Linking.openURL(url);
}

function MapEmbed({ pickup, dropoff, colors }: {
  pickup: { lat: number; lng: number; address: string };
  dropoff: { lat: number; lng: number; address: string };
  colors: ReturnType<typeof useColors>;
}) {
  if (Platform.OS !== "web") return null;

  const centerLat = (pickup.lat + dropoff.lat) / 2;
  const centerLng = (pickup.lng + dropoff.lng) / 2;
  const zoom = 13;

  const osmUrl =
    `https://www.openstreetmap.org/export/embed.html?bbox=` +
    `${centerLng - 0.03},${centerLat - 0.02},${centerLng + 0.03},${centerLat + 0.02}` +
    `&layer=mapnik` +
    `&marker=${centerLat},${centerLng}`;

  return (
    <iframe
      src={osmUrl}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        borderRadius: 0,
      }}
      title="خريطة التوصيل"
    />
  );
}

function EmptyMapView({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center", gap: 12 }]}>
      <MaterialCommunityIcons name="map-search-outline" size={52} color={colors.mutedForeground} />
      <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
        لا توجد توصيلات نشطة
      </Text>
      <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", paddingHorizontal: 32 }}>
        اختر توصيلاً لعرض المسار على الخريطة
      </Text>
    </View>
  );
}

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deliveries, courierMode } = useApp();
  const { userProfile } = useAuth();
  const [selected, setSelected] = useState<FirestoreDelivery | null>(null);
  const [courierLocations, setCourierLocations] = useState<CourierLocation[]>([]);
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const botPad = isWeb ? 34 + 84 : insets.bottom + 84;

  useEffect(() => {
    const unsub = subscribeToAllCourierLocations(setCourierLocations);
    return unsub;
  }, []);

  useEffect(() => {
    if (!selected && deliveries.length > 0) {
      const active = deliveries.find((d) => d.status === "in_transit" || d.status === "pending");
      if (active) setSelected(active);
    }
  }, [deliveries]);

  const activeDeliveries = deliveries.filter(
    (d) => d.status === "in_transit" || d.status === "pending"
  );

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Map area */}
      <View style={[styles.mapContainer, { paddingTop: topPad }]}>
        <View style={styles.mapBox}>
          {selected ? (
            <MapEmbed pickup={selected.pickup} dropoff={selected.dropoff} colors={colors} />
          ) : (
            <EmptyMapView colors={colors} />
          )}

          {/* Live badge */}
          {courierLocations.length > 0 && (
            <View style={[styles.liveBadge, { backgroundColor: colors.accent }]}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>{courierLocations.length} عامل مباشر</Text>
            </View>
          )}

          {/* Mode chip */}
          <View style={[styles.modeChip, { backgroundColor: colors.card + "ee" }]}>
            <MaterialCommunityIcons name={MODE_ICON[courierMode] as any} size={14} color={colors.primary} />
            <Text style={[styles.modeChipText, { color: colors.foreground }]}>
              {MODE_LABEL[courierMode]}
            </Text>
          </View>
        </View>

        {/* Google Maps buttons */}
        {selected && (
          <View style={styles.mapActions}>
            <Pressable
              style={[styles.mapsBtn, { backgroundColor: colors.primary, flex: 2 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                openInGoogleMaps(selected.pickup, selected.dropoff);
              }}
            >
              <MaterialCommunityIcons name="google-maps" size={18} color="#fff" />
              <Text style={styles.mapsBtnText}>فتح المسار في Google Maps</Text>
            </Pressable>
            <Pressable
              style={[styles.mapsBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flex: 1 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                openSingleLocationInMaps(selected.dropoff.lat, selected.dropoff.lng, selected.dropoff.address);
              }}
            >
              <MaterialCommunityIcons name="map-marker" size={16} color={colors.accent} />
              <Text style={[styles.mapsBtnText, { color: colors.foreground }]}>وجهة التوصيل</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Bottom list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.listContent, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {activeDeliveries.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="package-variant-closed" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد توصيلات نشطة</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {userProfile?.role === "sender"
                ? "أضف طلب توصيل جديد لمتابعته هنا"
                : "اقبل طلباً لبدء التتبع"}
            </Text>
            {userProfile?.role === "sender" && (
              <Pressable
                style={[styles.newBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/delivery/new")}
              >
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.newBtnText}>طلب توصيل جديد</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>التوصيلات النشطة</Text>
              <View style={[styles.countBadge, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.countText, { color: colors.primary }]}>{activeDeliveries.length}</Text>
              </View>
            </View>

            {activeDeliveries.map((d) => (
              <Pressable
                key={d.id}
                style={[
                  styles.deliveryCard,
                  {
                    backgroundColor: selected?.id === d.id ? colors.primary + "12" : colors.card,
                    borderColor: selected?.id === d.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelected(d);
                }}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.statusDot, { backgroundColor: d.status === "in_transit" ? colors.accent : colors.warning }]} />
                  <Text style={[styles.trackingId, { color: colors.foreground }]}>{d.trackingId}</Text>
                  <Text style={[styles.distance, { color: colors.mutedForeground }]}>
                    {d.distance?.toFixed(1)} كم
                  </Text>
                  <MaterialCommunityIcons name={MODE_ICON[d.transportMode ?? "car"] as any} size={14} color={colors.primary} />
                </View>

                <View style={styles.cardAddresses}>
                  <View style={styles.addressRow}>
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.addressText, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {d.pickup.address}
                    </Text>
                  </View>
                  <View style={[styles.vertLine, { backgroundColor: colors.border }]} />
                  <View style={styles.addressRow}>
                    <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.addressText, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {d.dropoff.address}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <Text style={[styles.priceText, { color: colors.success }]}>
                    {d.earnings?.toFixed(0)} دج
                  </Text>
                  <Pressable
                    style={[styles.mapsSmallBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      openInGoogleMaps(d.pickup, d.dropoff);
                    }}
                  >
                    <MaterialCommunityIcons name="google-maps" size={13} color={colors.primary} />
                    <Text style={[styles.mapsSmallText, { color: colors.primary }]}>Google Maps</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}

            {/* Live couriers */}
            {courierLocations.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>العمال المباشرون</Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.accent + "20" }]}>
                    <Text style={[styles.countText, { color: colors.accent }]}>{courierLocations.length}</Text>
                  </View>
                </View>
                {courierLocations.map((loc) => (
                  <Pressable
                    key={loc.courierId}
                    style={[styles.courierCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      openSingleLocationInMaps(loc.latitude, loc.longitude, "موقع العامل");
                    }}
                  >
                    <View style={[styles.courierIcon, { backgroundColor: colors.accent + "20" }]}>
                      <MaterialCommunityIcons name={MODE_ICON[loc.transportMode] as any} size={18} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.courierMode, { color: colors.foreground }]}>
                        {MODE_LABEL[loc.transportMode]} • مباشر
                      </Text>
                      <Text style={[styles.courierCoords, { color: colors.mutedForeground }]}>
                        {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="google-maps" size={18} color={colors.primary} />
                  </Pressable>
                ))}
              </>
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
    mapContainer: { backgroundColor: colors.background },
    mapBox: { height: 220, backgroundColor: colors.muted, position: "relative", overflow: "hidden" },
    liveBadge: { position: "absolute", top: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
    liveBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
    modeChip: { position: "absolute", top: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
    modeChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    mapActions: { flexDirection: "row", gap: 8, padding: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    mapsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
    mapsBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
    listContent: { padding: 16, gap: 10 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
    countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    countText: { fontSize: 12, fontFamily: "Inter_700Bold" },
    emptyState: { alignItems: "center", paddingVertical: 40, gap: 10 },
    emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
    newBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
    newBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
    deliveryCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 10 },
    cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    trackingId: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
    distance: { fontSize: 12, fontFamily: "Inter_400Regular" },
    cardAddresses: { gap: 4 },
    addressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    dot: { width: 7, height: 7, borderRadius: 3.5 },
    vertLine: { width: 1, height: 8, marginLeft: 3 },
    addressText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
    cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    priceText: { fontSize: 14, fontFamily: "Inter_700Bold" },
    mapsSmallBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
    mapsSmallText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    courierCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
    courierIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
    courierMode: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    courierCoords: { fontSize: 11, fontFamily: "Inter_400Regular" },
  });
}
