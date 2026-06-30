import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { UtensilsCrossed, SlidersHorizontal } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { useHomeFilterStore } from '~/store/useHomeFilterStore';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';
import type * as schema from '../../services/database/schema';

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* App icon mark */}
          <View style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: COLORS['um-maize'],
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <UtensilsCrossed size={20} color="#00274C" strokeWidth={2.2} />
          </View>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: isDarkMode ? '#fff' : '#000', letterSpacing: -0.3 }}>
              Dine @ Michigan
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '500', color: COLORS['um-maize'], letterSpacing: 0.2, marginTop: -1 }}>
              University of Michigan
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
