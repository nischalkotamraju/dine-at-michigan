import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
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
import { getLocationTimeMessage } from '~/utils/time';

type LocationItemProps = {
  location: LocationWithType;
  currentTime: Date;
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

  const statusColor = status === 'open' ? '#22C55E' : '#EF4444';
  const nameColor = isDarkMode ? '#fff' : '#000';
  const subColor = isDarkMode ? '#6B7280' : '#9CA3AF';

  const getTimeText = () => {
    if (status === 'open') {
      const msg = getLocationTimeMessage(locationData, currentTime);
      return msg.replace('Open for ', 'Closes in ');
    }
    return status === 'closed' ? 'Closed' : null;
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
          gap: 10,
          backgroundColor: isDarkMode ? '#262626' : '#f9f9f9',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: isDarkMode ? '#333' : '#e5e7eb',
          paddingHorizontal: 14,
          marginBottom: 8,
        }}
      >
        {/* Status dot */}
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor, flexShrink: 0 }} />

        {/* Text */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: nameColor, letterSpacing: -0.2 }} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={{ fontSize: 12, color: subColor, marginTop: 2 }}>
            {getTimeText()}
          </Text>
        </View>

        <ChevronRight size={14} color={isDarkMode ? '#3A3A3C' : '#C7C7CC'} />
      </Pressable>
    </Reanimated.View>
  );
};

export default LocationItem;
