import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { BORDER_RADIUS } from '@/theme/globals';
import { ViewStyle } from 'react-native';

type Props = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  style?: ViewStyle;
};

export const ChartContainer = ({
  title,
  description,
  children,
  style,
}: Props) => {
  const cardColor = useColor('card');

  return (
    <View
      style={[
        {
          backgroundColor: cardColor || '#FFFFFF',
          borderRadius: BORDER_RADIUS,
          paddingTop: 10,
          paddingBottom: 16,
          paddingHorizontal: 12,
          marginBottom: 16,
          width: '100%',
        },
        style,
      ]}
    >
      {title && (
        <Text variant="subtitle" style={{ margin: 1, marginLeft: 10, paddingTop: 5 }}>
          {title}
        </Text>
      )}
      {description && (
        <Text variant="caption" style={{ margin: 1, marginLeft: 10, marginBottom: 5}}>
          {description}
        </Text>
      )}
      {children}
    </View>
  );
};
