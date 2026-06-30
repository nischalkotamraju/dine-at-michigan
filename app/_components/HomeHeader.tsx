import { addDays, format, isSameDay, subDays } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Bell } from 'lucide-react-native';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import FilterBar from '~/components/FilterBar';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';
import { getCentralTimeDate } from '~/utils/date';
import { cn } from '~/utils/utils';
import type * as schema from '../../services/database/schema';
import type { FilterType } from '../(tabs)';

const icon = require('../../assets/image.png');

type HomeHeaderProps = {
  currentTime: Date;
  selectedFilter: string;
  setSelectedFilter: (filter: FilterType) => void;
  locationTypes: schema.LocationType[];
  selectedDate: string;
  onDateChange: (date: string) => void;
};

const getGreeting = (hour: number) => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const HomeHeader = ({
  currentTime,
  selectedFilter,
  setSelectedFilter,
  locationTypes,
  selectedDate,
  onDateChange,
}: HomeHeaderProps) => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);

  const filterItems = [
    { id: 'all', title: 'All' },
    ...locationTypes
      .sort((a, b) => a.display_order - b.display_order)
      .map((type) => ({ id: type.name, title: type.name })),
  ];

  const today = getCentralTimeDate();
  const dates = Array.from({ length: 5 }, (_, i) => addDays(subDays(today, 2), i));

  const textColor = isDarkMode ? '#fff' : '#111';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';

  return (
    <View style={{ marginTop: 8, gap: 16 }}>
      {/* Top bar: logo + bell */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={icon} style={{ width: 36, height: 36 }} />
          <View>
            <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS['um-maize'], letterSpacing: 1 }}>
              DINE @
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS['um-maize'], letterSpacing: 1, marginTop: -2 }}>
              MICHIGAN
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => {}}>
          <Bell size={22} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>
      </View>

      {/* Greeting */}
      <View style={{ paddingHorizontal: 12 }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: textColor }}>
          {getGreeting(currentTime.getHours())}, Wolverine 👋
        </Text>
        <Text style={{ fontSize: 14, color: subColor, marginTop: 2 }}>
          Here's what's open today.
        </Text>
      </View>

      {/* Date strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
      >
        {dates.map((d) => {
          const dateStr = format(d, 'yyyy-MM-dd');
          const isSelected = dateStr === selectedDate;
          const isToday = isSameDay(d, today);

          return (
            <TouchableOpacity
              key={dateStr}
              onPress={() => {
                onDateChange(dateStr);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={{
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: isSelected ? '#00274C' : isDarkMode ? '#262626' : '#F3F4F6',
                minWidth: 58,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: isSelected ? '#FFCB05' : isDarkMode ? '#9CA3AF' : '#6B7280',
                }}
              >
                {format(d, 'EEE')}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  marginTop: 2,
                  color: isSelected ? '#fff' : isDarkMode ? '#fff' : '#111',
                }}
              >
                {format(d, 'd')}
              </Text>
              {isToday && !isSelected && (
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: COLORS['um-maize'],
                    marginTop: 3,
                  }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Filter bar */}
      <View style={{ paddingHorizontal: 12 }}>
        <FilterBar
          selectedItem={selectedFilter}
          setSelectedItem={setSelectedFilter}
          items={filterItems}
        />
      </View>
    </View>
  );
};

export default HomeHeader;
