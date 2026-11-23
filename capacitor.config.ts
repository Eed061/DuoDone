import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ua.duodone.app',
  appName: 'DuoDone',
  webDir: 'client/dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#020617',
  },
  backgroundColor: '#020617',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: '#020617',
      showSpinner: false,
    },
  },
};

export default config;
