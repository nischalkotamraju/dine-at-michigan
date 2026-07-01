import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Search as SearchIcon, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';
import { cn } from '~/utils/utils';

interface SearchResult {
  name: string;
  locationNames: string[];
  menuName: string;
  categoryName: string;
  calories: string | null;
  protein: string | null;
  carbs: string | null;
}

const SearchScreen = () => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<TextInput>(null);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      const rows = db.getAllSync<{
        name: string;
        location_names: string;
        menu_name: string;
        category_title: string;
        calories: string | null;
        protein: string | null;
        total_carbohydrates: string | null;
      }>(
        `SELECT fi.name, GROUP_CONCAT(DISTINCT l.name) as location_names, m.name as menu_name,
                mc.title as category_title,
                n.calories, n.protein, n.total_carbohydrates
         FROM food_item fi
         JOIN menu_category mc ON fi.menu_category_id = mc.id
         JOIN menu m ON mc.menu_id = m.id
         JOIN location l ON m.location_id = l.id
         LEFT JOIN nutrition n ON fi.nutrition_id = n.id
         WHERE fi.name LIKE ? COLLATE NOCASE
         GROUP BY fi.name
         ORDER BY fi.name
         LIMIT 100`,
        [`%${text.trim()}%`],
      );

      setResults(
        rows.map((r) => ({
          name: r.name,
          locationNames: r.location_names ? r.location_names.split(',') : [],
          menuName: r.menu_name,
          categoryName: r.category_title,
          calories: r.calories,
          protein: r.protein,
          carbs: r.total_carbohydrates,
        })),
      );
    } catch {
      setResults([]);
    }
  };

  const bg = isDarkMode ? '#171717' : '#fff';
  const cardBg = isDarkMode ? '#262626' : '#f9f9f9';
  const textColor = isDarkMode ? '#fff' : '#111';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const borderColor = isDarkMode ? '#333' : '#e5e7eb';

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: textColor, marginBottom: 12 }}>
          Search
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: cardBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor,
            paddingHorizontal: 12,
            height: 44,
          }}
        >
          <SearchIcon size={18} color={subColor} />
          <TextInput
            ref={inputRef}
            style={{ flex: 1, marginLeft: 8, fontSize: 16, color: textColor }}
            placeholder="Search all menu items..."
            placeholderTextColor={subColor}
            value={query}
            onChangeText={handleSearch}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <X size={16} color={subColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {query.length < 2 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <SearchIcon size={48} color={borderColor} />
          <Text style={{ marginTop: 12, fontSize: 16, color: subColor, textAlign: 'center' }}>
            Type at least 2 characters{'\n'}to search across all dining halls
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>No results found</Text>
          <Text style={{ marginTop: 4, color: subColor }}>Try a different search term</Text>
        </View>
      ) : (
        <FlashList
          estimatedItemSize={72}
          data={results}
          keyExtractor={(item, i) => `${item.name}-${i}`}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/food/[food]',
                  params: {
                    food: item.name,
                    menu: item.menuName,
                    category: item.categoryName,
                    location: item.locationNames[0] ?? '',
                    favorite: 'false',
                  },
                })
              }
              style={{
                backgroundColor: cardBg,
                borderRadius: 10,
                padding: 14,
                marginBottom: 8,
                borderWidth: 1,
                borderColor,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }} numberOfLines={1}>
                {item.name}
              </Text>
              {(item.calories || item.protein || item.carbs) && (
                <Text style={{ fontSize: 12, color: COLORS['um-maize'], marginTop: 3 }}>
                  {item.calories ? `${item.calories} kcal` : '—'}
                  {' · '}
                  {item.protein ? `${item.protein}g P` : '—'}
                  {' · '}
                  {item.carbs ? `${item.carbs}g C` : '—'}
                </Text>
              )}
              {item.locationNames.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {item.locationNames.map((loc) => (
                    <View
                      key={loc}
                      style={{
                        backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E7EB',
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '500', color: subColor }}>
                        {loc}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Pressable>
          )}
          ListHeaderComponent={
            <Text style={{ color: subColor, fontSize: 12, marginBottom: 8, marginTop: 4 }}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      )}
    </View>
  );
};

export default SearchScreen;
