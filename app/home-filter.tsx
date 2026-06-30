import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  Coffee,
  LayoutGrid,
  ShoppingCart,
  Truck,
  UtensilsCrossed,
  ShoppingBag,
} from 'lucide-react-native';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '~/hooks/useDatabase';
import * as schema from '~/services/database/schema';
import { useHomeFilterStore } from '~/store/useHomeFilterStore';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';

const { width } = Dimensions.get('window');
const PADDING = 20;
const GAP = 12;
const COLS = 2;
const CARD_SIZE = (width - PADDING * 2 - GAP * (COLS - 1)) / COLS;

const getIcon = (id: string, color: string, size = 28) => {
  const t = id.toLowerCase();
  if (t === 'all') return <LayoutGrid size={size} color={color} strokeWidth={1.8} />;
  if (t.includes('dining hall')) return <UtensilsCrossed size={size} color={color} strokeWidth={1.8} />;
  if (t.includes('caf') || t.includes('coffee')) return <Coffee size={size} color={color} strokeWidth={1.8} />;
  if (t.includes('food court')) return <ShoppingBag size={size} color={color} strokeWidth={1.8} />;
  if (t.includes('convenience')) return <ShoppingCart size={size} color={color} strokeWidth={1.8} />;
  if (t.includes('truck')) return <Truck size={size} color={color} strokeWidth={1.8} />;
  return <UtensilsCrossed size={size} color={color} strokeWidth={1.8} />;
};

export default function HomeFilterModal() {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { selectedFilter, setSelectedFilter } = useHomeFilterStore();

  const locationTypes = db
    .select()
    .from(schema.location_type)
    .orderBy(schema.location_type.display_order)
    .all();

  const options = [
    { id: 'all', name: 'All' },
    ...locationTypes.map((t) => ({ id: t.name, name: t.name })),
  ];

  const bg = isDarkMode ? '#1C1C1E' : '#F2F2F7';
  const cardBg = isDarkMode ? '#2C2C2E' : '#fff';
  const subColor = isDarkMode ? '#636366' : '#8E8E93';

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedFilter(id);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingBottom: insets.bottom }}>
      {/* Handle */}
      <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: isDarkMode ? '#555' : '#D1D1D6' }} />
      </View>

      {/* Title */}
      <View style={{ paddingHorizontal: PADDING, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: isDarkMode ? '#fff' : '#000' }}>
          Filter Locations
        </Text>
        <Text style={{ fontSize: 14, color: subColor, marginTop: 3 }}>
          Choose a category to browse
        </Text>
      </View>

      {/* Grid */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: PADDING,
          gap: GAP,
        }}
      >
        {options.map((option) => {
          const isSelected = selectedFilter === option.id;
          const iconColor = isSelected ? COLORS['um-maize'] : isDarkMode ? '#8E8E93' : '#8E8E93';
          const tileBg = isSelected
            ? isDarkMode ? '#2C2C2E' : '#fff'
            : isDarkMode ? '#2C2C2E' : '#fff';
          const borderColor = isSelected ? COLORS['um-maize'] : 'transparent';

          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleSelect(option.id)}
              activeOpacity={0.75}
              style={{
                width: CARD_SIZE,
                height: CARD_SIZE,
                backgroundColor: tileBg,
                borderRadius: 18,
                borderWidth: 2,
                borderColor: borderColor,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDarkMode ? 0 : 0.06,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {getIcon(option.id, iconColor)}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: isSelected ? COLORS['um-maize'] : isDarkMode ? '#fff' : '#000',
                  textAlign: 'center',
                  paddingHorizontal: 4,
                }}
                numberOfLines={2}
              >
                {option.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
