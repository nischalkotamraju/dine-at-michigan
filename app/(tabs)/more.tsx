import { router } from 'expo-router';
import { Bell, Cog, Map, MessageSquare, Moon, Sun } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';

interface MoreRowProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  isDarkMode: boolean;
}

const MoreRow = ({ icon, label, onPress, isDarkMode }: MoreRowProps) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#262626' : '#F9F9F9',
      marginBottom: 8,
      gap: 14,
    }}
  >
    {icon}
    <Text style={{ fontSize: 15, fontWeight: '600', color: isDarkMode ? '#fff' : '#111', flex: 1 }}>
      {label}
    </Text>
  </TouchableOpacity>
);

const MoreTab = () => {
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  const toggleDarkMode = useSettingsStore((s) => s.toggleDarkMode);
  const insets = useSafeAreaInsets();

  const iconColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const bg = isDarkMode ? '#171717' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#111';

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top, paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color: textColor, marginTop: 16, marginBottom: 24 }}>
        More
      </Text>

      <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 8, letterSpacing: 0.5 }}>
        EXPLORE
      </Text>
      <MoreRow
        icon={<Map size={20} color={iconColor} />}
        label="Campus Map"
        isDarkMode={isDarkMode}
        onPress={() => router.push('/(tabs)/map')}
      />
      <MoreRow
        icon={<Bell size={20} color={iconColor} />}
        label="Notifications"
        isDarkMode={isDarkMode}
        onPress={() => router.push('/(tabs)/notifications')}
      />

      <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 8, marginTop: 16, letterSpacing: 0.5 }}>
        PREFERENCES
      </Text>
      <MoreRow
        icon={isDarkMode ? <Sun size={20} color={iconColor} /> : <Moon size={20} color={iconColor} />}
        label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        isDarkMode={isDarkMode}
        onPress={toggleDarkMode}
      />
      <MoreRow
        icon={<Cog size={20} color={iconColor} />}
        label="Settings"
        isDarkMode={isDarkMode}
        onPress={() => router.push('/(tabs)/settings')}
      />

      <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 8, marginTop: 16, letterSpacing: 0.5 }}>
        FEEDBACK
      </Text>
      <MoreRow
        icon={<MessageSquare size={20} color={iconColor} />}
        label="Send Feedback"
        isDarkMode={isDarkMode}
        onPress={() => {}}
      />
    </View>
  );
};

export default MoreTab;
