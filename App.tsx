import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { userCache } from './src/services/userCache';

export default function App() {
  const [initialized, setInitialized] = React.useState(false);

  useEffect(() => {
    async function init() {
      await userCache.initialize();
      setInitialized(true);
    }
    init();
  }, []);

  if (!initialized) return null; // Hoặc hiện SplashScreen ở đây

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppNavigator />
      </LanguageProvider>
    </ThemeProvider>
  );
}