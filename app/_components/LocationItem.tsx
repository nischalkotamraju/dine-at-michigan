import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    opacity.value = withSpring(0.7, { damping: 15, stiffness: 400 });
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

  const statusColor =
    status === 'open' ? '#22C55E' : status === 'opening_soon' ? '#F59E0B' : '#6B7280';

  const nameColor =
    status === 'closed'
      ? isDarkMode ? '#6B7280' : '#AEAEB2'
      : isDarkMode ? '#fff' : '#000';

  const dividerColor = isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  const getStatusText = () => {
    if (status === 'open') {
      const msg = getLocationTimeMessage(locationData, currentTime);
      return msg.replace('Open for ', 'Closes in ');
    }
    if (status === 'opening_soon') {
      const nextTime = getNextOpenTimeFormatted(locationData, currentTime);
      return nextTime ? `Opens ${nextTime}` : 'Opening soon';
    }
    return 'Closed';
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
          paddingHorizontal: 4,
          gap: 10,
        }}
      >
        {/* Status dot */}
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: statusColor,
            flexShrink: 0,
          }}
        />

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 16, fontWeight: '600', color: nameColor, letterSpacing: -0.2 }}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: status === 'closed' ? (isDarkMode ? '#555' : '#AEAEB2') : statusColor,
              fontWeight: '500',
              marginTop: 2,
            }}
          >
            {getStatusText()}
          </Text>
        </View>

        <ChevronRight size={14} color={isDarkMode ? '#3A3A3C' : '#D1D1D6'} />
      </Pressable>

      {/* Hairline divider */}
      <View
        style={{
          height: StyleSheet.hairlineWidth,
          backgroundColor: dividerColor,
          marginLeft: 17,
        }}
      />
    </Reanimated.View>
  );
};

export default LocationItem;
