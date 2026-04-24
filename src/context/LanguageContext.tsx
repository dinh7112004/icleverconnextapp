import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, LanguageType } from '../constants/translations';

type LanguageContextType = {
    language: LanguageType;
    setLanguage: (lang: LanguageType) => Promise<void>;
    t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLangState] = useState<LanguageType>('vi');

    useEffect(() => {
        const loadLanguage = async () => {
            const savedLang = await AsyncStorage.getItem('user-language');
            if (savedLang === 'en' || savedLang === 'vi') {
                setLangState(savedLang);
            }
        };
        loadLanguage();
    }, []);

    const setLanguage = async (lang: LanguageType) => {
        setLangState(lang);
        await AsyncStorage.setItem('user-language', lang);
    };

    // Simple t function that supports nested keys like 'home.lessons'
    const t = (key: string): string => {
        const keys = key.split('.');
        let result: any = translations[language];
        
        for (const k of keys) {
            if (result && result[k]) {
                result = result[k];
            } else {
                return key; // Fallback to key itself if not found
            }
        }
        
        return typeof result === 'string' ? result : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
