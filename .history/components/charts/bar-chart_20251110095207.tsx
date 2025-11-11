import { useColor } from '@/hooks/useColor';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface ChartConfig {
  width?: number;
  height?: number;
  padding?: number;
  showLabels?: boolean;
  animated?: boolean;
  duration?: number;
}

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

type Props = {
  data: ChartDataPoint[];
  config?: ChartConfig;
  style?: ViewStyle;
};

export const BarChart = ({ data, config = {}, style }: Props) => {
  const [containerWidth, setContainerWidth] = useState(300);
  const {
    height = 200,
    padding = 20,
    showLabels = true,
    animated = true,
    duration = 800,
  } = config;

  const chartWidth = containerWidth || 300;
  const primaryColor = useColor('primary');
  const mutedColor = useColor('mutedForeground');

  // Cada barra tendrá su propio valor animado
  const barHeights = data.map(() => useSharedValue(0));

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width: measuredWidth } = event.nativeEvent.layout;
    if (measuredWidth > 0) setContainerWidth(measuredWidth);
  };

  useEffect(() => {
    if (animated) {
      barHeights.forEach((bar, i) => {
        bar.value = withTiming(data[i].value, {
          duration: duration + i * 100, // pequeño retraso entre barras
        });
      });
    } else {
      barHeights.forEach((bar, i) => (bar.value = data[i].value));
    }
  }, [data]);

  if (!data.length) return null;

  const maxValue = Math.max(...data.map((d) => d.value));
  const innerChartWidth = chartWidth - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = (innerChartWidth / data.length) * 0.8;
  const barSpacing = (innerChartWidth / data.length) * 0.2;

  return (
    <View style={[{ width: '100%', height }, style]} onLayout={handleLayout}>
      <Svg width={chartWidth} height={height}>
        {data.map((item, index) => {
          const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;

          const barAnimatedProps = useAnimatedProps(() => {
            const h = (barHeights[index].value / maxValue) * chartHeight;
            return {
              height: h,
              y: height - padding - h, // crece desde abajo
            };
          });

          return (
            <G key={`bar-${index}`}>
              <AnimatedRect
                x={x}
                width={barWidth}
                fill={item.color || primaryColor}
                rx={4}
                animatedProps={barAnimatedProps}
              />

              {showLabels && (
                <>
                  <SvgText
                    x={x + barWidth / 2}
                    y={height - 5}
                    textAnchor="middle"
                    fontSize={12}
                    fill={mutedColor}
                  >
                    {item.label}
                  </SvgText>
                  <SvgText
                    x={x + barWidth / 2}
                    y={height - padding - (item.value / maxValue) * chartHeight - 5}
                    textAnchor="middle"
                    fontSize={11}
                    fill={mutedColor}
                    fontWeight="600"
                  >
                    {item.value}
                  </SvgText>
                </>
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
};
