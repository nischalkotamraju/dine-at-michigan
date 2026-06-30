const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'Dine @ Michigan (Dev)' : 'Dine @ Michigan',
    slug: 'michigan-dining',
    version: '1.2.4',
    scheme: 'michigan-dining',
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/icons/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      [
        'expo-sqlite',
        {
          enableFTS: true,
          useSQLCipher: true,
          android: {
            enableFTS: false,
            useSQLCipher: false,
          },
          ios: {
            customBuildFlags: ['-DSQLITE_ENABLE_DBSTAT_VTAB=1 -DSQLITE_ENABLE_SNAPSHOT=1'],
          },
        },
      ],
      'expo-font',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location.',
        },
      ],
      'expo-localization',
    ],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true,
    },
    orientation: 'portrait',
    icon: './assets/icons/ios-light.png',
    userInterfaceStyle: 'automatic',

    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      icon: {
        dark: './assets/icons/ios-dark.png',
        light: './assets/icons/ios-light.png',
        tinted: './assets/icons/ios-tinted.png',
      },
      bundleIdentifier: IS_DEV ? 'com.nischalkotamraju.michigan-dining.dev' : 'com.nischalkotamraju.michigan-dining',
      entitlements: IS_DEV ? {} : { 'aps-environment': 'production' },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          'Dine @ Michigan needs your location to show your location on the map.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Dine @ Michigan needs your location to show your location on the map.',
        NSLocationUsageDescription:
          'Dine @ Michigan needs your location to show your location on the map.',
      },
      splash: {
        image: './assets/icons/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          image: './assets/icons/splash-icon.png',
          resizeMode: 'contain',
          backgroundColor: '#171717',
        },
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/icons/adaptive-icon.png',
        backgroundColor: '#FFCB05',
      },
      bundleIdentifier: IS_DEV ? 'com.nischalkotamraju.michigan-dining.dev' : 'com.nischalkotamraju.michigan-dining',
      package: 'com.nischalkotamraju.michigandining',
    },
    newArchEnabled: true,
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: '005ee5ea-5ec3-4d96-af00-5d6203694b74',
      },
    },
    owner: 'nischalkotamraju',
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/005ee5ea-5ec3-4d96-af00-5d6203694b74',
    },
  },
};
