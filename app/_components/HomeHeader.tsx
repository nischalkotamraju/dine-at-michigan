import * as Haptics from 'expo-haptics';
import { Check, SlidersHorizontal, X } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';
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
  const insets = useSafeAreaInsets();
  const [sheetVisible, setSheetVisible] = useState(false);

  const textColor = isDarkMode ? '#fff' : '#111';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const filterActive = selectedFilter !== 'all';
  const activeLabel = filterActive
    ? locationTypes.find((t) => t.name === selectedFilter)?.name ?? 'All'
    : null;

  const sheetBg = isDarkMode ? '#1C1C1E' : '#fff';
  const divider = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const options = [
    { id: 'all', name: 'All Locations' },
    ...locationTypes
      .sort((a, b) => a.display_order - b.display_order)
      .map((t) => ({ id: t.name, name: t.name })),
  ];

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilter(id as FilterType);
    setSheetVisible(false);
  };

  return (
    <View style={{ marginTop: 8, gap: 16 }}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
          setSheetVisible(true);
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 20,
          backgroundColor: filterActive
            ? COLORS['um-maize']
            : isDarkMode ? '#2C2C2E' : '#F2F2F7',
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

      {/* Native modal sheet */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        onRequestClose={() => setSheetVisible(false)}
      >
        {/* Backdrop */}
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => setSheetVisible(false)}
        >
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
        </Pressable>

        {/* Sheet */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: sheetBg,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingBottom: insets.bottom + 8,
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: isDarkMode ? '#555' : '#D1D1D6' }} />
          </View>

          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: subColor, letterSpacing: 0.5 }}>
              FILTER BY TYPE
            </Text>
            <TouchableOpacity onPress={() => setSheetVisible(false)}>
              <X size={18} color={subColor} />
            </TouchableOpacity>
          </View>

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: divider }} />

          {/* Options */}
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
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                  }}
                >
                  <Text style={{ fontSize: 17, fontWeight: isSelected ? '600' : '400', color: isSelected ? COLORS['um-maize'] : textColor }}>
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
      </Modal>
    </View>
  );
};

export default HomeHeader;
