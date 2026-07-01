import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ChevronRight, Clock, ShoppingBag, ShoppingCart, Truck, UtensilsCrossed, Coffee } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useDatabase } from '~/hooks/useDatabase';
import { useLocationDetails } from '~/hooks/useLocationDetails';
import type { LocationWithType } from '~/services/database/schema';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getTodayInCentralTime } from '~/utils/date';
import { getDetailedLocationStatus } from '~/utils/locationStatus';
import { useLocationName } from '~/utils/locations';
import { getLocationTimeMessage, getNextOpenTimeFormatted } from '~/utils/time';

type LocationItemProps = {
  location: LocationWithType;
  currentTime: Date;
};

const getLocationIcon = (type: string | null, color: string, size = 18) => {
  const t = (type ?? '').toLowerCase();
  if (t.includes('dining hall')) return <UtensilsCrossed size={size} color={color} strokeWidth={1.8} />;
  if (t.includes('caf') || t.includes('coffee')) return <Coffee size={size} color={color} strokeWidth={1.8} />;
  if (t.includes('food court')) return <ShoppingBag size={size} color={color} strokeWidth={1.8} />;
  if (t.includes('convenience')) return <ShoppingCart size={size} color={color} strokeWidth={1.8} />;
  if (t.includes('truck')) return <Truck size={size} color={color} strokeWidth={1.8} />;
  return <ShoppingBag size={size} color={color} strokeWidth={1.8} />;
};

const LocationItem = ({ location, currentTime }: LocationItemProps) => {
  const [status, setStatus] = useState<'open' | 'opening_soon' | 'closed'>('closed');
  const scale = useSharedValue(1);
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
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (locationData?.has_menus) {
      if (router.canDismiss()) router.dismissAll();
      router.push(`/location/${location.name}`);
    } else {
      router.push(`/location_generic/${location.name}`);
    }
  };

  const isOpen = status === 'open';
  const statusColor = isOpen ? '#22C55E' : '#EF4444';
  const iconBg = isOpen ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)';
  const nameColor = isDarkMode ? '#fff' : '#000';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';

  const getTimeText = () => {
    if (isOpen) {
      const msg = getLocationTimeMessage(locationData, currentTime);
      return msg.replace('Open for ', 'Closes in ');
    }
    const nextTime = getNextOpenTimeFormatted(locationData, currentTime);
    return nextTime ? `Opens ${nextTime}` : 'Closed';
  };

  return (
    <Reanimated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          gap: 12,
          backgroundColor: isDarkMode ? '#262626' : '#f9f9f9',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDarkMode ? '#333' : '#e5e7eb',
          paddingHorizontal: 14,
          marginBottom: 8,
        }}
      >
        {/* Status dot */}
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: statusColor, flexShrink: 0 }} />

        {/* Circular icon */}
        <View style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {getLocationIcon(location.type, statusColor)}
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: nameColor, letterSpacing: -0.2 }} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            {isOpen && <Clock size={11} color={subColor} strokeWidth={2} />}
            <Text style={{ fontSize: 12, color: subColor }}>
              {getTimeText()}
            </Text>
          </View>
        </View>

        <ChevronRight size={14} color={isDarkMode ? '#3A3A3C' : '#C7C7CC'} />
      </Pressable>
    </Reanimated.View>
  );
};

export default LocationItem;
