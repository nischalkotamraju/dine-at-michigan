import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  ChevronRight,
  Coffee,
  ShoppingBag,
  ShoppingCart,
  UtensilsCrossed,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useDatabase } from '~/hooks/useDatabase';
import { useLocationDetails } from '~/hooks/useLocationDetails';
import type { LocationWithType } from '~/services/database/schema';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';
import { getTodayInCentralTime } from '~/utils/date';
import { getDetailedLocationStatus } from '~/utils/locationStatus';
import { useLocationName } from '~/utils/locations';
import { getLocationTimeMessage, getNextOpenTimeFormatted } from '~/utils/time';

type LocationItemProps = {
  location: LocationWithType;
  currentTime: Date;
};

const getLocationIcon = (type: string | null, color: string, size = 20) => {
  const t = (type ?? '').toLowerCase();
  if (t.includes('cafeteria') || t.includes('cafe')) return <Coffee size={size} color={color} />;
  if (t.includes('market') || t.includes('convenience')) return <ShoppingCart size={size} color={color} />;
  if (t.includes('food court')) return <ShoppingBag size={size} color={color} />;
  return <UtensilsCrossed size={size} color={color} />;
};

const LocationItem = ({ location, currentTime }: LocationItemProps) => {
  const [status, setStatus] = useState<'open' | 'opening_soon' | 'closed'>('closed');
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const db = useDatabase();
  const { useColloquialNames, isDarkMode } = useSettingsStore();
  const { locationData } = useLocationDetails(location.name ?? '');
  const displayName = useLocationName(location.name ?? '', useColloquialNames);

  useEffect(() => {
    const todayDate = getTodayInCentralTime();
    const s = getDetailedLocationStatus(location, locationData, db, currentTime, todayDate);
    setStatus(s);
  }, [locationData, currentTime, db, location]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    opacity.value = withSpring(0.85, { damping: 15, stiffness: 400 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (locationData?.has_menus) {
      if (router.canDismiss()) router.dismissAll();
      router.push(`/location/${location.name}`);
    } else {
      router.push(`/location_generic/${location.name}`);
    }
  };

  // Colors by status
  const statusColor =
    status === 'open' ? '#22C55E' : status === 'opening_soon' ? '#F59E0B' : '#9CA3AF';

  const iconBg =
    status === 'open'
      ? isDarkMode ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)'
      : status === 'opening_soon'
        ? isDarkMode ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)'
        : isDarkMode ? '#2a2a2a' : '#F3F4F6';

  const iconColor =
    status === 'open' ? '#22C55E' : status === 'opening_soon' ? '#F59E0B' : '#9CA3AF';

  const cardBg = isDarkMode ? '#1C1C1E' : '#F2F2F7';
  const dividerColor = isDarkMode ? '#2C2C2E' : '#E0E0E5';
  const nameColor =
    status === 'closed'
      ? isDarkMode ? '#555' : '#AEAEB2'
      : isDarkMode ? '#fff' : '#000';
  const typeColor = isDarkMode ? '#636366' : '#8E8E93';

  // Status text
  const getStatusText = () => {
    if (status === 'open') {
      const msg = getLocationTimeMessage(locationData, currentTime);
      // "Open for X hours" → "Closes X:XX PM" style
      return `Open · ${msg.replace('Open for ', 'Closes in ')}`;
    }
    if (status === 'opening_soon') {
      const nextTime = getNextOpenTimeFormatted(locationData, currentTime);
      return nextTime ? `Opens ${nextTime}` : 'Opening soon';
    }
    return 'Closed';
  };

  return (
    <Reanimated.View style={[animatedStyle, { backgroundColor: cardBg }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          gap: 14,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {getLocationIcon(location.type, iconColor, 18)}
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: nameColor }} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
            <Text style={{ fontSize: 13, color: statusColor, fontWeight: '500' }}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        <ChevronRight size={16} color={isDarkMode ? '#3A3A3C' : '#C7C7CC'} />
      </Pressable>

      {/* Inset divider */}
      <View style={{ height: 1, backgroundColor: dividerColor, marginLeft: 70 }} />
    </Reanimated.View>
  );
};

export default LocationItem;
