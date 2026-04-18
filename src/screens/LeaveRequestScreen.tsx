import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, TextInput, Alert, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { leaveApi } from '../services/api';
import { getCurrentUser } from '../services/userHelper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Conservative calculation to ensure 5 chips fit comfortably
const CHIP_CONTAINER_PADDING = 16 + 16 + 10; // ScrollView padding + formCard padding + periodCard padding
const CHIP_GAP = 5;
const CHIP_WIDTH = (SCREEN_WIDTH - (CHIP_CONTAINER_PADDING * 2) - (CHIP_GAP * 4) - 10) / 5;

type Screen = 'list' | 'form';
const MORNING_PERIODS = [1, 2, 3, 4, 5];
const AFTERNOON_PERIODS = [6, 7, 8, 9, 10];

export default function LeaveRequestScreen({ navigation }: any) {
    const [screen, setScreen] = useState<Screen>('list');
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [leaveType, setLeaveType] = useState<'day' | 'period'>('day');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [singleDate, setSingleDate] = useState('');
    const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const user = await getCurrentUser();
                if (!user) return;
                const params = user.role === 'parent'
                    ? { parentId: user.id }
                    : { studentId: user.id };
                const res = await leaveApi.getAll(params);
                setRequests(res.data.data || []);
            } catch (err) {
                console.error('LeaveRequest fetch error:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const togglePeriod = (p: number) =>
        setSelectedPeriods(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

    const handleSubmit = async () => {
        const dateVal = leaveType === 'day' ? fromDate : singleDate;
        if (!dateVal.trim() || !reason.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập ngày và lý do.');
            return;
        }
        if (leaveType === 'period' && selectedPeriods.length === 0) {
            Alert.alert('Chưa chọn tiết', 'Vui lòng chọn ít nhất 1 tiết nghỉ.');
            return;
        }
        setSubmitting(true);
        try {
            const user = await getCurrentUser();
            if (!user || !user.studentId) {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin học sinh.');
                return;
            }
            const payload: any = {
                studentId: user.studentId,
                classId: user.classId || '',
                type: leaveType,
                reason,
            };
            if (leaveType === 'day') {
                payload.fromDate = fromDate;
                payload.toDate = toDate || fromDate;
            } else {
                payload.singleDate = singleDate;
                payload.periods = selectedPeriods;
            }
            const res = await leaveApi.submit(payload);
            setRequests(prev => [res.data.data, ...prev]);
            setFromDate(''); setToDate(''); setSingleDate('');
            setReason(''); setSelectedPeriods([]);
            setScreen('list');
            Alert.alert('Thành công', 'Đã gửi đơn xin nghỉ thành công!');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Không thể gửi đơn, vui lòng thử lại.';
            Alert.alert('Lỗi', msg);
        } finally {
            setSubmitting(false);
        }
    };

    const statusMap: Record<string, { label: string; color: string; bg: string }> = {
        approved: { label: 'Đã duyệt', color: '#27ae60', bg: '#e8f5e9' },
        rejected:  { label: 'Từ chối',  color: '#e74c3c', bg: '#ffebee' },
        pending:   { label: 'Chờ duyệt', color: '#f39c12', bg: '#fff3e0' },
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b5998" /></View>;

    /* ─── FORM ─── */
    if (screen === 'form') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setScreen('list')}>
                        <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Xin nghỉ phép</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Tạo đơn xin nghỉ</Text>

                        {/* Toggle — outline border style */}
                        <View style={styles.typeToggle}>
                            {(['day', 'period'] as const).map(t => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.typeBtn, leaveType === t && styles.typeBtnActive]}
                                    onPress={() => setLeaveType(t)}
                                >
                                    <Ionicons
                                        name={t === 'day' ? 'calendar-outline' : 'time-outline'}
                                        size={15}
                                        color={leaveType === t ? '#3b5998' : '#7f8c8d'}
                                    />
                                    <Text style={[styles.typeBtnText, leaveType === t && styles.typeBtnTextActive]}>
                                        {t === 'day' ? 'Nghỉ theo ngày' : 'Nghỉ theo tiết'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* ─── Day mode ─── */}
                        {leaveType === 'day' && (
                            <View style={styles.dateRow}>
                                <View style={styles.dateField}>
                                    <Text style={styles.fieldLabel}>Từ ngày</Text>
                                    <View style={styles.dateInput}>
                                        <TextInput style={styles.dateInputText} placeholder="dd/mm/yyyy" placeholderTextColor="#bdc3c7" value={fromDate} onChangeText={setFromDate} />
                                        <Ionicons name="calendar-outline" size={16} color="#7f8c8d" />
                                    </View>
                                </View>
                                <View style={styles.dateField}>
                                    <Text style={styles.fieldLabel}>Đến ngày</Text>
                                    <View style={styles.dateInput}>
                                        <TextInput style={styles.dateInputText} placeholder="dd/mm/yyyy" placeholderTextColor="#bdc3c7" value={toDate} onChangeText={setToDate} />
                                        <Ionicons name="calendar-outline" size={16} color="#7f8c8d" />
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* ─── Period mode ─── */}
                        {leaveType === 'period' && (
                            <>
                                <Text style={styles.fieldLabel}>Chọn ngày nghỉ</Text>
                                <View style={[styles.dateInput, { marginBottom: 16 }]}>
                                    <TextInput
                                        style={[styles.dateInputText, { flex: 1 }]}
                                        placeholder="dd/mm/yyyy"
                                        placeholderTextColor="#bdc3c7"
                                        value={singleDate}
                                        onChangeText={setSingleDate}
                                    />
                                    <Ionicons name="calendar-outline" size={16} color="#7f8c8d" />
                                </View>

                                <View style={styles.periodCard}>
                                    <View style={styles.periodCardHeader}>
                                        <Ionicons name="time-outline" size={16} color="#3b5998" />
                                        <Text style={styles.periodCardTitle}>Chọn các tiết nghỉ trong ngày</Text>
                                    </View>

                                    <Text style={styles.sessionLabel}>BUỔI SÁNG</Text>
                                    <View style={styles.periodsRow}>
                                        {MORNING_PERIODS.map(p => (
                                            <TouchableOpacity
                                                key={p}
                                                style={[styles.periodChip, selectedPeriods.includes(p) && styles.periodChipActive]}
                                                onPress={() => togglePeriod(p)}
                                            >
                                                <Text style={[styles.periodChipText, selectedPeriods.includes(p) && styles.periodChipTextActive]}>
                                                    Tiết {p}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={[styles.sessionLabel, { marginTop: 14 }]}>BUỔI CHIỀU</Text>
                                    <View style={styles.periodsRow}>
                                        {AFTERNOON_PERIODS.map(p => (
                                            <TouchableOpacity
                                                key={p}
                                                style={[styles.periodChip, selectedPeriods.includes(p) && styles.periodChipActive]}
                                                onPress={() => togglePeriod(p)}
                                            >
                                                <Text style={[styles.periodChipText, selectedPeriods.includes(p) && styles.periodChipTextActive]}>
                                                    Tiết {p}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </>
                        )}

                        {/* Reason */}
                        <Text style={styles.fieldLabel}>Lý do xin nghỉ</Text>
                        <TextInput
                            style={styles.reasonInput}
                            placeholder="Nhập lý do con nghỉ học..."
                            placeholderTextColor="#bdc3c7"
                            value={reason} onChangeText={setReason}
                            multiline textAlignVertical="top"
                        />

                        {/* Attachment */}
                        <Text style={styles.fieldLabel}>Minh chứng (nếu có)</Text>
                        <TouchableOpacity style={styles.uploadBox}>
                            <Ionicons name="cloud-upload-outline" size={28} color="#7f8c8d" />
                            <Text style={styles.uploadTitle}>Tải lên ảnh hoặc đơn thuốc</Text>
                            <Text style={styles.uploadHint}>PNG, JPG, PDF (Max 5MB)</Text>
                        </TouchableOpacity>

                        <View style={styles.formFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setScreen('list')}>
                                <Text style={styles.cancelBtnText}>Huỷ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.submitBtnText}>Gửi đơn</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    /* ─── LIST ─── */
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Xin nghỉ phép</Text>
                <TouchableOpacity style={styles.addCircleBtn} onPress={() => setScreen('form')}>
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>LỊCH SỬ NGHỈ PHÉP</Text>
                {requests.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Ionicons name="document-outline" size={60} color="#ddd" />
                        <Text style={styles.emptyText}>Chưa có đơn xin nghỉ nào</Text>
                    </View>
                ) : requests.map((item) => {
                    const cfg = statusMap[item.status] ?? statusMap.pending;
                    return (
                        <View key={item.id} style={styles.requestCard}>
                            <View style={styles.cardTopRow}>
                                <Text style={styles.cardCreatedAt}>Ngày tạo: {item.createdAt}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                                    <Ionicons name="checkmark-circle-outline" size={13} color={cfg.color} />
                                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                                </View>
                            </View>
                            <Text style={styles.cardDisplayDate}>{item.displayDate}</Text>
                            <View style={styles.cardBody}>
                                <Text style={styles.cardReason}>"{item.reason}"</Text>
                                {item.attachment && (
                                    <View style={styles.attachmentRow}>
                                        <Ionicons name="attach" size={14} color="#2980b9" />
                                        <Text style={styles.attachmentText}>{item.attachment}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    addCircleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2980b9', justifyContent: 'center', alignItems: 'center' },
    sectionLabel: { fontSize: 12, fontWeight: '700', color: '#95a5a6', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
    requestCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardCreatedAt: { fontSize: 12, color: '#95a5a6' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    cardDisplayDate: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 },
    cardBody: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12, gap: 6 },
    cardReason: { fontSize: 14, color: '#34495e', fontStyle: 'italic' },
    attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    attachmentText: { fontSize: 13, color: '#2980b9', fontWeight: '500' },
    emptyBox: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#bdc3c7', fontSize: 14, marginTop: 12 },

    formCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    formTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 18 },
    typeToggle: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 10, gap: 6, backgroundColor: '#f1f2f6', borderWidth: 1.5, borderColor: 'transparent' },
    typeBtnActive: { backgroundColor: 'white', borderColor: '#3b5998' },
    typeBtnText: { fontSize: 13, color: '#7f8c8d', fontWeight: '500' },
    typeBtnTextActive: { color: '#3b5998', fontWeight: 'bold' },
    dateRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    dateField: { flex: 1 },
    fieldLabel: { fontSize: 13, color: '#7f8c8d', fontWeight: '600', marginBottom: 8 },
    dateInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#eee' },
    dateInputText: { flex: 1, fontSize: 14, color: '#2c3e50' },

    periodCard: { backgroundColor: '#f7f8ff', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: '#e8eaf6', marginBottom: 16 },
    periodCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    periodCardTitle: { fontSize: 13, fontWeight: '700', color: '#3b5998' },
    sessionLabel: { fontSize: 11, fontWeight: '700', color: '#95a5a6', letterSpacing: 0.8, marginBottom: 10 },
    periodsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: CHIP_GAP },
    periodChip: { 
        borderWidth: 1, 
        borderColor: '#dde1e7', 
        borderRadius: 8, 
        width: CHIP_WIDTH,
        height: 36,
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'white' 
    },
    periodChipActive: { backgroundColor: '#3b5998', borderColor: '#3b5998' },
    periodChipText: { fontSize: 11, color: '#34495e', fontWeight: '500' },
    periodChipTextActive: { color: 'white', fontWeight: 'bold' },

    reasonInput: { backgroundColor: '#f8f9fa', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#2c3e50', height: 110, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
    uploadBox: { borderWidth: 1.5, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 14, paddingVertical: 24, alignItems: 'center', gap: 6, marginBottom: 20, backgroundColor: '#fafafa' },
    uploadTitle: { fontSize: 14, fontWeight: '600', color: '#34495e' },
    uploadHint: { fontSize: 12, color: '#95a5a6' },
    formFooter: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, backgroundColor: '#f1f2f6', alignItems: 'center' },
    cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#7f8c8d' },
    submitBtn: { flex: 2, paddingVertical: 15, borderRadius: 14, backgroundColor: '#2980b9', alignItems: 'center' },
    submitBtnText: { fontSize: 15, fontWeight: 'bold', color: 'white' },
});
