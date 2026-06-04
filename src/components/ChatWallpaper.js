/**
 * ChatWallpaper.js
 *
 * Two exports:
 *
 *   ChatWallpaperBackground  — full-screen wallpaper layer rendered behind the FlatList
 *   WallpaperPreview         — small swatch thumbnail (used in ChatThemeModal)
 */

import { View, Image, StyleSheet, Dimensions } from "react-native";
import Svg, {
  Circle, Line, Path, Rect, G,
} from "react-native-svg";

const { width: SW, height: SH } = Dimensions.get("window");

// ── Pattern renderers ──────────────────────────────────────────────────────

function StarfieldPattern({ width, height, color = "#9B6FD4", opacity = 0.18, size = 1.5, spacing = 18 }) {
  const dots = [];
  for (let x = spacing / 2; x < width; x += spacing) {
    for (let y = spacing / 2; y < height; y += spacing) {
      // Vary size slightly for depth
      const r = size * (0.5 + Math.abs(Math.sin(x * y)) * 1.0);
      dots.push(<Circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={color} opacity={opacity} />);
    }
  }
  return <Svg width={width} height={height} style={StyleSheet.absoluteFill}>{dots}</Svg>;
}

function GridPattern({ width, height, color = "#9B6FD4", opacity = 0.10, spacing = 24 }) {
  const lines = [];
  for (let x = 0; x <= width; x += spacing) {
    lines.push(<Line key={`v${x}`} x1={x} y1={0} x2={x} y2={height} stroke={color} strokeWidth={0.5} opacity={opacity} />);
  }
  for (let y = 0; y <= height; y += spacing) {
    lines.push(<Line key={`h${y}`} x1={0} y1={y} x2={width} y2={y} stroke={color} strokeWidth={0.5} opacity={opacity} />);
  }
  return <Svg width={width} height={height} style={StyleSheet.absoluteFill}>{lines}</Svg>;
}

function BubblesPattern({ width, height, color = "#9B6FD4", opacity = 0.08 }) {
  // Deterministic "random" circles using sine math
  const circles = [];
  const count = Math.floor((width * height) / 3000);
  for (let i = 0; i < count; i++) {
    const cx = ((Math.sin(i * 7.3 + 1) * 0.5 + 0.5) * width);
    const cy = ((Math.sin(i * 13.7 + 2) * 0.5 + 0.5) * height);
    const r  = 8 + (Math.sin(i * 3.1) * 0.5 + 0.5) * 28;
    circles.push(
      <Circle key={i} cx={cx} cy={cy} r={r}
        fill="none" stroke={color} strokeWidth={1.2} opacity={opacity} />
    );
  }
  return <Svg width={width} height={height} style={StyleSheet.absoluteFill}>{circles}</Svg>;
}

function WavesPattern({ width, height, color = "#4A9FD4", opacity = 0.10 }) {
  const paths = [];
  const waveCount = Math.ceil(height / 40) + 1;
  for (let i = 0; i < waveCount; i++) {
    const y = i * 40;
    const amp = 10;
    const freq = width / 2;
    let d = `M 0 ${y}`;
    for (let x = 0; x <= width; x += 4) {
      const wy = y + amp * Math.sin((x / freq) * Math.PI * 2 + i * 0.8);
      d += ` L ${x} ${wy}`;
    }
    paths.push(
      <Path key={i} d={d} fill="none" stroke={color} strokeWidth={1} opacity={opacity} />
    );
  }
  return <Svg width={width} height={height} style={StyleSheet.absoluteFill}>{paths}</Svg>;
}

function HeartbeatPattern({ width, height, color = "#D46FA0", opacity = 0.18 }) {
  // ECG-style repeating heartbeat line
  const rows = [];
  const rowHeight = 60;
  const rowCount = Math.ceil(height / rowHeight) + 1;
  for (let row = 0; row < rowCount; row++) {
    const y = row * rowHeight + rowHeight / 2;
    const segW = 80;
    const segments = Math.ceil(width / segW) + 1;
    let d = `M 0 ${y}`;
    for (let s = 0; s < segments; s++) {
      const ox = s * segW;
      // flat → spike up → spike down → flat
      d += ` L ${ox + 10} ${y}`;
      d += ` L ${ox + 20} ${y - 18}`;
      d += ` L ${ox + 28} ${y + 12}`;
      d += ` L ${ox + 36} ${y - 6}`;
      d += ` L ${ox + 44} ${y}`;
      d += ` L ${ox + segW} ${y}`;
    }
    rows.push(<Path key={row} d={d} fill="none" stroke={color} strokeWidth={1.2} opacity={opacity} />);
  }
  return <Svg width={width} height={height} style={StyleSheet.absoluteFill}>{rows}</Svg>;
}

function renderPattern(wallpaper, width, height) {
  if (!wallpaper || wallpaper.key === "none") return null;
  switch (wallpaper.type) {
    case "pattern":
      if (wallpaper.dots)
        return <StarfieldPattern width={width} height={height} {...wallpaper.dots} />;
      if (wallpaper.grid)
        return <GridPattern width={width} height={height} {...wallpaper.grid} />;
      return null;
    case "circles":
      return <BubblesPattern width={width} height={height} {...(wallpaper.circles || {})} />;
    case "waves":
      return <WavesPattern width={width} height={height} {...(wallpaper.waves || {})} />;
    case "heartbeat":
      return <HeartbeatPattern width={width} height={height} {...(wallpaper.line || {})} />;
    case "image":
      return (
        <Image
          source={{ uri: wallpaper.uri }}
          style={[StyleSheet.absoluteFill, { width, height }]}
          resizeMode="cover"
          blurRadius={0}
        />
      );
    default:
      return null;
  }
}

// ── Full-screen background ─────────────────────────────────────────────────
export function ChatWallpaperBackground({ wallpaper, bgColor, style }) {
  if (!wallpaper || wallpaper.key === "none") return null;

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: bgColor || "transparent" },
        style,
      ]}
    >
      {renderPattern(wallpaper, SW, SH)}
    </View>
  );
}

// ── Small swatch preview ───────────────────────────────────────────────────
const THUMB_W = (SW - 48 - 12 * 3) / 4;
const THUMB_H = THUMB_W * 1.2;

export function WallpaperPreview({ wallpaper, bgColor }) {
  if (!wallpaper || wallpaper.key === "none") {
    return (
      <View style={[p.thumb, { backgroundColor: bgColor || "#0F0A1E" }]}>
        <View style={p.noneLabel}>
          <Line x1="4" y1="4" x2={THUMB_W - 4} y2={THUMB_H - 4}
            stroke="#2D2450" strokeWidth={1.5} strokeLinecap="round" />
        </View>
      </View>
    );
  }

  if (wallpaper.type === "image" && wallpaper.uri) {
    return (
      <Image
        source={{ uri: wallpaper.uri }}
        style={[p.thumb]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[p.thumb, { backgroundColor: bgColor || "#0F0A1E" }]}>
      {renderPattern(wallpaper, THUMB_W, THUMB_H)}
    </View>
  );
}

const p = StyleSheet.create({
  thumb: { width: THUMB_W, height: THUMB_H, borderRadius: 10, overflow: "hidden" },
  noneLabel: { flex: 1, justifyContent: "center", alignItems: "center" },
});