import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, TextInput, Alert, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { notesApi } from '../services/api';
import { getCurrentStudentId } from '../services/userHelper';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Screen = 'list' | 'form';
type NoteType = 'allergy' | 'health' | 'diet' | 'other';

interface Note {
    id: string;
    type: NoteType;
    title: string;
    content: string;
    isImportant: boolean;
    updatedAt: string;
}

export default function StudentNotesScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();
    const [screen, setScreen] = useState<Screen>('list');
    const [notes, setNotes] = useState<Note[]>([]);
    const [schoolNotice, setSchoolNotice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [formType, setFormType] = useState<NoteType>('allergy');
    const [formContent, setFormContent] = useState('');
    const [formIsImportant, setFormIsImportant] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const mapNoteData = (n: any) => {
        const formatDate = (dateStr: any) => {
            if (!dateStr) return 'Mới cập nhật';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return 'Vừa xong';
            return d.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        };

        return {
            id: n.id || Math.random().toString(),
            type: (n.type || 'other').toLowerCase() as NoteType,
            title: n.title || (n.type === 'allergy' ? 'DỊ ỨNG' : 'LƯU Ý'),
            content: n.content || n.reason || 'Không có nội dung',
            isImportant: !!n.isImportant,
            updatedAt: formatDate(n.updatedAt || n.createdAt)
        };
    };

    const loadInitialData = async () => {
        const cacheKey = 'student_notes_cache';
        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                setNotes(data.notes || []);
                setSchoolNotice(data.notice || null);
                setLoading(false);
            }

            const studentId = await getCurrentStudentId();
            if (!studentId) {
                setLoading(false);
                return;
            }

            const [notesRes, noticeRes] = await Promise.all([
                notesApi.getAll(studentId),
                notesApi.getSchoolNotice()
            ]);
            
            let rawNotes = notesRes?.data || notesRes;
            while (rawNotes && !Array.isArray(rawNotes) && rawNotes.data) {
                rawNotes = rawNotes.data;
            }
            const mappedNotes = Array.isArray(rawNotes) ? rawNotes.map(mapNoteData) : [];

            let rawNotice = noticeRes?.data || noticeRes;
            while (rawNotice && rawNotice.data && typeof rawNotice.data === 'object' && !Array.isArray(rawNotice.data)) {
                rawNotice = rawNotice.data;
            }
            const finalNotice = (rawNotice && (rawNotice.title || rawNotice.content)) ? rawNotice : null;

            setNotes(mappedNotes);
            setSchoolNotice(finalNotice);
            AsyncStorage.setItem(cacheKey, JSON.stringify({ notes: mappedNotes, notice: finalNotice }));
        } catch (err) {
            console.error('StudentNotes error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const handleDelete = (id: string) => {
        Alert.alert('Xóa lưu ý', 'Bạn có chắc chắn muốn xóa lưu ý này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await notesApi.delete(id);
                        const newNotes = notes.filter(n => n.id !== id);
                        setNotes(newNotes);
                        AsyncStorage.setItem('student_notes_cache', JSON.stringify({ notes: newNotes, notice: schoolNotice }));
                    } catch (err) {
                        Alert.alert('Lỗi', 'Không thể xóa lưu ý này.');
                    }
                }
            }
        ]);
    };

    const handleSubmit = async () => {
        if (!formContent.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập nội dung lưu ý.');
            return;
        }

        try {
            setSubmitting(true);
            const studentId = await getCurrentStudentId();
            if (!studentId) return;

            const typeMap: any = {
                allergy: 'DỊ ỨNG',
                health: 'SỨC KHỎE',
                diet: 'CHẾ ĐỘ ĂN',
                other: 'LƯU Ý KHÁC'
            };

            const res = await notesApi.submit({
                studentId,
                type: formType,
                title: typeMap[formType] || 'LƯU Ý',
                content: formContent,
                isImportant: formIsImportant
            });

            // Recursive unwrapper
            let newNoteRaw = res?.data || res;
            while (newNoteRaw && newNoteRaw.data && typeof newNoteRaw.data === 'object' && !Array.isArray(newNoteRaw.data)) {
                newNoteRaw = newNoteRaw.data;
            }
            
            if (newNoteRaw) {
                const mappedNewNote = mapNoteData(newNoteRaw);
                setNotes(prev => {
                    if (prev.find(n => n.id === mappedNewNote.id)) return prev;
                    return [mappedNewNote, ...prev];
                });
                setScreen('list');
                setFormContent('');
                setFormIsImportant(false);
            }
        } catch (error) {
            console.error('Submit note error:', error);
            Alert.alert('Lỗi', 'Không thể lưu ghi chú. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderCategoryIcon = (type: string, size: number = 24, color: string = '#7f8c8d') => {
        const lowerType = (type || 'other').toLowerCase();
        switch (lowerType) {
            case 'allergy': return <MaterialCommunityIcons name="alert-outline" size={size} color={color} />;
            case 'health': return <MaterialCommunityIcons name="heart-pulse" size={size} color={color} />;
            case 'diet': return <MaterialCommunityIcons name="silverware-fork-knife" size={size} color={color} />;
            default: return <MaterialCommunityIcons name="file-document-outline" size={size} color={color} />;
        }
    };


    if (screen === 'form') {
        const types: { key: NoteType; label: string }[] = [
            { key: 'allergy', label: 'Dị ứng' },
            { key: 'health', label: 'Sức khỏe' },
            { key: 'diet', label: 'Chế độ ăn' },
            { key: 'other', label: 'Khác' },
        ];

        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => setScreen('list')}>
                        <Ionicons name="chevron-back" size={28} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Lưu ý về học sinh</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: isDark ? '#000' : '#000' }]}>
                        <Text style={[styles.formTitle, { color: theme.text }]}>Thêm lưu ý mới</Text>

                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Loại lưu ý</Text>
                        <View style={styles.typeGrid}>
                            {types.map((t) => (
                                <TouchableOpacity
                                    key={t.key}
                                    style={[styles.typeItem, { backgroundColor: theme.surface, borderColor: theme.border }, formType === t.key && [styles.typeItemActive, { backgroundColor: isDark ? '#1E293B' : '#f0f4f8', borderColor: theme.text }]]}
                                    onPress={() => setFormType(t.key)}
                                >
                                    <View style={styles.typeIconBox}>
                                        {renderCategoryIcon(t.key, 20, formType === t.key ? theme.text : theme.textSecondary)}
                                    </View>
                                    <Text style={[styles.typeItemText, { color: theme.textSecondary }, formType === t.key && [styles.typeItemTextActive, { color: theme.text }]]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.fieldLabel, { marginTop: 20, color: theme.textSecondary }]}>Nội dung chi tiết</Text>
                        <TextInput
                            style={[styles.reasonInput, { backgroundColor: isDark ? '#1E293B' : '#f8fafc', borderColor: theme.border, color: theme.text }]}
                            placeholder="Ví dụ: Cháu bị dị ứng với tôm..."
                            placeholderTextColor={theme.textSecondary}
                            value={formContent}
                            onChangeText={setFormContent}
                            multiline
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={[styles.importantYellowBox, { backgroundColor: isDark ? '#1E293B' : '#fffbeb', borderColor: isDark ? '#2D3748' : '#fef3c7' }]}
                            onPress={() => setFormIsImportant(!formIsImportant)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, { backgroundColor: theme.surface, borderColor: theme.border }, formIsImportant && [styles.checkboxActive, { backgroundColor: theme.primary, borderColor: theme.primary }]]}>
                                {formIsImportant && <Ionicons name="checkmark" size={14} color="white" />}
                            </View>
                            <Text style={[styles.importantYellowText, { color: theme.text }]}>Đánh dấu quan trọng (Ghim đầu trang)</Text>
                        </TouchableOpacity>

                        <View style={styles.formFooter}>
                            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: isDark ? '#2D3748' : '#f1f5f9' }]} onPress={() => setScreen('list')}>
                                <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={handleSubmit} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.submitBtnText}>Lưu lại</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Lưu ý về học sinh</Text>
                <TouchableOpacity style={[styles.addCircleBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={() => setScreen('form')}>
                    <Ionicons name="add" size={28} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {schoolNotice && (
                    <View style={[styles.schoolNoticeCard, { backgroundColor: isDark ? '#1e3a8a' : '#ebf4ff', borderColor: isDark ? '#1e40af' : '#bbdefb', marginBottom: 16 }]}>
                        <View style={styles.cardHeaderNew}>
                            <View style={[styles.iconBoxNew, { backgroundColor: isDark ? '#2D3748' : 'white' }]}>
                                <MaterialCommunityIcons name="heart-pulse" size={22} color={isDark ? '#60A5FA' : '#3498db'} />
                            </View>
                            <Text style={[styles.noteTypeTitleNew, { color: isDark ? '#93c5fd' : '#1a237e' }]}>{schoolNotice.title || 'Lưu ý từ nhà trường'}</Text>
                        </View>
                        <Text style={[styles.schoolNoticeContent, { color: isDark ? '#bfdbfe' : '#1a237e' }]}>
                            {schoolNotice.content}
                        </Text>
                    </View>
                )}

                {notes.length === 0 && !loading && (
                    <View style={[styles.emptyContainer, { marginTop: schoolNotice ? 40 : 100 }]}>
                        <MaterialIcons name="note-add" size={80} color={isDark ? '#2D3748' : '#ecf0f1'} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Chưa có lưu ý sức khỏe nào cho học sinh này.</Text>
                    </View>
                )}

                {notes.map((item) => {
                    const themeColor = item.isImportant || item.type === 'allergy' ? '#ff4757' : '#3498db';
                    return (
                        <View key={item.id} style={[
                            styles.noteCardBordered, 
                            { borderColor: item.isImportant ? '#ff4757' : theme.border, backgroundColor: item.isImportant ? (isDark ? '#450a0a' : '#fff5f5') : theme.surface }
                        ]}>
                            {item.isImportant && (
                                <View style={[styles.importantBadgeNew, { backgroundColor: '#ff4757' }]}>
                                    <Text style={styles.importantBadgeTextNew}>QUAN TRỌNG</Text>
                                </View>
                            )}

                            <View style={styles.cardHeaderNew}>
                                <View style={[styles.iconBoxNew, { backgroundColor: isDark ? '#2D3748' : 'white', shadowColor: isDark ? '#000' : '#000' }]}>
                                    {renderCategoryIcon(item.type, 22, themeColor)}
                                </View>
                                <Text style={[styles.noteTypeTitleNew, { color: theme.text }]}>
                                    {item.title?.toUpperCase()}
                                </Text>
                                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 4 }}>
                                    <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.innerContentBox, { backgroundColor: isDark ? '#1E293B' : 'white', borderColor: theme.border }]}>
                                <Text style={[styles.noteContentNew, { color: theme.textSecondary }]}>{item.content}</Text>
                            </View>

                            <View style={styles.cardFooterNew}>
                                <Text style={[styles.updatedAtNew, { color: theme.textSecondary }]}>Cập nhật: {item.updatedAt}</Text>
                            </View>
                        </View>
                    );
                })}
                <View style={{ height: 40 }} />
            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
    addCircleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ff4757', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#ff4757', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
    
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 12, color: '#95a5a6', textAlign: 'center', fontSize: 16 },

    /* LIST STYLES NEW */
    noteCardBordered: { 
        borderRadius: 20, 
        padding: 16, 
        marginBottom: 16, 
        borderWidth: 1,
        position: 'relative',
        overflow: 'visible',
    },
    importantBadgeNew: { 
        position: 'absolute', 
        top: -1, 
        right: -1, 
        backgroundColor: '#ff4757', 
        paddingHorizontal: 10, 
        paddingVertical: 6, 
        borderTopRightRadius: 19,
        borderBottomLeftRadius: 12,
        zIndex: 1
    },
    importantBadgeTextNew: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    
    cardHeaderNew: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconBoxNew: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    noteTypeTitleNew: { flex: 1, fontSize: 15, fontWeight: '700', color: '#2c3e50', letterSpacing: 0.5 },
    
    innerContentBox: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#f0f0f0' },
    noteContentNew: { fontSize: 14, color: '#455a64', lineHeight: 22 },
    
    cardFooterNew: { alignItems: 'flex-end' },
    updatedAtNew: { fontSize: 12, color: '#90a4ae' },

    schoolNoticeCard: {
        backgroundColor: '#ebf4ff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#bbdefb'
    },
    schoolNoticeContent: {
        fontSize: 14,
        color: '#1a237e',
        lineHeight: 20,
        fontWeight: '500'
    },

    /* FORM STYLES NEW */
    formCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    formTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 24 },
    fieldLabel: { fontSize: 14, fontWeight: '700', color: '#37474f', marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    typeItem: { 
        width: (SCREEN_WIDTH - 88) / 2, 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 12, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#edf2f7', 
        backgroundColor: '#fff' 
    },
    typeItemActive: { backgroundColor: '#f0f4f8', borderColor: '#2c3e50', borderWidth: 1.5 },
    typeIconBox: { marginRight: 10 },
    typeItemText: { fontSize: 14, color: '#546e7a', fontWeight: '500' },
    typeItemTextActive: { color: '#1a1a1a', fontWeight: '700' },
    
    reasonInput: { 
        backgroundColor: '#f8fafc', 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: '#e2e8f0', 
        padding: 16, 
        height: 140, 
        fontSize: 15, 
        color: '#2c3e50',
        lineHeight: 22
    },
    
    importantYellowBox: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginTop: 24, 
        backgroundColor: '#fffbeb', 
        padding: 16, 
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#fef3c7'
    },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#d1d5db', marginRight: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
    checkboxActive: { backgroundColor: '#ff4757', borderColor: '#ff4757' },
    importantYellowText: { fontSize: 14, color: '#1a1a1a', fontWeight: 'bold' },
    
    formFooter: { flexDirection: 'row', gap: 16, marginTop: 32 },
    cancelBtn: { flex: 1, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
    cancelBtnText: { fontSize: 16, fontWeight: '700', color: '#64748b' },
    submitBtn: { flex: 1, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ff4757' },
    submitBtnText: { fontSize: 16, fontWeight: '800', color: 'white' },
});
