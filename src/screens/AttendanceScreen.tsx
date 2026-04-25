import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { academicApi } from '../services/api';
import { getCurrentStudentId } from '../services/userHelper';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function AttendanceScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({ total: 0, present: 0, absent: 0, late: 0, excused: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Month picker state
    const [selectedDate, setSelectedDate] = useState(new Date()); // Default to current date
    const [isPickerVisible, setPickerVisible] = useState(false);

    const loadInitialData = async (targetDate = selectedDate) => {
        const cacheKey = `attendance_cache_${targetDate.getFullYear()}_${targetDate.getMonth()}`;
        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                setStats(data.stats);
                setAttendanceData(data.history);
                // Nếu có cache, tắt loading ngay để hiện dữ liệu luôn
                setLoading(false);
            } else {
                // Nếu chưa có cache thì mới hiện vòng quay loading
                setLoading(true);
            }

            const studentId = await getCurrentStudentId();
            if (!studentId) {
                setLoading(false);
                return;
            }

            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();
            const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

            const [statsRes, historyRes] = await Promise.all([
                academicApi.getAttendanceStats(studentId, { startDate, endDate }),
                academicApi.getAttendance(studentId, { startDate, endDate, limit: 100 })
            ]);

            const statsRaw = statsRes.data?.data || {};
            const newStats = {
                total: statsRaw.totalDays || 0,
                present: statsRaw.presentDays || 0,
                absent: statsRaw.absentDays || 0,
                late: statsRaw.lateDays || 0,
                excused: statsRaw.excusedDays || 0,
            };

            let rawData = [];
            const responseBody = historyRes.data;
            if (responseBody?.success === true) {
                rawData = responseBody.data?.data || responseBody.data || [];
            } else if (Array.isArray(responseBody)) {
                rawData = responseBody;
            }

            const mappedData = rawData.map((item: any) => {
                const dateObj = new Date(item.date);
                const days = [
                    t('calendar.sunday'), 
                    t('calendar.monday'), 
                    t('calendar.tuesday'), 
                    t('calendar.wednesday'), 
                    t('calendar.thursday'), 
                    t('calendar.friday'), 
                    t('calendar.saturday')
                ];
                return {
                    ...item,
                    status: (item.status || 'unknown').toLowerCase(),
                    formattedDate: dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                    dayName: days[dateObj.getDay()] || t('calendar.day')
                };
            });

            setStats(newStats);
            setAttendanceData(mappedData);
            setError(null);
            AsyncStorage.setItem(cacheKey, JSON.stringify({ stats: newStats, history: mappedData }));
        } catch (error: any) {
            console.error('Error fetching attendance:', error);
            if (!loading) setError('Không thể tải dữ liệu điểm danh. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, [selectedDate]);

    const onRefresh = () => {
        setRefreshing(true);
        loadInitialData();
    };

    const handleMonthSelect = (month: number) => {
        const newDate = new Date(selectedDate.getFullYear(), month, 1);
        setSelectedDate(newDate);
        setPickerVisible(false);
        setLoading(true);
    };

    const handleYearChange = (offset: number) => {
        const newDate = new Date(selectedDate.getFullYear() + offset, selectedDate.getMonth(), 1);
        setSelectedDate(newDate);
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'present':
                return (
                    <View style={[styles.badge, styles.badgePresent]}>
                        <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                        <Text style={[styles.badgeText, { color: '#27AE60' }]}>Có mặt</Text>
                    </View>
                );
            case 'excused':
                return (
                    <View style={[styles.badge, styles.badgeExcused]}>
                        <Ionicons name="alert-circle" size={16} color="#E67E22" />
                        <Text style={[styles.badgeText, { color: '#E67E22' }]}>Có phép</Text>
                    </View>
                );
            case 'absent':
                return (
                    <View style={[styles.badge, styles.badgeAbsent]}>
                        <Ionicons name="close-circle" size={16} color="#E74C3C" />
                        <Text style={[styles.badgeText, { color: '#E74C3C' }]}>Vắng</Text>
                    </View>
                );
            default:
                return (
                    <View style={[styles.badge, { backgroundColor: isDark ? '#1E293B' : '#F0F2F5' }]}>
                        <Text style={[styles.badgeText, { color: theme.textSecondary }]}>{status}</Text>
                    </View>
                );
        }
    };


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {t('attendance.title')} {selectedDate.getMonth() + 1}
                </Text>
                <TouchableOpacity
                    style={styles.calendarButton}
                    onPress={() => setPickerVisible(true)}
                >
                    <Ionicons name="calendar-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: theme.surface, borderLeftColor: '#27AE60', borderLeftWidth: 4, shadowColor: isDark ? '#000' : '#000' }]}>
                        <Text style={[styles.statNumber, { color: '#27AE60' }]}>{stats.present}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('attendance.present')}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.surface, borderLeftColor: '#E67E22', borderLeftWidth: 4, shadowColor: isDark ? '#000' : '#000' }]}>
                        <Text style={[styles.statNumber, { color: '#E67E22' }]}>{stats.excused}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('attendance.excused')}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.surface, borderLeftColor: '#E74C3C', borderLeftWidth: 4, shadowColor: isDark ? '#000' : '#000' }]}>
                        <Text style={[styles.statNumber, { color: '#E74C3C' }]}>{stats.absent}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('attendance.absent')}</Text>
                    </View>
                </View>

                {/* Section Title */}
                <View style={styles.sectionTitleRow}>
                    <View style={[styles.titleIconContainer, { backgroundColor: theme.primary }]}>
                        <Ionicons name="list" size={18} color="white" />
                    </View>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('attendance.details')}</Text>
                </View>

                {/* Detail List */}
                <View style={[styles.listContainer, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: isDark ? '#000' : '#000' }]}>
                    {error ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : attendanceData.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-clear-outline" size={48} color={theme.border} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Chưa có dữ liệu điểm danh tháng này.</Text>
                        </View>
                    ) : (
                        attendanceData.map((item, index) => (
                            <View
                                key={item.id || index}
                                style={[
                                    styles.listItem,
                                    { borderBottomColor: theme.border },
                                    index === attendanceData.length - 1 ? { borderBottomWidth: 0 } : {}
                                ]}
                            >
                                <View style={styles.itemLeft}>
                                    <Text style={[styles.itemDay, { color: theme.text }]}>{item.dayName}</Text>
                                    <Text style={[styles.itemDate, { color: theme.textSecondary }]}>{item.formattedDate}</Text>
                                    {item.reason ? (
                                        <Text style={styles.itemReason} numberOfLines={1}>
                                            {item.reason}
                                        </Text>
                                    ) : null}
                                </View>
                                <View style={styles.itemRight}>
                                    {renderStatusBadge(item.status)}
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Information Card */}
                {!error && attendanceData.length > 0 && (
                    <View style={[styles.infoCard, { backgroundColor: isDark ? '#1E293B' : '#EBF2F5' }]}>
                        <Ionicons name="information-circle-outline" size={20} color={isDark ? theme.textSecondary : '#607D8B'} />
                        <Text style={[styles.infoText, { color: isDark ? theme.textSecondary : '#607D8B' }]}>
                            Dữ liệu điểm danh được cập nhật bởi giáo viên chủ nhiệm hàng ngày.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Month Picker Modal */}
            {isPickerVisible && (
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        onPress={() => setPickerVisible(false)}
                    />
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => handleYearChange(-1)}>
                                <Ionicons name="chevron-back" size={24} color={theme.primary} />
                            </TouchableOpacity>
                            <Text style={[styles.modalYearText, { color: theme.text }]}>{selectedDate.getFullYear()}</Text>
                            <TouchableOpacity onPress={() => handleYearChange(1)}>
                                <Ionicons name="chevron-forward" size={24} color={theme.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.monthsGrid}>
                            {[...Array(12)].map((_, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        styles.monthItem,
                                        { backgroundColor: isDark ? '#1E293B' : '#F8F9FA' },
                                        selectedDate.getMonth() === i ? [styles.monthItemActive, { backgroundColor: theme.primary }] : {}
                                    ]}
                                    onPress={() => handleMonthSelect(i)}
                                >
                                    <Text style={[
                                        styles.monthText,
                                        { color: theme.textSecondary },
                                        selectedDate.getMonth() === i ? styles.monthTextActive : {}
                                    ]}>
                                        Tháng {i + 1}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setPickerVisible(false)}
                        >
                            <Text style={[styles.closeButtonText, { color: theme.primary }]}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FB' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    backButton: { padding: 4 },
    calendarButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#2C3E50' },
    scrollContent: { padding: 16, paddingBottom: 32 },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24
    },
    statCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    statNumber: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
    statLabel: { fontSize: 13, color: '#7F8C8D', fontWeight: '500' },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
    titleIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#2C3E50' },
    listContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F0F0F0'
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    itemLeft: { flex: 1 },
    itemDay: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
    itemDate: { fontSize: 14, color: '#7F8C8D', marginTop: 2, fontWeight: '500' },
    itemReason: { fontSize: 13, color: '#E67E22', marginTop: 4, fontStyle: 'italic' },
    itemRight: { marginLeft: 16 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgePresent: { backgroundColor: '#E8F5E9' },
    badgeExcused: { backgroundColor: '#FDF2E2' },
    badgeAbsent: { backgroundColor: '#FDE2E2' },
    badgeText: { fontSize: 12, fontWeight: '700', marginLeft: 4 },
    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#95A5A6', marginTop: 12, fontSize: 15, textAlign: 'center' },
    errorText: { color: '#E74C3C', marginTop: 12, fontSize: 15, textAlign: 'center' },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF2F5',
        borderRadius: 12,
        padding: 12,
        marginTop: 24,
    },
    infoText: { flex: 1, fontSize: 13, color: '#607D8B', marginLeft: 10, lineHeight: 18 },

    // Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20
    },
    modalYearText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2C3E50'
    },
    monthsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%'
    },
    monthItem: {
        width: '30%',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#F8F9FA'
    },
    monthItemActive: {
        backgroundColor: '#4A90E2',
    },
    monthText: {
        fontSize: 14,
        color: '#7F8C8D',
        fontWeight: '600'
    },
    monthTextActive: {
        color: 'white',
    },
    closeButton: {
        marginTop: 10,
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center'
    },
    closeButtonText: {
        color: '#4A90E2',
        fontSize: 16,
        fontWeight: '700'
    }
});
