import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Share } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function NewsDetailScreen({ route, navigation }: any) {
    const { theme, isDark } = useTheme();
    const { t } = useLanguage();
    const { item } = route.params;

    const handleShare = async () => {
        try {
            await Share.share({
                title: item.title,
                message: `${item.title}\n\n${item.content}`,
            });
        } catch (error) {
            console.log('Error sharing:', error);
        }
    };

    const getIconInfo = (type: string) => {
        switch(type) {
            case 'attendance_marked': return { name: 'time-outline', color: '#e17055', label: 'Chuyên cần' };
            case 'payment_due': return { name: 'card-outline', color: '#3498db', label: 'Học phí' };
            case 'announcement': return { name: 'warning-outline', color: '#e74c3c', label: 'Thông báo khẩn' };
            default: return { name: 'notifications-outline', color: theme.primary, label: 'Thông báo' };
        }
    };

    const iconInfo = getIconInfo(item.type);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                    Chi tiết thông báo
                </Text>
                <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
                    <Ionicons name="share-social-outline" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.typeBadge, { backgroundColor: isDark ? '#1E293B' : '#f1f5f9' }]}>
                    <Ionicons name={iconInfo.name as any} size={16} color={iconInfo.color} />
                    <Text style={[styles.typeText, { color: iconInfo.color }]}>{iconInfo.label}</Text>
                </View>

                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>

                <View style={styles.infoRow}>
                    <View style={styles.senderBox}>
                        <View style={[styles.avatarBox, { backgroundColor: theme.primary }]}>
                            <Text style={styles.avatarText}>{item.sender?.charAt(0) || 'S'}</Text>
                        </View>
                        <View style={{ marginLeft: 10 }}>
                            <Text style={[styles.senderName, { color: theme.text }]}>{item.sender || 'Ban Giám Hiệu'}</Text>
                            <Text style={[styles.dateText, { color: theme.textSecondary }]}>{item.time} • {item.date}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.contentBox}>
                    <Text style={[styles.content, { color: theme.text }]}>
                        {item.content}
                    </Text>
                </View>

                {item.data?.isOfficial && (
                    <View style={[styles.officialBox, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: isDark ? '#065f46' : '#dcfce7' }]}>
                        <MaterialCommunityIcons name="shield-check" size={24} color="#27ae60" />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={[styles.officialTitle, { color: '#27ae60' }]}>Văn bản chính thức</Text>
                            <Text style={[styles.officialDesc, { color: theme.textSecondary }]}>
                                Đây là thông báo có tính pháp lý từ nhà trường. Mã số: {item.data.code || 'N/A'}
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 10 },
    shareBtn: { padding: 4 },
    scrollContent: { padding: 20 },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    typeText: { fontSize: 12, fontWeight: '700', marginLeft: 6 },
    title: { fontSize: 24, fontWeight: '800', lineHeight: 32, marginBottom: 20 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    senderBox: { flexDirection: 'row', alignItems: 'center' },
    avatarBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    senderName: { fontSize: 15, fontWeight: '700' },
    dateText: { fontSize: 13, marginTop: 2 },
    divider: { height: 1, marginBottom: 25 },
    contentBox: { marginBottom: 30 },
    content: { fontSize: 16, lineHeight: 26 },
    officialBox: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 40,
    },
    officialTitle: { fontSize: 15, fontWeight: '700' },
    officialDesc: { fontSize: 13, marginTop: 4 },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
    mainActionBtn: {
        height: 54,
        borderRadius: 27,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainActionText: { color: 'white', fontSize: 16, fontWeight: '700', marginLeft: 8 }
});
