import React, { useState } from 'react';
import {
    StyleSheet, Text, View, ScrollView, SafeAreaView,
    TouchableOpacity
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import CustomSwitch from '../components/CustomSwitch';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function GeneralSettingsScreen({ navigation }: any) {
    const { isDark, toggleTheme, theme } = useTheme();
    const { t, language } = useLanguage();
    const [biometrics, setBiometrics] = useState(true);

    const renderSettingItem = (
        icon: any, 
        title: string, 
        rightElement?: React.ReactNode, 
        desc?: string,
        onPress?: () => void
    ) => (
        <TouchableOpacity 
            style={styles.settingItem} 
            onPress={onPress} 
            disabled={!onPress}
            activeOpacity={0.7}
        >
            <View style={styles.itemLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#2D3748' : '#F8F9FA' }]}>
                    {icon}
                </View>
                <View style={[styles.textContainer, { flex: 1 }]}>
                    <Text style={[styles.itemTitle, { color: theme.text }]}>{title}</Text>
                    {desc && <Text style={[styles.itemDesc, { color: theme.textSecondary }]}>{desc}</Text>}
                </View>
            </View>
            {rightElement}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{t('settings.title')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('settings.appearance')}</Text>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    {renderSettingItem(
                        <Ionicons name="globe-outline" size={24} color="#3B82F6" />,
                        t('settings.language'),
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.valueText, { color: theme.textSecondary }]}>
                                {language === 'vi' ? 'Tiếng Việt' : 'English'}
                            </Text>
                            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                        </View>,
                        undefined,
                        () => navigation.navigate('LanguageSelection')
                    )}
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    {renderSettingItem(
                        <Ionicons name="moon-outline" size={24} color="#818CF8" />,
                        t('settings.darkMode'),
                        <CustomSwitch
                            value={isDark}
                            onValueChange={toggleTheme}
                        />
                    )}
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 30, color: theme.textSecondary }]}>{t('settings.security')}</Text>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    {renderSettingItem(
                        <Feather name="smartphone" size={24} color="#10B981" />,
                        t('settings.biometric'),
                        <CustomSwitch
                            value={biometrics}
                            onValueChange={setBiometrics}
                        />,
                        "FaceID / TouchID"
                    )}
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    {renderSettingItem(
                        <MaterialCommunityIcons name="database-outline" size={24} color="#F87171" />,
                        t('settings.clearCache'),
                        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />,
                        t('settings.clearCacheDesc') + ": 24.5 MB",
                        () => {}
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>iClever Connect for iOS</Text>
                    <Text style={styles.footerSubText}>{t('settings.version')} 2.5.1 (Build 20240915)</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6'
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    scrollContent: { padding: 16 },
    sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#95a5a6', marginBottom: 15, paddingLeft: 5 },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 15
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    textContainer: { flex: 1 },
    itemTitle: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
    itemDesc: { fontSize: 12, color: '#95a5a6', marginTop: 3 },
    valueText: { fontSize: 14, color: '#7f8c8d', marginRight: 8 },
    divider: { height: 1, backgroundColor: '#f1f2f6', marginHorizontal: 15 },
    footer: { marginTop: 40, alignItems: 'center', paddingBottom: 20 },
    footerText: { fontSize: 14, color: '#bdc3c7', fontWeight: '500' },
    footerSubText: { fontSize: 12, color: '#bdc3c7', marginTop: 5 }
});
