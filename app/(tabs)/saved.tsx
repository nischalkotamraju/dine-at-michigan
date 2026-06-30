import { FlashList } from '@shopify/flash-list';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { Bookmark, BookmarkX } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Notifier } from 'react-native-notifier';
import Alert from '~/components/Alert';
import { useDatabase } from '~/hooks/useDatabase';
import { toggleFavorites } from '~/services/database/database';
import * as schema from '~/services/database/schema';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';

type Tab = 'foods' | 'halls';

const SavedTab = () => {
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  const db = useDatabase();
  const { data: favorites } = useLiveQuery(db.select().from(schema.favorites));
  const [activeTab, setActiveTab] = useState<Tab>('foods');
  const insets = useSafeAreaInsets();

  const sortedFavorites = useMemo(
    () =>
      [...favorites].sort(
        (a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime(),
      ),
    [favorites],
  );

  const bg = isDarkMode ? '#171717' : '#fff';
  const cardBg = isDarkMode ? '#262626' : '#F9F9F9';
  const border = isDarkMode ? '#333' : '#e5e7eb';
  const textColor = isDarkMode ? '#fff' : '#111';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const tabActiveBg = isDarkMode ? '#333' : '#00274C';
  const tabInactiveBg = isDarkMode ? '#262626' : '#F0F0F0';

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      <FlashList
        estimatedItemSize={72}
        data={activeTab === 'foods' ? sortedFavorites : []}
        keyExtractor={(item) => `${item.name}-${item.location_name}`}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ paddingTop: 16, paddingBottom: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: textColor, marginBottom: 16 }}>
              Saved
            </Text>

            {/* Tab toggle */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: tabInactiveBg,
                borderRadius: 10,
                padding: 3,
                marginBottom: 16,
              }}
            >
              {(['foods', 'halls'] as Tab[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: activeTab === t ? tabActiveBg : 'transparent',
                  }}
                  onPress={() => setActiveTab(t)}
                >
                  <Text
                    style={{
                      fontWeight: '600',
                      fontSize: 14,
                      color: activeTab === t ? '#fff' : subColor,
                    }}
                  >
                    {t === 'foods' ? 'Foods' : 'Dining Halls'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTab === 'foods' && sortedFavorites.length > 0 && (
              <Text style={{ fontSize: 11, fontWeight: '600', color: subColor, marginBottom: 8, letterSpacing: 0.5 }}>
                FAVORITE FOODS
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/food/[food]',
                params: {
                  food: item.name,
                  menu: item.menu_name,
                  category: item.category_name,
                  location: item.location_name,
                  favorite: 'true',
                },
              })
            }
            style={{
              backgroundColor: cardBg,
              borderRadius: 10,
              padding: 14,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ fontSize: 12, color: subColor, marginTop: 2 }}>
                {item.location_name} · {item.menu_name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                Notifier.showNotification({
                  title: `${item.name} removed`,
                  description: 'Removed from saved foods.',
                  swipeEnabled: true,
                  Component: Alert,
                  duration: 3000,
                  queueMode: 'immediate',
                });
                await toggleFavorites(
                  db,
                  { name: item.name, nutrition: undefined, allergens: undefined, link: '' },
                  item.location_name,
                  item.menu_name,
                  item.category_name,
                );
              }}
              style={{ padding: 4 }}
            >
              <Bookmark size={18} color={COLORS['um-maize']} fill={COLORS['um-maize']} />
            </TouchableOpacity>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
            {activeTab === 'foods' ? (
              <>
                <BookmarkX size={48} color={border} />
                <Text style={{ fontSize: 17, fontWeight: '700', color: textColor, marginTop: 16 }}>
                  No saved foods yet
                </Text>
                <Text style={{ color: subColor, marginTop: 6, textAlign: 'center', maxWidth: 240 }}>
                  Swipe left on a food item and tap the heart to save it.
                </Text>
              </>
            ) : (
              <>
                <Bookmark size={48} color={border} />
                <Text style={{ fontSize: 17, fontWeight: '700', color: textColor, marginTop: 16 }}>
                  Coming soon
                </Text>
                <Text style={{ color: subColor, marginTop: 6, textAlign: 'center', maxWidth: 240 }}>
                  Save your favorite dining halls for quick access.
                </Text>
              </>
            )}
          </View>
        }
      />
    </View>
  );
};

export default SavedTab;
