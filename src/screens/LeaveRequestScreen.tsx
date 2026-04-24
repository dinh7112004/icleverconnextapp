import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, TextInput, Alert, Dimensions,
    Modal, Platform, Image, Linking, RefreshControl
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { leaveApi, uploadApi } from '../services/api';
import { getCurrentUser } from '../services/userHelper';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CACHE_KEY = 'leave_history_cache';

type Screen = 'list' | 'form';

export default function LeaveRequestScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();
    const [screen, setScreen] = useState<Screen>('list');
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [leaveType, setLeaveType] = useState<'day' | 'period'>('day');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [singleDate, setSingleDate] = useState('');
    const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);
    const [reason, setReason] = useState('');
    const [attachment, setAttachment] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    // Calendar Modal State
    const [showCalendar, setShowCalendar] = useState(false);
    const [pickingFor, setPickingFor] = useState<'from' | 'to' | 'single'>('from');
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const fetchHistory = useCallback(async (isRefresh = false) => {
        if (!isRefresh && requests.length === 0) setLoading(true);
        try {
            // Load from cache
            if (!isRefresh && requests.length === 0) {
                const cached = await AsyncStorage.getItem(CACHE_KEY);
                if (cached) {
                    setRequests(JSON.parse(cached));
                    setLoading(false);
                }
            }

            const user = await getCurrentUser();
            if (!user) return;
            const params = user.role === 'parent'
                ? { parentId: user.id }
                : { studentId: user.studentId || user.id };
            const res = await leaveApi.getAll(params);
            const data = res.data.data || [];
            setRequests(data);
            AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (err) {
            console.error('LeaveRequest fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [requests.length]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory(true);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled) setAttachment(result.assets[0]);
    };

    const handleSubmit = async () => {
        const dateVal = leaveType === 'day' ? fromDate : singleDate;
        if (!dateVal.trim() || !reason.trim()) {
            Alert.alert(t('common.error'), t('homework.missingData'));
            return;
        }
        setSubmitting(true);
        try {
            const user = await getCurrentUser();
            if (!user) throw new Error('User not found');

            let uploadedUrl = '';
            if (attachment) {
                const formData = new FormData();
                formData.append('file', {
                    uri: Platform.OS === 'ios' ? attachment.uri.replace('file://', '') : attachment.uri,
                    type: 'image/jpeg',
                    name: attachment.fileName || `leave_${Date.now()}.jpg`,
                } as any);

                const uploadRes = await uploadApi.post(formData, 'leave-requests');
                if (uploadRes.data.success) uploadedUrl = uploadRes.data.url;
            }
            
            const payload: any = {
                studentId: user.studentId,
                parentId: user.id,
                classId: user.classId || '',
                type: leaveType,
                reason,
                attachmentUrl: uploadedUrl,
            };
            if (leaveType === 'day') {
                payload.fromDate = fromDate;
                payload.toDate = toDate || fromDate;
            } else {
                payload.singleDate = singleDate;
                payload.periods = selectedPeriods;
            }
            await leaveApi.submit(payload);
            Alert.alert(t('common.success'), t('leave.submitSuccess'), [
                { text: 'OK', onPress: () => {
                    setScreen('list');
                    onRefresh();
                }}
            ]);
            setReason(''); setAttachment(null);
        } catch (err: any) {
            Alert.alert(t('common.error'), err.response?.data?.message || t('leave.submitFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDateSelect = (d: number, m: number, y: number) => {
        const formattedDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (pickingFor === 'from') setFromDate(formattedDate);
        else if (pickingFor === 'to') setToDate(formattedDate);
        else setSingleDate(formattedDate);
        setShowCalendar(false);
    };

    const formatDateDisplay = (isoStr: string) => {
        if (!isoStr) return '';
        const parts = isoStr.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return isoStr;
    };

    const statusMap: Record<string, { label: string; color: string; bg: string; icon: string }> = {
        approved: { label: 'Đã duyệt', color: '#27ae60', bg: isDark ? '#064e3b' : '#f0fdf4', icon: 'checkmark-circle' },
        rejected:  { label: 'Từ chối',  color: '#e74c3c', bg: isDark ? '#450a0a' : '#fef2f2', icon: 'close-circle' },
        pending:   { label: 'Chờ duyệt', color: '#f39c12', bg: isDark ? '#451a03' : '#fff7ed', icon: 'time' },
    };

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        return (
            <Modal transparent visible={showCalendar} animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCalendar(false)}>
                    <View style={[styles.calendarContainer, { backgroundColor: theme.surface }]}>
                        <View style={styles.calendarHeader}>
                            <Text style={[styles.calendarMonthText, { color: theme.text }]}>{monthNames[month]} {year}</Text>
                            <View style={styles.calendarNav}>
                                <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}><Ionicons name="chevron-up" size={24} color={theme.text} /></TouchableOpacity>
                                <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month + 1, 1))}><Ionicons name="chevron-down" size={24} color={theme.text} /></TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.weekdaysRow}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <Text key={i} style={styles.weekdayText}>{d}</Text>)}</View>
                        <View style={styles.daysGrid}>
                            {days.map((d, i) => (
                                <TouchableOpacity key={i} style={[styles.dayCell, { width: (SCREEN_WIDTH * 0.85 - 40) / 7 }]} disabled={!d} onPress={() => d && handleDateSelect(d, month, year)}>
                                    <Text style={[styles.dayText, { color: theme.text }, !d && { color: 'transparent' }]}>{d}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8f9fa' }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => screen === 'form' ? setScreen('list') : navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Xin nghỉ phép</Text>
                {screen === 'list' && (
                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#2b58de' }]} onPress={() => setScreen('form')}>
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                )}
                {screen === 'form' && <View style={{ width: 40 }} />}
            </View>

            {screen === 'form' ? (
                <View style={styles.formOverlay}>
                    <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
                        <View style={[styles.formCard, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.cardFormTitle, { color: theme.text }]}>Tạo đơn xin nghỉ</Text>
                            
                            <View style={[styles.tabContainer, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                                <TouchableOpacity 
                                    style={[styles.tabBtn, leaveType === 'day' && styles.tabBtnActive]} 
                                    onPress={() => setLeaveType('day')}
                                >
                                    <Ionicons name="calendar-outline" size={18} color={leaveType === 'day' ? '#2b58de' : '#64748b'} />
                                    <Text style={[styles.tabBtnText, { color: leaveType === 'day' ? '#2b58de' : '#64748b' }]}>Nghỉ theo ngày</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.tabBtn, leaveType === 'period' && styles.tabBtnActive]} 
                                    onPress={() => setLeaveType('period')}
                                >
                                    <Ionicons name="time-outline" size={18} color={leaveType === 'period' ? '#2b58de' : '#64748b'} />
                                    <Text style={[styles.tabBtnText, { color: leaveType === 'period' ? '#2b58de' : '#64748b' }]}>Nghỉ theo tiết</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.dateSection}>
                                <View style={styles.dateCol}>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Từ ngày</Text>
                                    <TouchableOpacity 
                                        style={[styles.datePickerBtn, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: theme.border }]}
                                        onPress={() => { setPickingFor('from'); setShowCalendar(true); }}
                                    >
                                        <Text style={[styles.dateValue, { color: fromDate ? theme.text : theme.textSecondary }]}>
                                            {fromDate ? formatDateDisplay(fromDate) : 'dd/mm/yyyy'}
                                        </Text>
                                        <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.dateCol}>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Đến ngày</Text>
                                    <TouchableOpacity 
                                        style={[styles.datePickerBtn, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: theme.border }]}
                                        onPress={() => { setPickingFor('to'); setShowCalendar(true); }}
                                    >
                                        <Text style={[styles.dateValue, { color: toDate ? formatDateDisplay(toDate) : theme.textSecondary }]}>
                                            {toDate ? formatDateDisplay(toDate) : 'dd/mm/yyyy'}
                                        </Text>
                                        <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 20 }]}>Lý do xin nghỉ</Text>
                            <TextInput 
                                style={[styles.reasonInput, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: theme.border, color: theme.text }]}
                                placeholder="Nhập lý do con nghỉ học..."
                                placeholderTextColor={theme.textSecondary}
                                multiline
                                value={reason}
                                onChangeText={setReason}
                                textAlignVertical="top"
                            />

                            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 20 }]}>Minh chứng (nếu có)</Text>
                            <TouchableOpacity 
                                style={[styles.uploadBox, { backgroundColor: isDark ? '#1e293b' : '#fff' }]} 
                                onPress={pickImage}
                            >
                                {attachment ? (
                                    <View style={styles.uploadPreview}>
                                        <Image source={{ uri: attachment.uri }} style={styles.uploadThumb} />
                                        <Text style={{ color: theme.text, flex: 1, marginLeft: 10 }}>{attachment.fileName || 'Image picked'}</Text>
                                        <TouchableOpacity onPress={() => setAttachment(null)}>
                                            <Ionicons name="close-circle" size={24} color="#e74c3c" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload-outline" size={32} color="#94a3b8" />
                                        <Text style={[styles.uploadText, { color: theme.textSecondary }]}>Tải lên ảnh hoặc đơn thuốc</Text>
                                        <Text style={styles.uploadSubText}>PNG, JPG, PDF (Max 5MB)</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <View style={styles.formFooter}>
                                <TouchableOpacity style={[styles.btnAction, styles.btnCancel]} onPress={() => setScreen('list')}>
                                    <Text style={styles.btnCancelText}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.btnAction, styles.btnSubmit, { backgroundColor: '#2b58de' }]} 
                                    onPress={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.btnSubmitText}>Gửi đơn</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>LỊCH SỬ NGHỈ PHÉP</Text>
                    </View>
                    <ScrollView 
                        contentContainerStyle={styles.listContainer}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    >
                        {loading && requests.length === 0 ? (
                            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
                        ) : requests.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="document-text-outline" size={64} color="#e2e8f0" />
                                <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Chưa có lịch sử nghỉ phép</Text>
                            </View>
                        ) : (
                            requests.map(item => {
                            const s = statusMap[item.status] || statusMap.pending;
                            
                            const getValidDate = (d: any) => {
                                const m = moment(d);
                                return m.isValid() ? m : null;
                            };

                            const cDate = getValidDate(item.createdAt) || getValidDate(item.fromDate) || moment();
                            const createdDate = cDate.format('D/M/YYYY');
                            
                            let displayDate = '';
                            if (item.type === 'day') {
                                const from = getValidDate(item.fromDate) || moment();
                                const to = getValidDate(item.toDate) || from;
                                displayDate = from.format('D/M') === to.format('D/M') 
                                    ? from.format('D/M') 
                                    : `${from.format('D/M')} - ${to.format('D/M')}`;
                            } else {
                                displayDate = (getValidDate(item.singleDate) || moment()).format('D/M');
                            }
                                
                            return (
                                    <View key={item.id || item._id} style={[styles.historyCard, { backgroundColor: theme.surface }]}>
                                        <View style={styles.cardTop}>
                                            <Text style={styles.cardMeta}>Ngày tạo: {createdDate}</Text>
                                            <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                                                <Ionicons name={s.icon as any} size={14} color={s.color} style={{ marginRight: 4 }} />
                                                <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                                            </View>
                                        </View>
                                        
                                        <Text style={[styles.cardDateBig, { color: theme.text }]}>{displayDate}</Text>
                                        
                                        <View style={[styles.cardReasonBox, { backgroundColor: isDark ? '#1e293b' : '#f8f9fa' }]}>
                                            <Text style={[styles.cardReasonText, { color: theme.text }]}>"{item.reason}"</Text>
                                            {item.attachmentUrl && (
                                                <TouchableOpacity 
                                                    style={styles.attachmentLink}
                                                    onPress={() => Linking.openURL(item.attachmentUrl)}
                                                >
                                                    <Ionicons name="attach" size={16} color="#2b58de" />
                                                    <Text style={styles.attachmentName} numberOfLines={1}>
                                                        {item.attachmentUrl.split('/').pop()}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            )}
            {renderCalendar()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, height: 64,
        borderBottomWidth: 1, elevation: 2, zIndex: 10
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    addBtn: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#2b58de', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5
    },
    sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 },
    listContainer: { paddingHorizontal: 16, paddingBottom: 40 },
    
    // History Card Redesign
    historyCard: {
        borderRadius: 16, padding: 20, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardMeta: { fontSize: 13, color: '#94a3b8' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '700' },
    cardDateBig: { fontSize: 22, fontWeight: '800', marginBottom: 15 },
    cardReasonBox: { borderRadius: 12, padding: 16 },
    cardReasonText: { fontSize: 15, fontStyle: 'italic', fontWeight: '500', marginBottom: 8 },
    attachmentLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    attachmentName: { fontSize: 13, color: '#2b58de', fontWeight: '600', textDecorationLine: 'underline' },
    
    emptyState: { alignItems: 'center', marginTop: 100 },
    
    // Form Modal-like Design
    formOverlay: { flex: 1, paddingTop: 10 },
    formScroll: { paddingHorizontal: 16, paddingBottom: 40 },
    formCard: { 
        borderRadius: 24, padding: 24, 
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 
    },
    cardFormTitle: { fontSize: 20, fontWeight: '800', marginBottom: 24 },
    tabContainer: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 24 },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 8 },
    tabBtnActive: { backgroundColor: 'white', elevation: 2 },
    tabBtnText: { fontSize: 14, fontWeight: '700' },
    
    dateSection: { flexDirection: 'row', justifyContent: 'space-between' },
    dateCol: { width: '48%' },
    inputLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
    datePickerBtn: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
        borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 48 
    },
    dateValue: { fontSize: 14 },
    
    reasonInput: { 
        borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 15, minHeight: 120,
    },
    
    uploadBox: {
        borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', borderRadius: 16,
        paddingVertical: 30, alignItems: 'center', justifyContent: 'center', marginTop: 4
    },
    uploadText: { fontSize: 14, fontWeight: '700', marginTop: 8 },
    uploadSubText: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
    uploadPreview: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 20 },
    uploadThumb: { width: 50, height: 50, borderRadius: 8 },
    
    formFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32, gap: 12 },
    btnAction: { flex: 1, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    btnCancel: { backgroundColor: '#f1f5f9' },
    btnCancelText: { color: '#64748b', fontSize: 16, fontWeight: '700' },
    btnSubmit: { elevation: 3 },
    btnSubmitText: { color: 'white', fontSize: 16, fontWeight: '800' },

    // Calendar
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    calendarContainer: { width: '85%', borderRadius: 24, padding: 20 },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    calendarMonthText: { fontSize: 18, fontWeight: '800' },
    calendarNav: { flexDirection: 'row', gap: 12 },
    weekdaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    weekdayText: { width: (SCREEN_WIDTH * 0.85 - 40) / 7, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#94a3b8' },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    dayCell: { height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, marginBottom: 4 },
    dayText: { fontSize: 14, fontWeight: '600' },
});
