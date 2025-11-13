import { ImageSource } from 'expo-image';

export type UserIconItem = { key: string; source: ImageSource };

export const USER_ICONS: UserIconItem[] = [
  // Reemplaza estos nombres por los tuyos reales
  { key: 'Castor', source: require('@/assets/images/userIcons/beaver.png') },
  { key: 'Abejita', source: require('@/assets/images/userIcons/bee.png') },
  { key: 'Patito', source: require('@/assets/images/userIcons/ducky.png') },
  { key: 'Zorro', source: require('@/assets/images/userIcons/fox.png') },
  { key: 'Gatito', source: require('@/assets/images/userIcons/kitty.png') },
  { key: 'León', source: require('@/assets/images/userIcons/lion.png') },
  { key: 'Monito', source: require('@/assets/images/userIcons/monkey.png') },
  { key: 'Caracol', source: require('@/assets/images/userIcons/snail.png') },
  { key: 'Ardilla', source: require('@/assets/images/userIcons/squirell.png') },
];

export const getUserIconSource = (key?: string) => {
  if (!key) return undefined;
  return USER_ICONS.find((i) => i.key === key)?.source;
};