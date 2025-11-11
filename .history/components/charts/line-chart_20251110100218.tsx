import { useColor } from "@/hooks/useColor";
import { useEffect, useState } from "react";
import { LayoutChangeEvent, View, ViewStyle, StyleSheet, Text } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";

interface ChartConfig {
  width?: number;
  height?: number;
  padding?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  gradient?: boolean;
  showYLabels?: boolean;
  yLabelCount?: number;
  yAxisWidth?: number;
  lineColor?: string;
  pointColor?: string;
  startFillColor?: string;
  endFillColor?: string;
  curveSmoothness?: number;
  animated?: boolean;
  duration?: number;
  interactive?: boolean;
}

export type ChartDataPoint = { x: string | number; y: number };

const createPath = (points: { x: number; y: number }[], tension = 0.35): string => {

  if (points.length < 2) return "";
  let path = `M${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return path;
};

const createAreaPath = (points: { x: number; y: number }[], height: number, tension = 0.25) => {
  if (points.length === 0) return "";
  let path = createPath(points, tension);
  const last = points[points.length - 1];
  const first = points[0];
  path += ` L${last.x},${height} L${first.x},${height} Z`;
  return path;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const LineChart = ({
  data,
  config = {},
  style,
}: {
  data: ChartDataPoint[];
  config?: ChartConfig;
  style?: ViewStyle;
}) => {
  const [containerWidth, setContainerWidth] = useState(300);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  const {
    height = 220,
    padding = 20,
    showGrid = true,
    showLabels = true,
    gradient = true,
    showYLabels = true,
    yLabelCount = 4,
    yAxisWidth = 28,
    curveSmoothness = 0.25,
    animated = true,
    duration = 1000,
    interactive = true,
  } = config;

  const chartWidth = containerWidth || 300;
  const lineColor = config.lineColor || useColor("primary");
  const pointColor = config.pointColor || lineColor;
  const startFillColor = config.startFillColor || lineColor;
  const endFillColor = config.endFillColor || lineColor;
  const mutedColor = useColor("mutedForeground");
  const animationProgress = useSharedValue(0);


  const bubbleX = useSharedValue(0);
  const bubbleY = useSharedValue(0);
  const bubbleOpacity = useSharedValue(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) setContainerWidth(width);
  };

  useFocusEffect(
  useCallback(() => {
    if (animated) {
      animationProgress.value = withTiming(1, { duration });
    } else {
      animationProgress.value = 1;
    }
  }, [data, animated, duration]));

  if (!data.length) return null;

  const maxValue = Math.max(...data.map((d) => d.y));
  const minValue = Math.min(...data.map((d) => d.y));
  const range = maxValue - minValue || 1;

  const leftPad = showYLabels ? padding + yAxisWidth -12 : padding;
  const innerWidth = chartWidth - leftPad - padding;
  const chartHeight = height - padding * 2;

  const points = data.map((p, i) => ({
    x: leftPad + (i / (data.length - 1)) * innerWidth,
    y: padding + ((maxValue - p.y) / range) * chartHeight,
  }));

 const path = createPath(points, curveSmoothness);
const areaPath = createAreaPath(points, height - padding, curveSmoothness);


  const yLabels = Array.from({ length: yLabelCount }, (_, i) => {
    const ratio = i / (yLabelCount - 1);
    return {
      value: Math.round(maxValue - ratio * range),
      y: padding + ratio * chartHeight,
    };
  });

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [
      { translateX: bubbleX.value - 18 },
      { translateY: bubbleY.value - 45 },
      { scale: withSpring(bubbleOpacity.value ? 1 : 0.8) },
    ],
  }));

  const handleSelect = (i: number) => {
    if (selectedPoint === i) {
      setSelectedPoint(null);
      bubbleOpacity.value = withTiming(0, { duration: 200 });
    } else {
      setSelectedPoint(i);
      bubbleX.value = withTiming(points[i].x);
      bubbleY.value = withSpring(points[i].y);
      bubbleOpacity.value = withTiming(1, { duration: 250 });
    }
  };

  const gesture = Gesture.Tap().onEnd((e) => {
    "worklet";
    const { x, y } = e;
    let closest = 0;
    let minDist = Infinity;
    points.forEach((p, i) => {
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) {
        minDist = d;
        closest = i;
      }
    });
    if (minDist < 40) scheduleOnRN(handleSelect, closest);
  });

  return (
    <View style={[{ width: "100%", height }, style]} onLayout={handleLayout}>
      <GestureDetector gesture={gesture}>
        <View>
          <Svg width={chartWidth} height={height}>
            <Defs>
              {gradient && (
                <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={startFillColor} stopOpacity="0.25" />
                  <Stop offset="100%" stopColor={endFillColor} stopOpacity="0.05" />
                </LinearGradient>
              )}
            </Defs>

            {/* Eje Y */}
            {showYLabels && (
              <Line
                x1={leftPad}
                y1={padding}
                x2={leftPad}
                y2={height - padding}
                stroke={mutedColor}
                strokeWidth={0.8}
              />
            )}

            {/* Cuadrícula */}
            {showGrid &&
              yLabels.map((l, i) => (
                <Line
                  key={i}
                  x1={leftPad}
                  y1={l.y}
                  x2={chartWidth - padding}
                  y2={l.y}
                  stroke={mutedColor}
                  strokeWidth={0.5}
                  opacity={0.3}
                />
              ))}

            {/* Etiquetas del eje Y */}
            {showYLabels &&
              yLabels.map((l, i) => (
                <SvgText
                  key={`ylabel-${i}`}
                  x={leftPad - 8}
                  y={l.y + 3}
                  fontSize={10}
                  textAnchor="end"
                  fill={mutedColor}
                >
                  {l.value}
                </SvgText>
              ))}

            {/* Área y línea */}
            {gradient && <Path d={areaPath} fill="url(#gradient)" />}
            <Path d={path} stroke={lineColor} strokeWidth={2} fill="none" />

            {/* Puntos */}
            {points.map((p, i) => (
              <G key={i}>
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={selectedPoint === i ? 6 : 4}
                  fill={selectedPoint === i ? lineColor : pointColor}
                />
              </G>
            ))}

            {/* Etiquetas eje X */}
            {showLabels &&
              data.map((p, i) => (
                <SvgText
                  key={`xlabel-${i}`}
                  x={points[i].x}
                  y={height - 5}
                  textAnchor="middle"
                  fontSize={10}
                  fill={mutedColor}
                >
                  {String(p.x)}
                </SvgText>
              ))}
          </Svg>

          {/* Tooltip */}
          {selectedPoint !== null && (
            <Animated.View style={[styles.tooltip, tooltipStyle]}>
              <View style={[styles.tooltipBubble, { backgroundColor: lineColor }]}>
                <Text style={styles.tooltipText}>{data[selectedPoint].y}</Text>
              </View>
            </Animated.View>
          )}
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  tooltipBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  tooltipText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
});
