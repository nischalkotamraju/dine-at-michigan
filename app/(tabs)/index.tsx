import { useQuery, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import * as Network from 'expo-network';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { type SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Notifier } from 'react-native-notifier';
import Alert from '~/components/Alert';
import { Container } from '~/components/Container';
import OnboardingScreen from '~/components/onboarding/OnboardingScreen';
import { useOnboardingStore } from '~/store/useOnboardingStore';
import { useHomeFilterStore } from '~/store/useHomeFilterStore';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';
import { getTodayInCentralTime } from '~/utils/date';
import { getDetailedLocationStatus } from '~/utils/locationStatus';
import { fetchMenuData } from '~/utils/queries';
import { cn } from '~/utils/utils';
import * as schema from '../../services/database/schema';
import HomeHeader from '../_components/HomeHeader';
import LocationItem from '../_components/LocationItem';

// Constants
const SPLASH_SCREEN_DURATION = 1000;
const NOTIFICATION_DURATION = 3000;

// Configure splash screen
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: SPLASH_SCREEN_DURATION,
  fade: true,
});

// Types
export type FilterType = 'all' | string;

type SectionedLocations = {
  open: schema.LocationWithType[];
  openingSoon: schema.LocationWithType[];
  closed: schema.LocationWithType[];
};

const sectionAndFilterLocations = (
  locations: schema.LocationWithType[],
  locationTypes: schema.LocationType[],
  filter: FilterType,
  db: DrizzleDB,
  currentTime: Date,
): SectionedLocations => {
  let filtered = locations;
  if (filter !== 'all') {
    const targetType = locationTypes.find((t) => t.name === filter);
    if (targetType) filtered = locations.filter((l) => l.type_id === targetType.id);
  }

  const todayDate = getTodayInCentralTime();
  const open: schema.LocationWithType[] = [];
  const openingSoon: schema.LocationWithType[] = [];
  const closed: schema.LocationWithType[] = [];

  for (const location of filtered) {
    const locationData = db
      .select()
      .from(schema.location)
      .where(eq(schema.location.id, location.id))
      .get();

    const status = getDetailedLocationStatus(
      location,
      locationData ?? null,
      db,
      currentTime,
      todayDate,
    );

    if (status === 'open') open.push(location);
    else closed.push(location);
  }

  return { open, openingSoon, closed };
};

export type DrizzleDB = ExpoSQLiteDatabase<typeof schema> & {
  $client: SQLiteDatabase;
};

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const { selectedFilter } = useHomeFilterStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [layoutLoaded, setLayoutLoaded] = useState(false);
  const isOnboardingComplete = useOnboardingStore((state) => state.isOnboardingComplete);

  const db = useSQLiteContext();
  const drizzleDb: DrizzleDB = drizzle(db, { schema });
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const queryClient = useQueryClient();

  useDrizzleStudio(db);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  // Use TanStack Query for menu/location data
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['menuData'],
    queryFn: () => fetchMenuData(drizzleDb),
    staleTime: 3 * 60 * 60 * 1000, // 3 hours
    refetchInterval: 30 * 60 * 1000, // 15 minutes polling while in app
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false, // Don't retry on failure - just use cached data
  });

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Check if user is online before attempting to refetch
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        Notifier.showNotification({
          title: 'No Internet Connection',
          description: 'Please check your connection and try again.',
          duration: NOTIFICATION_DURATION,
          Component: Alert,
        });
        return;
      }

      // Add timeout to refetch operation (10 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000);
      });

      // Force sync with Supabase and then refetch the query
      await Promise.race([
        fetchMenuData(drizzleDb, true).then(() =>
          Promise.all([
            queryClient.invalidateQueries({ queryKey: ['menuData'] }),
            queryClient.invalidateQueries({ queryKey: ['menuNames'] }),
          ]),
        ),
        timeoutPromise,
      ]);

      setRefreshKey((prev) => prev + 1);

      Notifier.showNotification({
        title: 'Refreshed!',
        description: 'Menu data is up to date.',
        duration: NOTIFICATION_DURATION,
        Component: Alert,
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      const errorMessage =
        error instanceof Error && error.message === 'Request timeout'
          ? 'Request timed out. Please try again.'
          : 'Unable to update data. Please try again.';

      Notifier.showNotification({
        title: 'Refresh Failed',
        description: errorMessage,
        duration: NOTIFICATION_DURATION,
        Component: Alert,
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Handle splash screen
  const onLayoutRootView = () => {
    setLayoutLoaded(true);
  };

  useEffect(() => {
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    if (layoutLoaded && !isLoading && !isFetching) {
      console.log('✅ Splash screen hidden');
    }
  }, [layoutLoaded, isLoading, isFetching]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDarkMode ? '#171717' : '#fff',
        }}
      >
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (isError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDarkMode ? '#171717' : '#fff',
        }}
      >
        <Text
          className={cn('font-bold text-lg', isDarkMode ? 'text-white' : 'text-um-maize')}
        >
          Failed to load data!
        </Text>

        <Text
          className={cn('mb-4 max-w-64 text-center', isDarkMode ? 'text-gray-300' : 'text-ut-grey')}
        >
          If you just updated the app, close and reopen the app.
        </Text>

        <TouchableOpacity
          onPress={handleRefresh}
          className="rounded-full bg-um-maize px-4 py-2"
        >
          <Text className="font-bold text-white">Reload</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const locations = data?.locations || [];
  const locationTypes = data?.locationTypes || [];

  const { open, openingSoon, closed } = sectionAndFilterLocations(
    locations,
    locationTypes,
    selectedFilter,
    drizzleDb,
    currentTime,
  );

  // Build a flat list with section headers
  type ListRow =
    | { type: 'header'; label: string; color: string }
    | { type: 'location'; item: schema.LocationWithType };

  const listData: ListRow[] = [];
  if (open.length > 0) {
    listData.push({ type: 'header', label: 'OPEN NOW', color: '#FFCB05' });
    for (const item of open) listData.push({ type: 'location', item });
  }
  if (closed.length > 0) {
    listData.push({ type: 'header', label: 'CLOSED', color: isDarkMode ? '#5B8DB8' : '#00274C' });
    for (const item of closed) listData.push({ type: 'location', item });
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#171717' : '#fff' }}>
      <Stack.Screen options={{ title: 'Home' }} />
      <Container disableBottomPadding onLayout={onLayoutRootView}>
        <OnboardingScreen isOnboardingComplete={isOnboardingComplete} />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" />
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center">
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
              Failed to load data. Please try again.
            </Text>
          </View>
        ) : (
          <FlatList
            extraData={[currentTime, selectedFilter, refreshKey]}
            data={listData}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={isDarkMode ? COLORS['um-grey-dark-mode'] : '#8E8E93'}
              />
            }
            contentContainerStyle={{ paddingBottom: 32 }}
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return (
                  <View style={{ paddingHorizontal: 0, paddingTop: 16, paddingBottom: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: item.color, letterSpacing: 0.8 }}>
                      {item.label}
                    </Text>
                  </View>
                );
              }
              return (
                <View style={{ paddingHorizontal: 0 }}>
                  <LocationItem
                    key={`${item.item.id}-${refreshKey}`}
                    location={item.item}
                    currentTime={currentTime}
                  />
                </View>
              );
            }}
            keyExtractor={(item, index) =>
              item.type === 'header' ? `header-${item.label}` : `loc-${item.item.id}-${index}`
            }
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <HomeHeader
                currentTime={currentTime}
                locationTypes={locationTypes}
              />
            }
          />
        )}
      </Container>
    </View>
  );
}
