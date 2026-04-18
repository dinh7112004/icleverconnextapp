import React, { useState } from 'react';
import {
    StyleSheet, Text, View, ScrollView, SafeAreaView,
    TouchableOpacity
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import CustomSwitch from '../components/CustomSwitch';

export default function GeneralSettingsScreen({ navigation }: any) {
    const [darkMode, setDarkMode] = useState(false);
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
                <View style={styles.iconBox}>
                    {icon}
                </View>
                <View style={[styles.textContainer, { flex: 1 }]}>
                    <Text style={styles.itemTitle}>{title}</Text>
                    {desc && <Text style={styles.itemDesc}>{desc}</Text>}
                </View>
            </View>
            {rightElement}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cài đặt chung</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>GIAO DIỆN & NGÔN NGỮ</Text>
                <View style={styles.card}>
                    {renderSettingItem(
                        <Ionicons name="globe-outline" size={24} color="#2b58de" />,
                        "Ngôn ngữ",
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.valueText}>Tiếng Việt</Text>
                            <Ionicons name="chevron-forward" size={18} color="#bdc3c7" />
                        </View>,
                        undefined,
                        () => {}
                    )}
                    <View style={styles.divider} />
                    {renderSettingItem(
                        <Ionicons name="moon-outline" size={24} color="#8e44ad" />,
                        "Chế độ tối",
                        <CustomSwitch
                            value={darkMode}
                            onValueChange={setDarkMode}
                        />
                    )}
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 30 }]}>BẢO MẬT & DỮ LIỆU</Text>
                <View style={styles.card}>
                    {renderSettingItem(
                        <Feather name="smartphone" size={24} color="#27ae60" />,
                        "Đăng nhập sinh trắc học",
                        <CustomSwitch
                            value={biometrics}
                            onValueChange={setBiometrics}
                        />,
                        "FaceID / TouchID"
                    )}
                    <View style={styles.divider} />
                    {renderSettingItem(
                        <MaterialCommunityIcons name="database-outline" size={24} color="#e74c3c" />,
                        "Xóa bộ nhớ đệm",
                        <Ionicons name="chevron-forward" size={18} color="#bdc3c7" />,
                        "Giải phóng dung lượng: 24.5 MB",
                        () => {}
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>iClever Connect for iOS</Text>
                    <Text style={styles.footerSubText}>Version 2.5.1 (Build 20240915)</Text>
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
