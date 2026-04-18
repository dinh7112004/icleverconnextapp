import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, TextInput, Alert, Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { notesApi } from '../services/api';
import { getCurrentStudentId } from '../services/userHelper';

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
    const [screen, setScreen] = useState<Screen>('list');
    const [notes, setNotes] = useState<Note[]>([]);
    const [schoolNotice, setSchoolNotice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [formType, setFormType] = useState<NoteType>('allergy');
    const [formContent, setFormContent] = useState('');
    const [formIsImportant, setFormIsImportant] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const studentId = await getCurrentStudentId();
            if (!studentId) { setLoading(false); return; }
            const [notesRes, noticeRes] = await Promise.all([
                notesApi.getAll(studentId),
                notesApi.getSchoolNotice()
            ]);
            
            const rawNotes = notesRes.data.data || [];
            const mappedNotes = rawNotes.map((n: any) => ({
                ...n,
                id: n.id,
                updatedAt: new Date(n.updatedAt).toLocaleDateString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })
            }));

            setNotes(mappedNotes);
            setSchoolNotice(noticeRes.data?.data || null);
        } catch (err) {
            console.error('StudentNotes error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Xóa lưu ý', 'Bạn có chắc chắn muốn xóa lưu ý này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await notesApi.delete(id);
                        setNotes(prev => prev.filter(n => n.id !== id));
                    } catch (err) {
                        Alert.alert('Lỗi', 'Không thể xóa lưu ý này.');
                    }
                }
            }
        ]);
    };

    const handleSubmit = async () => {
        if (!formContent.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập nội dung chi tiết.');
            return;
        }
        setSubmitting(true);
        try {
            const studentId = await getCurrentStudentId();
            if (!studentId) { setSubmitting(false); return; }
            const typeMap: Record<NoteType, string> = {
                allergy: 'Dị ứng',
                health: 'Sức khỏe',
                diet: 'Chế độ ăn',
                other: 'Khác'
            };
            const newNote = {
                studentId,
                type: formType,
                title: typeMap[formType],
                content: formContent,
                isImportant: formIsImportant
            };
            const res = await notesApi.submit(newNote);
            const created = res.data.data;
            const mappedCreated = {
                ...created,
                updatedAt: new Date(created.updatedAt).toLocaleDateString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })
            };

            if (formIsImportant) {
                setNotes(prev => [mappedCreated, ...prev]);
            } else {
                setNotes(prev => [...prev, mappedCreated]);
            }
            setScreen('list');
            setFormContent('');
            setFormIsImportant(false);
        } finally {
            setSubmitting(false);
        }
    };

    const renderCategoryIcon = (type: NoteType, size: number = 24, color: string = '#7f8c8d') => {
        switch (type) {
            case 'allergy': return <MaterialCommunityIcons name="alert-outline" size={size} color={color} />;
            case 'health': return <MaterialCommunityIcons name="heart-pulse" size={size} color={color} />;
            case 'diet': return <MaterialCommunityIcons name="silverware-fork-knife" size={size} color={color} />;
            default: return <MaterialIcons name="description" size={size} color={color} />;
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b5998" /></View>;

    /* ─── FORM ─── */
    if (screen === 'form') {
        const types: { key: NoteType; label: string }[] = [
            { key: 'allergy', label: 'Dị ứng' },
            { key: 'health', label: 'Sức khỏe' },
            { key: 'diet', label: 'Chế độ ăn' },
            { key: 'other', label: 'Khác' },
        ];

        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setScreen('list')}>
                        <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Lưu ý về học sinh</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Thêm lưu ý mới</Text>

                        <Text style={styles.fieldLabel}>Loại lưu ý</Text>
                        <View style={styles.typeGrid}>
                            {types.map((t) => (
                                <TouchableOpacity
                                    key={t.key}
                                    style={[styles.typeItem, formType === t.key && styles.typeItemActive]}
                                    onPress={() => setFormType(t.key)}
                                >
                                    {renderCategoryIcon(t.key, 20, formType === t.key ? '#2c3e50' : '#7f8c8d')}
                                    <Text style={[styles.typeItemText, formType === t.key && styles.typeItemTextActive]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.fieldLabel}>Nội dung chi tiết</Text>
                        <TextInput
                            style={styles.reasonInput}
                            placeholder="Ví dụ: Cháu bị dị ứng với tôm, vui lòng không cho cháu ăn trong bữa trưa..."
                            placeholderTextColor="#bdc3c7"
                            value={formContent}
                            onChangeText={setFormContent}
                            multiline
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={styles.importantToggle}
                            onPress={() => setFormIsImportant(!formIsImportant)}
                        >
                            <View style={[styles.checkbox, formIsImportant && styles.checkboxActive]}>
                                {formIsImportant && <Ionicons name="checkmark" size={14} color="white" />}
                            </View>
                            <Text style={styles.importantToggleText}>Đánh dấu quan trọng (Ghim đầu trang)</Text>
                        </TouchableOpacity>

                        <View style={styles.formFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setScreen('list')}>
                                <Text style={styles.cancelBtnText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.submitBtnText}>Lưu lại</Text>}
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
                <Text style={styles.headerTitle}>Lưu ý về học sinh</Text>
                <TouchableOpacity style={styles.addCircleBtn} onPress={() => setScreen('form')}>
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {notes.map((item) => {
                    const isAllergy = item.type === 'allergy';
                    const iconColor = isAllergy ? '#e74c3c' : '#3498db';
                    const bgColor = isAllergy ? '#fff0f0' : '#f0f7ff';

                    return (
                        <View key={item.id} style={[styles.noteCard, { backgroundColor: bgColor }]}>
                            {item.isImportant && (
                                <View style={styles.importantBadge}>
                                    <Text style={styles.importantBadgeText}>QUAN TRỌNG</Text>
                                </View>
                            )}

                            <View style={styles.cardHeader}>
                                <View style={styles.iconBox}>
                                    {renderCategoryIcon(item.type, 22, iconColor)}
                                </View>
                                <Text style={styles.noteTypeTitle}>{item.title}</Text>
                                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                    <Ionicons name="trash-outline" size={20} color="#bdc3c7" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.contentBox}>
                                <Text style={styles.noteContent}>{item.content}</Text>
                            </View>

                            <Text style={styles.updatedAt}>Cập nhật: {item.updatedAt}</Text>
                        </View>
                    );
                })}

                {schoolNotice && (
                    <View style={[styles.noteCard, { backgroundColor: '#f0f7ff', borderStyle: 'dashed', borderWidth: 1, borderColor: '#3498db' }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: 'white' }]}>
                                <MaterialCommunityIcons name="heart-pulse" size={22} color="#3498db" />
                            </View>
                            <Text style={[styles.noteTypeTitle, { color: '#3b5998' }]}>{schoolNotice.title}</Text>
                        </View>
                        <Text style={[styles.noteContent, { color: '#3b5998', fontSize: 13, lineHeight: 18 }]}>{schoolNotice.content}</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    addCircleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ff4d4d', justifyContent: 'center', alignItems: 'center' },

    // Note Card
    noteCard: { borderRadius: 20, padding: 16, marginBottom: 16, position: 'relative', overflow: 'hidden' },
    importantBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#ff4d4d', paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 10 },
    importantBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    noteTypeTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
    contentBox: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 8 },
    noteContent: { fontSize: 14, color: '#34495e', lineHeight: 22 },
    updatedAt: { fontSize: 12, color: '#95a5a6', textAlign: 'right' },



    // Form
    formCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
    formTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 20 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: '#7f8c8d', marginBottom: 10 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    typeItem: { width: '48%', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa', gap: 8 },
    typeItemActive: { borderColor: '#2c3e50', backgroundColor: 'white' },
    typeItemText: { fontSize: 13, color: '#7f8c8d', fontWeight: '500' },
    typeItemTextActive: { color: '#2c3e50', fontWeight: 'bold' },
    reasonInput: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, fontSize: 14, color: '#2c3e50', height: 120, marginBottom: 20, textAlignVertical: 'top', borderWidth: 1, borderColor: '#eee' },
    importantToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffdf0', padding: 16, borderRadius: 12, marginBottom: 24 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ddd', marginRight: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
    checkboxActive: { backgroundColor: '#3b5998', borderColor: '#3b5998' },
    importantToggleText: { fontSize: 13, color: '#34495e', fontWeight: '500' },
    formFooter: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#f1f2f6', alignItems: 'center' },
    cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#7f8c8d' },
    submitBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#ff4d4d', alignItems: 'center' },
    submitBtnText: { fontSize: 15, fontWeight: 'bold', color: 'white' },
});
