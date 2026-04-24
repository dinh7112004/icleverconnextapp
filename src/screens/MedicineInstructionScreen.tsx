import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, TextInput, Alert, Dimensions,
    Modal, Platform, Image, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { medicineApi, uploadApi } from '../services/api';
import { getCurrentStudentId } from '../services/userHelper';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ScreenMode = 'list' | 'form';

export default function MedicineInstructionScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();
    const [mode, setMode] = useState<ScreenMode>('list');
    const [instructions, setInstructions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [time, setTime] = useState('');
    const [note, setNote] = useState('');
    const [attachment, setAttachment] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Time picker state
    const [selHour, setSelHour] = useState('08');
    const [selMinute, setSelMinute] = useState('00');
    const [selPeriod, setSelPeriod] = useState('AM');

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    const periods = ['AM', 'PM'];

    const loadInitialData = async () => {
        const cacheKey = 'medicine_instruction_cache';
        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                setInstructions(JSON.parse(cached));
                setLoading(false);
            }

            const studentId = await getCurrentStudentId();
            if (!studentId) {
                setLoading(false);
                return;
            }

            const response = await medicineApi.getAll(studentId);
            let items = [];
            if (response.data && response.data.success) {
                const innerData = response.data.data;
                items = Array.isArray(innerData?.data) ? innerData.data : (Array.isArray(innerData) ? innerData : []);
            }
            setInstructions(items);
            AsyncStorage.setItem(cacheKey, JSON.stringify(items));
        } catch (error) {
            console.error('Error fetching instructions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setAttachment(result.assets[0]);
        }
    };

    const handleSubmit = async () => {
        if (!name || !dosage || !time) {
            Alert.alert('Thiếu thông tin', 'Vui lòng điền tên thuốc, liều lượng và thời gian.');
            return;
        }

        setSubmitting(true);
        try {
            const studentId = await getCurrentStudentId();
            if (!studentId) return;

            let imageUrl = '';
            if (attachment) {
                try {
                    const formData = new FormData();
                    formData.append('file', {
                        uri: Platform.OS === 'ios' ? attachment.uri.replace('file://', '') : attachment.uri,
                        type: 'image/jpeg',
                        name: attachment.fileName || `medicine_${Date.now()}.jpg`,
                    } as any);

                    const uploadRes = await uploadApi.post(formData, 'medicines');
                    if (uploadRes.data.success) {
                        imageUrl = uploadRes.data.url;
                    }
                } catch (err) {
                    console.error('Image upload failed:', err);
                    Alert.alert('Lỗi', 'Không thể tải ảnh lên, vui lòng thử lại.');
                    setSubmitting(false);
                    return;
                }
            }

            const payload = {
                studentId,
                name,
                dosage,
                time,
                note,
                imageUrl,
                date: new Date().toISOString().split('T')[0],
            };

            await medicineApi.submit(payload);
            Alert.alert('Thành công', 'Đã gửi phiếu dặn thuốc thành công!', [
                { text: 'OK', onPress: () => {
                    setMode('list');
                    loadInitialData();
                }}
            ]);
            // Reset
            setName(''); setDosage(''); setTime(''); setNote(''); setAttachment(null);
        } catch (error) {
            console.error('Error submitting medicine:', error);
            Alert.alert('Lỗi', 'Không thể gửi phiếu dặn thuốc.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStatusBadge = (status: string) => {
        const isDone = status === 'Đã uống';
        return (
            <View style={[styles.statusBadge, { backgroundColor: isDone ? (isDark ? '#064e3b' : '#e8f5e9') : (isDark ? '#451a03' : '#fff3e0') }]}>
                <Ionicons name={isDone ? "checkmark-circle" : "time"} size={14} color={isDone ? "#2e7d32" : "#f39c12"} />
                <Text style={[styles.statusText, { color: isDone ? "#2e7d32" : "#f39c12" }]}>
                    {status || 'Chờ uống'}
                </Text>
            </View>
        );
    };


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => mode === 'form' ? setMode('list') : navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Dặn thuốc cho con</Text>
                {mode === 'list' ? (
                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={() => setMode('form')}>
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                ) : <View style={{ width: 40 }} />}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {mode === 'list' ? (
                    <>
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DANH SÁCH DẶN THUỐC</Text>
                        {instructions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="pill-off" size={64} color={isDark ? '#2D3748' : '#e2e8f0'} />
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Chưa có lịch sử dặn thuốc</Text>
                            </View>
                        ) : (
                            instructions.map((item, idx) => (
                                <View key={item.id || idx} style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: isDark ? '#000' : '#000' }]}>
                                    <View style={styles.cardHeader}>
                                        <Text style={[styles.cardDate, { color: theme.textSecondary }]}>{item.date}</Text>
                                        {renderStatusBadge(item.status)}
                                    </View>
                                    <View style={styles.cardMain}>
                                        <View style={[styles.medIconBox, { backgroundColor: isDark ? '#065f46' : '#e0f2f1' }]}>
                                            <MaterialCommunityIcons name="pill" size={24} color={isDark ? '#34d399' : '#009688'} />
                                        </View>
                                        <View style={styles.medDetails}>
                                            <Text style={[styles.medName, { color: theme.text }]}>{item.name}</Text>
                                            <View style={styles.medInfoRow}>
                                                <Text style={[styles.medInfoLabel, { color: theme.textSecondary }]}>Liều: <Text style={[styles.medInfoValue, { color: theme.text }]}>{item.dosage}</Text></Text>
                                                <View style={[styles.verticalDivider, { backgroundColor: theme.border }]} />
                                                <Text style={[styles.medInfoLabel, { color: theme.textSecondary }]}>Giờ: <Text style={[styles.medInfoValue, { color: theme.text }]}>{item.time}</Text></Text>
                                            </View>
                                        </View>
                                    </View>
                                    {item.note ? (
                                        <View style={[styles.noteBox, { backgroundColor: isDark ? '#1E293B' : '#f8fafc' }]}>
                                            <Text style={[styles.noteText, { color: theme.textSecondary }]}>"{item.note}"</Text>
                                        </View>
                                    ) : null}
                                    {item.imageUrl ? (
                                        <TouchableOpacity 
                                            style={styles.attachmentLink}
                                            onPress={() => Linking.openURL(item.imageUrl)}
                                        >
                                            <Ionicons name="image-outline" size={16} color={theme.primary} />
                                            <Text style={[styles.attachmentText, { color: theme.primary }]}>Xem ảnh thuốc</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            ))
                        )}
                    </>
                ) : (
                    <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: isDark ? '#000' : '#000' }]}>
                        <Text style={[styles.formHeaderTitle, { color: theme.text }]}>Tạo phiếu dặn thuốc</Text>
                        
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Tên thuốc <Text style={{ color: 'red' }}>*</Text></Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#f8fafc', borderColor: theme.border, color: theme.text }]}
                                placeholder="Ví dụ: Siro Prospan, Efferalgan..."
                                placeholderTextColor={theme.textSecondary}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputWrapper, { flex: 1, marginRight: 12 }]}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Liều lượng <Text style={{ color: 'red' }}>*</Text></Text>
                                <TextInput 
                                    style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#f8fafc', borderColor: theme.border, color: theme.text }]}
                                    placeholder="Ví dụ: 5ml, 1 gói..."
                                    placeholderTextColor={theme.textSecondary}
                                    value={dosage}
                                    onChangeText={setDosage}
                                />
                            </View>
                            <View style={[styles.inputWrapper, { flex: 1 }]}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Giờ uống <Text style={{ color: 'red' }}>*</Text></Text>
                                <TouchableOpacity 
                                    style={[styles.timeInputBox, { backgroundColor: isDark ? '#1E293B' : '#f8fafc', borderColor: theme.border }]}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Text style={[styles.timeTextValue, { color: theme.text }, !time && { color: theme.textSecondary }]}>
                                        {time || '08:00 AM'}
                                    </Text>
                                    <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Ghi chú thêm cho giáo viên</Text>
                            <TextInput 
                                style={[styles.input, styles.textArea, { backgroundColor: isDark ? '#1E293B' : '#f8fafc', borderColor: theme.border, color: theme.text }]}
                                placeholder="Uống sau ăn 30 phút, nhờ cô theo dõi con..."
                                placeholderTextColor={theme.textSecondary}
                                multiline
                                numberOfLines={4}
                                value={note}
                                onChangeText={setNote}
                                textAlignVertical="top"
                            />
                        </View>

                        <Text style={[styles.label, { color: theme.textSecondary }]}>Ảnh thuốc hoặc đơn thuốc</Text>
                        <TouchableOpacity style={[styles.uploadBox, { backgroundColor: isDark ? '#1E293B' : '#f0f9f8', borderColor: theme.primary }]} onPress={pickImage}>
                            {attachment ? (
                                <View style={styles.attachmentPreview}>
                                    <Image source={{ uri: attachment.uri }} style={styles.attachmentThumb} />
                                    <Text style={[styles.attachmentName, { color: theme.text }]} numberOfLines={1}>{attachment.fileName || 'medicine.jpg'}</Text>
                                    <TouchableOpacity onPress={() => setAttachment(null)}>
                                        <Ionicons name="close-circle" size={22} color="#e74c3c" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <View style={[styles.uploadIconCircle, { backgroundColor: theme.surface }]}>
                                        <Ionicons name="camera" size={32} color={theme.primary} />
                                    </View>
                                    <Text style={[styles.uploadTitle, { color: theme.text }]}>Chụp ảnh hoặc chọn từ thư viện</Text>
                                    <Text style={[styles.uploadSubText, { color: theme.textSecondary }]}>PNG, JPG tối đa 5MB</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={styles.formActions}>
                            <TouchableOpacity style={[styles.btnCancel, { backgroundColor: isDark ? '#2D3748' : '#f1f5f9' }]} onPress={() => setMode('list')}>
                                <Text style={[styles.btnCancelText, { color: theme.textSecondary }]}>Hủy bỏ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.btnSubmit, { backgroundColor: theme.primary }, submitting && { opacity: 0.7 }]} 
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.btnSubmitText}>Gửi dặn thuốc</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* 3-Column Time Picker Modal */}
            <Modal
                visible={showTimePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowTimePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.pickerContainer, { backgroundColor: theme.surface }]}>
                        <View style={[styles.pickerHeader, { borderBottomColor: theme.border }]}>
                            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                <Text style={[styles.pickerCancel, { color: theme.textSecondary }]}>Hủy</Text>
                            </TouchableOpacity>
                            <Text style={[styles.pickerTitle, { color: theme.text }]}>Chọn giờ</Text>
                            <TouchableOpacity onPress={() => {
                                setTime(`${selHour}:${selMinute} ${selPeriod}`);
                                setShowTimePicker(false);
                            }}>
                                <Text style={[styles.pickerDone, { color: theme.primary }]}>Xong</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.pickerBody}>
                            {/* Hours Column */}
                            <ScrollView style={styles.pickerCol} showsVerticalScrollIndicator={false}>
                                {hours.map(h => (
                                    <TouchableOpacity key={h} style={[styles.pickerItem, selHour === h && [styles.pickerItemActive, { backgroundColor: isDark ? '#1E293B' : '#f0fdfa' }]]} onPress={() => setSelHour(h)}>
                                        <Text style={[styles.pickerItemText, { color: theme.textSecondary }, selHour === h && [styles.pickerItemTextActive, { color: theme.primary }]]}>{h}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            
                            {/* Minutes Column */}
                            <ScrollView style={styles.pickerCol} showsVerticalScrollIndicator={false}>
                                {minutes.map(m => (
                                    <TouchableOpacity key={m} style={[styles.pickerItem, selMinute === m && [styles.pickerItemActive, { backgroundColor: isDark ? '#1E293B' : '#f0fdfa' }]]} onPress={() => setSelMinute(m)}>
                                        <Text style={[styles.pickerItemText, { color: theme.textSecondary }, selMinute === m && [styles.pickerItemTextActive, { color: theme.primary }]]}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            
                            {/* AM/PM Column */}
                            <ScrollView style={styles.pickerCol} showsVerticalScrollIndicator={false}>
                                {periods.map(p => (
                                    <TouchableOpacity key={p} style={[styles.pickerItem, selPeriod === p && [styles.pickerItemActive, { backgroundColor: isDark ? '#1E293B' : '#f0fdfa' }]]} onPress={() => setSelPeriod(p)}>
                                        <Text style={[styles.pickerItemText, { color: theme.textSecondary }, selPeriod === p && [styles.pickerItemTextActive, { color: theme.primary }]]}>{p}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, height: 60, backgroundColor: 'white',
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    addBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#009688',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#009688', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
    },
    scrollContent: { padding: 16, paddingBottom: 40 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 16, letterSpacing: 0.5 },

    // History List
    historyCard: {
        backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
        borderWidth: 1, borderColor: '#f1f5f9'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    cardDate: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 },
    statusText: { fontSize: 12, fontWeight: '700' },
    
    cardMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    medIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#e0f2f1', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    medDetails: { flex: 1 },
    medName: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
    medInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    medInfoLabel: { fontSize: 14, color: '#64748b' },
    medInfoValue: { fontWeight: '700', color: '#334155' },
    verticalDivider: { width: 1, height: 12, backgroundColor: '#e2e8f0' },
    
    noteBox: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 12 },
    noteText: { fontSize: 14, color: '#475569', fontStyle: 'italic' },
    attachmentLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
    attachmentText: { fontSize: 14, color: '#009688', fontWeight: '700' },

    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#94a3b8', fontSize: 15, marginTop: 16 },

    // Form
    formCard: {
        backgroundColor: 'white', borderRadius: 20, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5,
        borderWidth: 1, borderColor: '#f1f5f9'
    },
    formHeaderTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 24 },
    inputWrapper: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8 },
    input: { 
        backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, fontSize: 15, color: '#1e293b',
        borderWidth: 1, borderColor: '#e2e8f0'
    },
    row: { flexDirection: 'row' },
    timeInputBox: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, 
        borderWidth: 1, borderColor: '#e2e8f0', paddingRight: 12, paddingLeft: 14, height: 54
    },
    timeTextValue: { flex: 1, fontSize: 15, color: '#1e293b' },
    textArea: { minHeight: 100 },
    
    uploadBox: {
        borderWidth: 1.5, borderColor: '#009688', borderStyle: 'dashed', borderRadius: 16,
        padding: 24, alignItems: 'center', backgroundColor: '#f0f9f8', marginTop: 8, marginBottom: 32
    },
    uploadIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    uploadTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
    uploadSubText: { fontSize: 12, color: '#64748b', marginTop: 4 },
    
    attachmentPreview: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 12 },
    attachmentThumb: { width: 56, height: 56, borderRadius: 10 },
    attachmentName: { flex: 1, fontSize: 15, color: '#1e293b', fontWeight: '600' },

    formActions: { flexDirection: 'row', gap: 12 },
    btnCancel: { flex: 1, height: 54, borderRadius: 14, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    btnCancelText: { fontSize: 16, fontWeight: '700', color: '#64748b' },
    btnSubmit: { flex: 2, height: 54, borderRadius: 14, backgroundColor: '#009688', justifyContent: 'center', alignItems: 'center' },
    btnSubmitText: { fontSize: 16, fontWeight: '800', color: 'white' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    pickerContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: 400 },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    pickerCancel: { fontSize: 16, color: '#64748b', fontWeight: '600' },
    pickerDone: { fontSize: 16, color: '#009688', fontWeight: '700' },
    pickerTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
    pickerBody: { flexDirection: 'row', flex: 1, paddingHorizontal: 10 },
    pickerCol: { flex: 1 },
    pickerItem: { height: 50, justifyContent: 'center', alignItems: 'center' },
    pickerItemActive: { backgroundColor: '#f0fdfa', borderRadius: 10 },
    pickerItemText: { fontSize: 20, color: '#94a3b8' },
    pickerItemTextActive: { color: '#009688', fontWeight: '800' },
});
