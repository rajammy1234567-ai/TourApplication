import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DEFAULT_TOUR_IMAGE, ExploreColors, Layout, formatINR } from "../../constants/exploreTheme";
import { SafeImage } from "./SafeImage";

export type ListingCardProps = {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  price: number;
  priceSuffix?: string;
  rating?: number;
  badge?: string;
  isWishlisted?: boolean;
  onPress: () => void;
  onToggleWishlist?: () => void;
  width?: number;
  isFirst?: boolean;
};

export function ListingCard({
  image,
  title,
  subtitle,
  price,
  priceSuffix = "",
  rating = 4.5,
  badge,
  isWishlisted,
  onPress,
  onToggleWishlist,
  width = Layout.listingCardW,
  isFirst,
}: ListingCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, { width }, isFirst && styles.cardFirst]}
      activeOpacity={0.92}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        <SafeImage uri={image} fallback={DEFAULT_TOUR_IMAGE} style={styles.image} contentFit="cover" transition={200} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        {onToggleWishlist ? (
          <TouchableOpacity
            style={styles.heart}
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleWishlist();
            }}
            hitSlop={10}
          >
            <Ionicons
              name={isWishlisted ? "heart" : "heart-outline"}
              size={20}
              color={isWishlisted ? "#FF385C" : ExploreColors.text}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{Number(rating || 0).toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
        <Text style={styles.price} numberOfLines={1}>
          {formatINR(price)}
          {priceSuffix ? <Text style={styles.priceSuffix}>{priceSuffix}</Text> : null}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: Layout.gap,
  },
  cardFirst: {
    marginLeft: Layout.pad,
  },
  imageWrap: {
    width: "100%",
    height: Layout.listingImgH,
    borderRadius: Layout.radius,
    overflow: "hidden",
    backgroundColor: ExploreColors.borderLight,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: ExploreColors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: ExploreColors.text,
  },
  heart: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    marginTop: 8,
    gap: 2,
    width: "100%",
    overflow: "hidden",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
    width: "100%",
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "600",
    color: ExploreColors.text,
    lineHeight: 18,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flexShrink: 0,
    marginTop: 1,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "500",
    color: ExploreColors.text,
  },
  subtitle: {
    fontSize: 12,
    color: ExploreColors.textSecondary,
    width: "100%",
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: ExploreColors.text,
    marginTop: 2,
    width: "100%",
  },
  priceSuffix: {
    fontSize: 12,
    fontWeight: "400",
    color: ExploreColors.textSecondary,
  },
});