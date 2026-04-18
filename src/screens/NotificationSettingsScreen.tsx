import React, { useState } from 'react';
import {
    StyleSheet, Text, View, ScrollView, SafeAreaView,
    TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomSwitch from '../components/CustomSwitch';

export default function NotificationSettingsScreen({ navigation }: any) {
    const [settings, setSettings] = useState({
        grades: true,
        homework: true,
        attendance: true,
        tuition: true,
        messages: true,
        news: false
    });

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const renderSettingItem = (
        icon: any, 
        title: string, 
        desc: string, 
        value: boolean, 
        key: keyof typeof settings,
        bgColor: string
    ) => (
        <View style={styles.settingItem}>
            <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
                    {icon}
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.itemTitle}>{title}</Text>
                    <Text style={styles.itemDesc}>{desc}</Text>
                </View>
            </View>
            <CustomSwitch
                value={value}
                onValueChange={() => toggleSetting(key)}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* --- HEADER --- */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cài đặt thông báo</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* --- INFO BANNER --- */}
                <View style={styles.infoBanner}>
                    <View style={styles.infoIconBox}>
                        <Ionicons name="information-circle" size={22} color="white" />
                    </View>
                    <Text style={styles.infoText}>
                        Tùy chỉnh các loại thông báo bạn muốn nhận. Các thông báo quan trọng khẩn cấp từ nhà trường vẫn sẽ được gửi.
                    </Text>
                </View>

                {/* --- SETTINGS LIST --- */}
                <View style={styles.settingsCard}>
                    {renderSettingItem(
                        <Ionicons name="book" size={20} color="#22c55e" />,
                        "Cập nhật điểm số",
                        "Nhận thông báo khi có điểm kiểm tra mới",
                        settings.grades,
                        'grades',
                        '#f0fdf4'
                    )}
                    {renderSettingItem(
                        <Ionicons name="book" size={20} color="#a855f7" />,
                        "Bài tập về nhà",
                        "Thông báo khi có bài tập mới được giao",
                        settings.homework,
                        'homework',
                        '#f5f3ff'
                    )}
                    {renderSettingItem(
                        <Ionicons name="calendar" size={20} color="#3b82f6" />,
                        "Điểm danh & Nghi phép",
                        "Thông báo tình trạng điểm danh hàng ngày",
                        settings.attendance,
                        'attendance',
                        '#eff6ff'
                    )}
                    {renderSettingItem(
                        <Ionicons name="card" size={20} color="#f97316" />,
                        "Nhắc đóng học phí",
                        "Thông báo về các khoản thu đến hạn",
                        settings.tuition,
                        'tuition',
                        '#fff7ed'
                    )}
                    {renderSettingItem(
                        <Ionicons name="chatbubble-ellipses" size={20} color="#14b8a6" />,
                        "Tin nhắn giáo viên",
                        "Thông báo khi có tin nhắn mới từ GVCN",
                        settings.messages,
                        'messages',
                        '#f0fdfa'
                    )}
                    {renderSettingItem(
                        <Ionicons name="notifications" size={20} color="#ec4899" />,
                        "Tin tức & Sự kiện",
                        "Thông báo về hoạt động chung của trường",
                        settings.news,
                        'news',
                        '#fdf2f8'
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6'
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    scrollContent: { padding: 20 },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        padding: 18,
        borderRadius: 16,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#dbeafe'
    },
    infoIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#1e40af',
        lineHeight: 18,
        fontWeight: '500'
    },
    settingsCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        paddingTop: 5,
        paddingBottom: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        paddingHorizontal: 15,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    textContainer: { flex: 1 },
    itemTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 2 },
    itemDesc: { fontSize: 12, color: '#94a3b8', lineHeight: 16 }
});
