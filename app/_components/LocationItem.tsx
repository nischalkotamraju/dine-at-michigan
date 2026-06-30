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
import { getLocationTimeMessage, getNextOpenTimeFormatted } from '~/utils/time';

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

  const statusColor = status === 'open' ? '#FFCB05' : isDarkMode ? '#5B8DB8' : '#00274C';

  const getTimeText = () => {
    if (status === 'open') {
      const msg = getLocationTimeMessage(locationData, currentTime);
      return msg.replace('Open for ', 'Closes in ');
    }
    return null;
  };

  const cardBg = isDarkMode ? '#1C1C1E' : '#F5F5F7';
  const nameColor = isDarkMode ? '#fff' : '#000';
  const typeColor = isDarkMode ? '#555' : '#AEAEB2';
  const timeText = getTimeText();

  return (
    <Reanimated.View style={[animatedStyle, { marginBottom: 8 }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={{
          backgroundColor: cardBg,
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Text */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 16, fontWeight: '600', color: nameColor, letterSpacing: -0.2 }}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          {location.type && (
            <Text style={{ fontSize: 12, color: typeColor, marginTop: 2 }}>
              {location.type}
            </Text>
          )}
          {timeText && (
            <Text style={{ fontSize: 12, color: statusColor, fontWeight: '500', marginTop: 4 }}>
              {timeText}
            </Text>
          )}
        </View>

        <ChevronRight size={14} color={isDarkMode ? '#3A3A3C' : '#C7C7CC'} />
      </Pressable>
    </Reanimated.View>
  );
};

export default LocationItem;
