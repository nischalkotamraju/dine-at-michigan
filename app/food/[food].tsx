import { FlashList } from '@shopify/flash-list';
import { Stack, useLocalSearchParams } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SheetProvider } from 'react-native-actions-sheet';
import { Container } from '~/components/Container';
import TopBar from '~/components/TopBar';
import { useFoodData } from '~/hooks/useFoodData';
import { getSafePostHog } from '~/services/analytics/posthog';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';
import { cn } from '~/utils/utils';
import AllergenSection from './components/AllergenSection';
import NutritionFooter from './components/NutritionFooter';
import NutritionRow from './components/NutritionRow';

const FoodScreen = () => {
  const params = useLocalSearchParams<{
    food: string;
    menu: string;
    category: string;
    location: string;
    favorite: string;
  }>();
  const { food, menu, category, location, favorite } = params;
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);

  const { foodItem, nutritionData, hasAllergens, allergenList, dietaryList } = useFoodData(
    location,
    menu,
    category,
    food,
    favorite === 'true',
  );

  const analytics = getSafePostHog(usePostHog());

  // Filter out serving size from the table rows (shown separately)
  const nutritionDataFiltered = nutritionData.filter(
    (item) => item.key !== 'Serving Size' && item.key !== 'Calories',
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: analytics only
  useEffect(() => {
    analytics.screen(`${food}`, { location, menu, category });
  }, []);

  const bg = isDarkMode ? '#171717' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#111';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const divider = isDarkMode ? '#2a2a2a' : '#F0F0F0';
  const cardBg = isDarkMode ? '#1E1E1E' : '#F9F9F9';
  const border = isDarkMode ? '#333' : '#E5E7EB';

  const cal = foodItem?.nutrition?.calories;
  const protein = foodItem?.nutrition?.protein;
  const carbs = foodItem?.nutrition?.total_carbohydrates;
  const fat = foodItem?.nutrition?.total_fat;

  return (
    <SheetProvider context="food">
      <View style={{ flex: 1, backgroundColor: bg }}>
        <Stack.Screen options={{ title: 'Food' }} />

        {/* Pull-down indicator */}
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4, backgroundColor: bg }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: isDarkMode ? '#333' : '#E5E7EB' }} />
        </View>

        <Container disableInsets className="mx-0 mt-2">
          <FlashList
            estimatedItemSize={32}
            data={nutritionDataFiltered}
            renderItem={({ item }) => <NutritionRow item={item} isDarkMode={isDarkMode} />}
            ListHeaderComponent={
              <View style={{ paddingHorizontal: 24, paddingTop: 16, gap: 16 }}>
                <TopBar variant="food" />

                {foodItem && (
                  <>
                    {/* Title + dietary badges */}
                    <View>
                      <Text style={{ fontSize: 28, fontWeight: '800', color: textColor }}>
                        {foodItem.name}
                      </Text>
                      {dietaryList.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {dietaryList.map((d) => (
                            <View
                              key={d}
                              style={{
                                backgroundColor: COLORS['um-maize'],
                                borderRadius: 20,
                                paddingHorizontal: 10,
                                paddingVertical: 3,
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#00274C' }}>
                                {d}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Large calorie display */}
                    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                      <Text style={{ fontSize: 72, fontWeight: '800', color: textColor, lineHeight: 76 }}>
                        {cal ?? '—'}
                      </Text>
                      <Text style={{ fontSize: 14, color: subColor, fontWeight: '500', marginTop: 4 }}>
                        Calories
                      </Text>
                    </View>

                    {/* Macro row */}
                    <View
                      style={{
                        flexDirection: 'row',
                        backgroundColor: cardBg,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: border,
                        overflow: 'hidden',
                      }}
                    >
                      {[
                        { label: 'Protein', value: protein, unit: 'g' },
                        { label: 'Carbs', value: carbs, unit: 'g' },
                        { label: 'Fat', value: fat, unit: 'g' },
                      ].map(({ label, value, unit }, idx, arr) => (
                        <View
                          key={label}
                          style={{
                            flex: 1,
                            alignItems: 'center',
                            paddingVertical: 14,
                            borderRightWidth: idx < arr.length - 1 ? 1 : 0,
                            borderRightColor: border,
                          }}
                        >
                          <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>
                            {value != null ? `${value}${unit}` : '—'}
                          </Text>
                          <Text style={{ fontSize: 12, color: subColor, marginTop: 2 }}>{label}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Allergen badges */}
                    {hasAllergens && allergenList.length > 0 && (
                      <View>
                        <AllergenSection
                          title="Allergens:"
                          items={allergenList}
                          showTitle
                          isDarkMode={isDarkMode}
                        />
                      </View>
                    )}

                    {/* Nutrition Facts table */}
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: textColor, marginBottom: 8 }}>
                        Nutrition Facts
                      </Text>
                      {/* Serving size row */}
                      {foodItem.nutrition?.serving_size && (
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 8,
                            borderBottomWidth: 1,
                            borderBottomColor: divider,
                          }}
                        >
                          <Text style={{ fontWeight: '600', color: textColor }}>Serving Size</Text>
                          <Text style={{ color: subColor }}>{foodItem.nutrition.serving_size}</Text>
                        </View>
                      )}
                      {/* Calories row */}
                      {cal != null && (
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 8,
                            borderBottomWidth: 1,
                            borderBottomColor: divider,
                          }}
                        >
                          <Text style={{ fontWeight: '700', color: textColor }}>Calories</Text>
                          <Text style={{ fontWeight: '700', color: textColor }}>{cal} kcal</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </View>
            }
            ListFooterComponent={
              foodItem ? (
                <View style={{ paddingHorizontal: 24, paddingBottom: 60 }}>
                  <NutritionFooter
                    ingredients={foodItem.nutrition?.ingredients as string}
                    allergens={allergenList}
                    dietary={dietaryList}
                    isDarkMode={isDarkMode}
                  />
                </View>
              ) : null
            }
          />
        </Container>
      </View>
    </SheetProvider>
  );
};

export default FoodScreen;
