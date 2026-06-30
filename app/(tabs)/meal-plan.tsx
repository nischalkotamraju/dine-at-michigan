import * as Haptics from 'expo-haptics';
import { BicepsFlexed, Flame, Minus, Wheat } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Notifier } from 'react-native-notifier';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Alert from '~/components/Alert';
import { RemoveAction } from '~/components/AnimatedActions';
import { type MealPlanItem, useMealPlanStore } from '~/store/useMealPlanStore';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';
import { cn } from '~/utils/utils';

const MealPlanRow = ({
  food,
  isDarkMode,
}: {
  food: MealPlanItem;
  isDarkMode: boolean;
}) => {
  const removeMealPlanItem = useMealPlanStore((s) => s.removeMealPlanItem);
  const updateMealPlanItemQuantity = useMealPlanStore((s) => s.updateMealPlanItemQuantity);
  const [quantityInput, setQuantityInput] = useState(`${food.quantity || 1}`);

  const bg = isDarkMode ? '#262626' : '#fff';
  const border = isDarkMode ? '#333' : '#e5e7eb';
  const textColor = isDarkMode ? '#fff' : '#111';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';

  return (
    <ReanimatedSwipeable
      containerStyle={{ borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={50}
      rightThreshold={0}
      renderRightActions={null}
      renderLeftActions={(progress) => <RemoveAction progress={progress} />}
      onSwipeableWillClose={() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }
      onSwipeableOpen={(_dir, swipeable) => {
        swipeable.close();
        removeMealPlanItem(food.name || '');
        Notifier.showNotification({
          title: `${food.name} removed`,
          description: 'Removed from your meal plan.',
          swipeEnabled: true,
          Component: Alert,
          duration: 3000,
          queueMode: 'immediate',
        });
      }}
    >
      <View
        style={{
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: border,
          borderRadius: 10,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }} numberOfLines={2}>
            {food.name}
          </Text>
          <Text style={{ fontSize: 12, color: subColor, marginTop: 2 }}>
            {food.locationName} · {food.menuName}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS['um-maize'], marginTop: 4 }}>
            {food.nutrition?.calories ?? '—'} kcal · {food.nutrition?.protein ?? '—'}g P ·{' '}
            {food.nutrition?.total_carbohydrates ?? '—'}g C
          </Text>
        </View>

        {/* Quantity control */}
        <View style={{ alignItems: 'center', gap: 4 }}>
          <TextInput
            style={{
              height: 36,
              width: 48,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: COLORS['um-maize'],
              textAlign: 'center',
              fontWeight: '700',
              color: COLORS['um-maize'],
              fontSize: 14,
            }}
            keyboardType="decimal-pad"
            value={quantityInput}
            onChangeText={setQuantityInput}
            onEndEditing={() => {
              let qty = parseFloat(quantityInput);
              if (Number.isNaN(qty) || qty <= 0) {
                removeMealPlanItem(food.name || '');
                return;
              }
              qty = Math.min(Math.round(qty * 100) / 100, 99);
              setQuantityInput(qty.toString());
              updateMealPlanItemQuantity(food.name || '', qty);
            }}
          />
          <Text style={{ fontSize: 10, color: subColor }}>qty</Text>
        </View>
      </View>
    </ReanimatedSwipeable>
  );
};

const MealPlanTab = () => {
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  const mealPlanItems = useMealPlanStore((s) => s.mealPlanItems);
  const clearMealPlan = useMealPlanStore((s) => s.clearMealPlan);
  const insets = useSafeAreaInsets();

  const totalCalories = mealPlanItems.reduce(
    (sum, item) => sum + parseFloat(String(item.nutrition?.calories || 0)) * (item.quantity || 1),
    0,
  );
  const totalProtein = mealPlanItems.reduce(
    (sum, item) => sum + parseFloat(String(item.nutrition?.protein || 0)) * (item.quantity || 1),
    0,
  );
  const totalCarbs = mealPlanItems.reduce(
    (sum, item) =>
      sum + parseFloat(String(item.nutrition?.total_carbohydrates || 0)) * (item.quantity || 1),
    0,
  );

  const bg = isDarkMode ? '#171717' : '#fff';
  const cardBg = isDarkMode ? '#262626' : '#F9F9F9';
  const border = isDarkMode ? '#333' : '#e5e7eb';
  const textColor = isDarkMode ? '#fff' : '#111';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      <FlatList
        keyExtractor={(item) => `${item.name}-${item.categoryName}-${item.menuName}`}
        data={mealPlanItems}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ paddingTop: 16, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: textColor }}>My Meal Plan</Text>
              {mealPlanItems.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    clearMealPlan();
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                >
                  <Text style={{ color: COLORS['um-maize'], fontWeight: '600', fontSize: 14 }}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={{ color: subColor, marginTop: 2, fontSize: 13 }}>
              Swipe left on an item to remove it.
            </Text>

            {/* Totals card */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: cardBg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: border,
                padding: 16,
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: COLORS['um-maize'] }}>
                  {Math.round(totalCalories)}
                </Text>
                <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }}>kcal</Text>
              </View>
              <View style={{ width: 1, backgroundColor: border }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: '#3B82F6' }}>
                  {totalProtein.toFixed(1)}g
                </Text>
                <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }}>Protein</Text>
              </View>
              <View style={{ width: 1, backgroundColor: border }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: '#10B981' }}>
                  {totalCarbs.toFixed(1)}g
                </Text>
                <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }}>Carbs</Text>
              </View>
            </View>

            {mealPlanItems.length > 0 && (
              <Text style={{ fontSize: 11, color: subColor, textAlign: 'center' }}>
                Resets daily at midnight
              </Text>
            )}

            <View style={{ height: 1, backgroundColor: border, marginTop: 16 }} />
          </View>
        }
        renderItem={({ item }) => (
          <MealPlanRow food={item} isDarkMode={isDarkMode} />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>
              No items yet
            </Text>
            <Text style={{ color: subColor, marginTop: 6, textAlign: 'center', maxWidth: 240 }}>
              Swipe left on any food item in a menu to add it to your meal plan.
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default MealPlanTab;
