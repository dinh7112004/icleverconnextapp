import React from 'react';
import {
    StyleSheet, Text, View,
    TouchableOpacity, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageType } from '../constants/translations';

export default function LanguageSelectionScreen({ navigation }: any) {
    const { theme, isDark } = useTheme();
    const { language, setLanguage, t } = useLanguage();

    const languages: { id: LanguageType; name: string; flag: string }[] = [
        { id: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
        { id: 'en', name: 'English', flag: '🇺🇸' },
    ];

    const handleSelect = async (id: LanguageType) => {
        await setLanguage(id);
        navigation.goBack();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{t('settings.selectLanguage')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                <FlatList
                    data={languages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={[styles.langItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
                            onPress={() => handleSelect(item.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.langLeft}>
                                <Text style={styles.flag}>{item.flag}</Text>
                                <Text style={[styles.langName, { color: theme.text }]}>{item.name}</Text>
                            </View>
                            {language === item.id && (
                                <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                            )}
                        </TouchableOpacity>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 60,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { flex: 1, padding: 16 },
    langItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
    },
    langLeft: { flexDirection: 'row', alignItems: 'center' },
    flag: { fontSize: 24, marginRight: 15 },
    langName: { fontSize: 16, fontWeight: '600' },
});
