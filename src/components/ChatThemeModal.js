/**
 * ChatThemeModal.js  — v2
 *
 * Changes in this version:
 *  - allowsEditing removed (was causing the confusing native crop screen on Android)
 *  - After picking a gallery image, shows an inline preview card with
 *    "Apply" and "Cancel" buttons before committing the wallpaper
 *  - All previous layout fixes retained (SVG overlay, ScrollView height, etc.)
 */

import { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Alert, ActivityIndicator,
  Dimensions, Image,
} from "react-native";
import Svg, { Path, Circle, Line, Rect, Polyline } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import { CHAT_THEMES, PRESET_WALLPAPERS } from "../hooks/useChatTheme";
import { WallpaperPreview } from "./ChatWallpaper";

const { width: SW } = Dimensions.get("window");

const C = {
  bg:         "#0F0A1E",
  card:       "#1A1330",
  border:     "#2D2450",
  accent:     "#9B6FD4",
  accentSoft: "#C4A3E8",
  text:       "#EDE8F5",
  textMuted:  "#8B7FA8",
  success:    "#4CAF8F",
  error:      "#D4607A",
};

// ── SVG icons ──────────────────────────────────────────────────────────────
const CloseIcon = ({ size = 16, color = C.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CheckIcon = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PaletteIcon = ({ size = 18, color = C.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Circle cx="8"  cy="10" r="1.5" fill={color} />
    <Circle cx="12" cy="7"  r="1.5" fill={color} />
    <Circle cx="16" cy="10" r="1.5" fill={color} />
    <Path d="M12 17c2.5 0 4-1.5 4-3H8c0 1.5 1.5 3 4 3z" fill={color} />
  </Svg>
);

const ImageIcon = ({ size = 18, color = C.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth={2} />
    <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
    <Polyline points="21 15 16 10 5 21" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GalleryIcon = ({ size = 20, color = C.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="9" height="9" rx="1" stroke={color} strokeWidth={2} />
    <Rect x="13" y="2" width="9" height="9" rx="1" stroke={color} strokeWidth={2} />
    <Rect x="2" y="13" width="9" height="9" rx="1" stroke={color} strokeWidth={2} />
    <Rect x="13" y="13" width="9" height="9" rx="1" stroke={color} strokeWidth={2} />
  </Svg>
);

const TrashIcon = ({ size = 16, color = C.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Swatch sizing: 4 columns with equal spacing ────────────────────────────
const SWATCH_SIZE = Math.floor((SW - 40 - 40 - 12 * 3) / 4);

// ── Theme swatch ───────────────────────────────────────────────────────────
function ThemeSwatch({ theme, isActive, onPress }) {
  const [c1, c2, c3] = theme.preview;
  return (
    <TouchableOpacity style={sw.wrap} onPress={onPress} activeOpacity={0.8}>
      <View style={[
        sw.preview,
        {
          backgroundColor: c1,
          borderColor: isActive ? theme.colors.accent : C.border,
          borderWidth: isActive ? 2 : 1,
        },
      ]}>
        <View style={[sw.bubble, sw.bubbleLeft, { backgroundColor: c3 }]}>
          <View style={[sw.bubbleLine, { backgroundColor: theme.colors.textMuted, width: "70%" }]} />
          <View style={[sw.bubbleLine, { backgroundColor: theme.colors.textMuted, width: "45%", marginTop: 3 }]} />
        </View>
        <View style={[sw.bubble, sw.bubbleRight, { backgroundColor: c2, borderColor: theme.colors.accent + "55", borderWidth: 1 }]}>
          <View style={[sw.bubbleLine, { backgroundColor: theme.colors.accentSoft, width: "80%" }]} />
          <View style={[sw.bubbleLine, { backgroundColor: theme.colors.accentSoft, width: "55%", marginTop: 3 }]} />
        </View>
        {isActive && (
          <View style={[sw.checkWrap, { backgroundColor: theme.colors.accent }]}>
            <CheckIcon size={10} color="#fff" />
          </View>
        )}
      </View>
      <Text style={[sw.label, isActive && { color: theme.colors.accent }]} numberOfLines={1}>
        {theme.label}
      </Text>
    </TouchableOpacity>
  );
}

const sw = StyleSheet.create({
  wrap:        { width: SWATCH_SIZE, alignItems: "center", marginBottom: 16 },
  preview:     { width: SWATCH_SIZE, height: SWATCH_SIZE * 1.2, borderRadius: 12, padding: 8, justifyContent: "space-between", overflow: "hidden" },
  bubble:      { borderRadius: 8, padding: 6, maxWidth: "80%" },
  bubbleLeft:  { alignSelf: "flex-start" },
  bubbleRight: { alignSelf: "flex-end" },
  bubbleLine:  { height: 4, borderRadius: 2 },
  checkWrap:   { position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  label:       { color: C.textMuted, fontSize: 11, marginTop: 5, textAlign: "center" },
});

// ── Wallpaper swatch ───────────────────────────────────────────────────────
function WallpaperSwatch({ wp, isActive, onPress, bgColor }) {
  return (
    <TouchableOpacity style={ww.wrap} onPress={onPress} activeOpacity={0.8}>
      <View style={[ww.preview, { borderColor: isActive ? C.accent : C.border, borderWidth: isActive ? 2 : 1 }]}>
        <WallpaperPreview wallpaper={wp} bgColor={bgColor} />
        {isActive && (
          <View style={ww.checkWrap}>
            <CheckIcon size={10} color="#fff" />
          </View>
        )}
      </View>
      <Text style={[ww.label, isActive && { color: C.accentSoft }]} numberOfLines={1}>
        {wp.label}
      </Text>
    </TouchableOpacity>
  );
}

const ww = StyleSheet.create({
  wrap:      { width: SWATCH_SIZE, alignItems: "center", marginBottom: 16 },
  preview:   { width: SWATCH_SIZE, height: SWATCH_SIZE * 1.2, borderRadius: 12, overflow: "hidden" },
  checkWrap: { position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: C.accent, justifyContent: "center", alignItems: "center" },
  label:     { color: C.textMuted, fontSize: 11, marginTop: 5, textAlign: "center" },
});

// ── Image preview card shown after gallery pick ────────────────────────────
function PickedImagePreview({ uri, onApply, onDiscard }) {
  return (
    <View style={pp.card}>
      {/* Preview thumbnail */}
      <Image
        source={{ uri }}
        style={pp.thumbnail}
        resizeMode="cover"
      />
      <View style={pp.info}>
        <Text style={pp.title}>Apply this photo?</Text>
        <Text style={pp.sub}>It will be used as your chat wallpaper.</Text>
      </View>
      {/* Action buttons */}
      <View style={pp.actions}>
        <TouchableOpacity style={pp.discardBtn} onPress={onDiscard} activeOpacity={0.8}>
          <TrashIcon size={14} color={C.error} />
          <Text style={pp.discardText}>Remove</Text>
        </TouchableOpacity>
        <TouchableOpacity style={pp.applyBtn} onPress={onApply} activeOpacity={0.8}>
          <CheckIcon size={14} color="#fff" />
          <Text style={pp.applyText}>Apply wallpaper</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pp = StyleSheet.create({
  card: {
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.accent + "55",
    overflow: "hidden",
    marginBottom: 20,
  },
  thumbnail: {
    width: "100%",
    height: 160,
  },
  info: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  sub: {
    color: C.textMuted,
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  discardBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.error + "55",
    backgroundColor: C.error + "18",
  },
  discardText: {
    color: C.error,
    fontSize: 13,
    fontWeight: "600",
  },
  applyBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.accent,
  },
  applyText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});

// ── Main modal ─────────────────────────────────────────────────────────────
export default function ChatThemeModal({
  visible,
  onClose,
  currentThemeKey,
  currentWallpaper,
  onSelectTheme,
  onSelectWallpaper,
}) {
  const [tab, setTab]               = useState("theme");
  const [pickingImage, setPickingImage] = useState(false);
  // Holds the URI of a newly picked image waiting for user confirmation
  const [pendingImageUri, setPendingImageUri] = useState(null);

  const currentTheme = CHAT_THEMES.find((t) => t.key === currentThemeKey) || CHAT_THEMES[0];

  const handlePickFromGallery = async () => {
    setPickingImage(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to your photo library in Settings.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        // allowsEditing REMOVED — was triggering the native crop screen on
        // Android which confused users with no clear "Done" button in our UI
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        // Don't apply immediately — show the preview card for confirmation
        setPendingImageUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Error", "Could not open gallery. Please try again.");
    } finally {
      setPickingImage(false);
    }
  };

  const handleApplyPendingImage = () => {
    if (!pendingImageUri) return;
    onSelectWallpaper({ key: "custom", label: "Custom", type: "image", uri: pendingImageUri });
    setPendingImageUri(null);
  };

  const handleDiscardPendingImage = () => {
    setPendingImageUri(null);
  };

  const handleRemoveCustomWallpaper = () => {
    onSelectWallpaper(null);
  };

  const isWallpaperActive = (wp) => {
    if (!currentWallpaper && wp.key === "none") return true;
    return currentWallpaper?.key === wp.key;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={m.overlay}>
        {/* Tap-to-dismiss area above the sheet */}
        <TouchableOpacity style={m.dismissArea} onPress={onClose} activeOpacity={1} />

        <View style={m.sheet}>
          {/* Handle */}
          <View style={m.handle} />

          {/* Header */}
          <View style={m.header}>
            <Text style={m.title}>Chat Appearance</Text>
            <TouchableOpacity style={m.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <CloseIcon size={14} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={m.tabs}>
            <TouchableOpacity
              style={[m.tab, tab === "theme" && m.tabActive]}
              onPress={() => setTab("theme")}
            >
              <PaletteIcon size={15} color={tab === "theme" ? C.accent : C.textMuted} />
              <Text style={[m.tabText, tab === "theme" && { color: C.accent }]}>Themes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[m.tab, tab === "wallpaper" && m.tabActive]}
              onPress={() => setTab("wallpaper")}
            >
              <ImageIcon size={15} color={tab === "wallpaper" ? C.accent : C.textMuted} />
              <Text style={[m.tabText, tab === "wallpaper" && { color: C.accent }]}>Wallpaper</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={m.scroll}
            contentContainerStyle={m.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── THEMES TAB ── */}
            {tab === "theme" ? (
              <>
                <Text style={m.sectionNote}>
                  Your theme is only visible to you — others see their own choice.
                </Text>
                <View style={m.swatchGrid}>
                  {CHAT_THEMES.map((t) => (
                    <ThemeSwatch
                      key={t.key}
                      theme={t}
                      isActive={t.key === currentThemeKey}
                      onPress={() => onSelectTheme(t.key)}
                    />
                  ))}
                </View>
              </>
            ) : (
              /* ── WALLPAPER TAB ── */
              <>
                <Text style={m.sectionNote}>
                  Your wallpaper is only visible to you.
                </Text>

                {/* ── Pending image preview (shown after gallery pick) ── */}
                {pendingImageUri && (
                  <PickedImagePreview
                    uri={pendingImageUri}
                    onApply={handleApplyPendingImage}
                    onDiscard={handleDiscardPendingImage}
                  />
                )}

                {/* ── Currently active custom photo ── */}
                {!pendingImageUri && currentWallpaper?.type === "image" && currentWallpaper?.uri && (
                  <View style={m.activePhotoCard}>
                    <Image
                      source={{ uri: currentWallpaper.uri }}
                      style={m.activePhotoThumb}
                      resizeMode="cover"
                    />
                    <View style={m.activePhotoInfo}>
                      <View style={m.activePhotoBadge}>
                        <CheckIcon size={10} color="#fff" />
                        <Text style={m.activePhotoBadgeText}>Active wallpaper</Text>
                      </View>
                      <Text style={m.activePhotoSub}>Custom photo from your gallery</Text>
                    </View>
                    <TouchableOpacity
                      style={m.activePhotoRemoveBtn}
                      onPress={handleRemoveCustomWallpaper}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <TrashIcon size={16} color={C.error} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── Gallery picker button ── */}
                {!pendingImageUri && (
                  <TouchableOpacity
                    style={m.galleryBtn}
                    onPress={handlePickFromGallery}
                    disabled={pickingImage}
                    activeOpacity={0.8}
                  >
                    {pickingImage ? (
                      <ActivityIndicator color={C.accent} size={18} />
                    ) : (
                      <GalleryIcon size={18} color={C.accentSoft} />
                    )}
                    <Text style={m.galleryBtnText}>
                      {currentWallpaper?.type === "image"
                        ? "Change photo from gallery"
                        : "Choose from gallery"}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* ── Preset patterns ── */}
                <Text style={m.subLabel}>Patterns</Text>
                <View style={m.swatchGrid}>
                  {PRESET_WALLPAPERS.map((wp) => (
                    <WallpaperSwatch
                      key={wp.key}
                      wp={wp}
                      isActive={isWallpaperActive(wp)}
                      bgColor={currentTheme.colors.bg}
                      onPress={() => {
                        setPendingImageUri(null); // clear any pending pick
                        onSelectWallpaper(wp.key === "none" ? null : wp);
                      }}
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  dismissArea: { flex: 1 },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    minHeight: 340,
    borderTopWidth: 1,
    borderColor: C.border,
    flexDirection: "column",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: "center",
    marginTop: 12, marginBottom: 4,
    flexShrink: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexShrink: 0,
  },
  title: { color: C.text, fontSize: 22, fontWeight: "700" },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.border,
    justifyContent: "center", alignItems: "center",
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 4,
    marginBottom: 8,
    flexShrink: 0,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", paddingVertical: 10,
    borderRadius: 11, gap: 6,
  },
  tabActive:  { backgroundColor: C.card },
  tabText:    { color: C.textMuted, fontSize: 14, fontWeight: "600" },
  scroll:     { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 4 },
  sectionNote: {
    color: C.textMuted, fontSize: 12, lineHeight: 18,
    marginBottom: 16, fontStyle: "italic",
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  subLabel: {
    color: C.textMuted, fontSize: 12, fontWeight: "600",
    letterSpacing: 0.5, marginBottom: 12, marginTop: 4,
  },
  galleryBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.bg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 20,
  },
  galleryBtnText: { color: C.accentSoft, fontSize: 14, fontWeight: "600", flex: 1 },

  // Active custom photo card
  activePhotoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.accent + "55",
    padding: 10,
    marginBottom: 12,
    gap: 12,
  },
  activePhotoThumb: {
    width: 56, height: 56, borderRadius: 10,
  },
  activePhotoInfo: { flex: 1 },
  activePhotoBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.success + "33",
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: "flex-start", marginBottom: 4,
  },
  activePhotoBadgeText: { color: C.success, fontSize: 10, fontWeight: "700" },
  activePhotoSub: { color: C.textMuted, fontSize: 11 },
  activePhotoRemoveBtn: {
    padding: 8,
    backgroundColor: C.error + "18",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.error + "44",
  },
});