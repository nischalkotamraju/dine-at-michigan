import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '~/hooks/useDatabase';
import * as schema from '~/services/database/schema';
import { useHomeFilterStore } from '~/store/useHomeFilterStore';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';

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
    { id: 'all', name: 'All Locations' },
    ...locationTypes.map((t) => ({ id: t.name, name: t.name })),
  ];

  const textColor = isDarkMode ? '#fff' : '#000';
  const subColor = isDarkMode ? '#636366' : '#8E8E93';
  const bg = isDarkMode ? '#1C1C1E' : '#fff';
  const divider = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: subColor, letterSpacing: 0.5 }}>
          FILTER BY TYPE
        </Text>
      </View>

      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: divider }} />

      {options.map((option, index) => {
        const isSelected = selectedFilter === option.id;
        return (
          <View key={option.id}>
            <TouchableOpacity
              onPress={() => handleSelect(option.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 16,
                paddingHorizontal: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: isSelected ? '600' : '400',
                  color: isSelected ? COLORS['um-maize'] : textColor,
                }}
              >
                {option.name}
              </Text>
              {isSelected && <Check size={18} color={COLORS['um-maize']} strokeWidth={2.5} />}
            </TouchableOpacity>
            {index < options.length - 1 && (
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: divider, marginLeft: 20 }} />
            )}
          </View>
        );
      })}
    </View>
  );
}
