import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { SlidersHorizontal } from 'lucide-react-native';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useHomeFilterStore } from '~/store/useHomeFilterStore';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';
import type * as schema from '../../services/database/schema';

const icon = require('../../assets/image.png');

type HomeHeaderProps = {
  currentTime: Date;
  locationTypes: schema.LocationType[];
};

const getGreeting = (hour: number) => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const HomeHeader = ({ currentTime, locationTypes }: HomeHeaderProps) => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const { selectedFilter } = useHomeFilterStore();

  const textColor = isDarkMode ? '#fff' : '#111';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const filterActive = selectedFilter !== 'all';
  const activeLabel = filterActive
    ? locationTypes.find((t) => t.name === selectedFilter)?.name ?? 'All'
    : null;

  return (
    <View style={{ marginTop: 8, gap: 16 }}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
      </View>

      {/* Greeting */}
      <View>
        <Text style={{ fontSize: 26, fontWeight: '800', color: textColor }}>
          {getGreeting(currentTime.getHours())}, Wolverine 👋
        </Text>
        <Text style={{ fontSize: 14, color: subColor, marginTop: 2 }}>
          Here's what's open today.
        </Text>
      </View>

      {/* Filter pill */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/home-filter');
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 20,
          backgroundColor: filterActive ? COLORS['um-maize'] : isDarkMode ? '#2C2C2E' : '#F2F2F7',
        }}
      >
        <SlidersHorizontal
          size={14}
          color={filterActive ? '#fff' : isDarkMode ? '#fff' : '#000'}
          strokeWidth={2}
        />
        <Text style={{ fontSize: 13, fontWeight: '600', color: filterActive ? '#fff' : isDarkMode ? '#fff' : '#000' }}>
          {filterActive ? activeLabel : 'All Locations'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeHeader;
