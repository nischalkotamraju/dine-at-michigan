import { Bell } from 'lucide-react-native';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import FilterBar from '~/components/FilterBar';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';
import { cn } from '~/utils/utils';
import type * as schema from '../../services/database/schema';
import type { FilterType } from '../(tabs)';

const icon = require('../../assets/image.png');

type HomeHeaderProps = {
  currentTime: Date;
  selectedFilter: string;
  setSelectedFilter: (filter: FilterType) => void;
  locationTypes: schema.LocationType[];
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
}: HomeHeaderProps) => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);

  const filterItems = [
    { id: 'all', title: 'All' },
    ...locationTypes
      .sort((a, b) => a.display_order - b.display_order)
      .map((type) => ({ id: type.name, title: type.name })),
  ];

  const textColor = isDarkMode ? '#fff' : '#111';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';

  return (
    <View style={{ marginTop: 8, gap: 16 }}>
      {/* Top bar: logo + bell */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 0 }}>
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
      <View style={{ paddingHorizontal: 0 }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: textColor }}>
          {getGreeting(currentTime.getHours())}, Wolverine 👋
        </Text>
        <Text style={{ fontSize: 14, color: subColor, marginTop: 2 }}>
          Here's what's open today.
        </Text>
      </View>

      {/* Filter bar */}
      <View style={{ paddingHorizontal: 0 }}>
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
