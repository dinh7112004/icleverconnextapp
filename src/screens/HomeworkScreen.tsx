import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Dimensions, RefreshControl, Alert, TextInput, Modal, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { academicApi } from '../services/api';
import { getCurrentUser, getCurrentStudentId, getCurrentClassId } from '../services/userHelper';

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

interface Homework {
    _id: string;
    title: string;
    description: string;
    deadLine: string;
    subject: {
        _id: string;
        name: string;
        color: string;
        icon: string;
    };
    teacher: {
        fullName: string;
    };
    createdAt: string;
}

interface Submission {
    homework: string;
    status: string;
    grade?: number;
}

export default function HomeworkScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [homeworks, setHomeworks] = useState<Homework[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
    const [activeFilter, setActiveFilter] = useState<string>('Tất cả');
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    // Modal state
    const [submitModalVisible, setSubmitModalVisible] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
    const [submitText, setSubmitText] = useState('');
    const [attachments, setAttachments] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        try {
            const studentId = await getCurrentStudentId();
            const classId = await getCurrentClassId();

            if (!studentId || !classId) {
                setLoading(false);
                return;
            }

            const [hwRes, subRes] = await Promise.all([
                academicApi.getHomeworks(classId),
                academicApi.getSubmissions(studentId)
            ]);

            setHomeworks(hwRes.data.data || []);
            setSubmissions(subRes.data.data || []);
        } catch (error) {
            console.error('Error fetching homework data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);


    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const isDone = (hwId: string) => submissions.some(s => s.homework === hwId);

    const filteredHomeworks = homeworks.filter(hw => {
        const matchesTab = activeTab === 'pending' ? !isDone(hw._id) : isDone(hw._id);
        const matchesSubject = activeFilter === 'Tất cả' || hw.subject.name === activeFilter;
        return matchesTab && matchesSubject;
    });

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedCard(expandedCard === id ? null : id);
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled) {
            setAttachments(prev => [...prev, { uri: result.assets[0].uri, type: 'image', name: 'image.jpg' }]);
        }
    };

    const handlePickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true
        });

        if (!result.canceled) {
            setAttachments(prev => [...prev, { uri: result.assets[0].uri, type: 'file', name: result.assets[0].name }]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!selectedHomework) return;
        if (!submitText.trim() && attachments.length === 0) {
            Alert.alert('Chưa có dữ liệu', 'Vui lòng nhập link tài liệu hoặc đính kèm file ảnh/tệp.');
            return;
        }

        try {
            setLoading(true);
            await academicApi.submitHomework(selectedHomework._id, { textContent: submitText, files: attachments });
            Alert.alert('Thành công', 'Đã nộp bài tập thành công!');
            setSubmitModalVisible(false);
            setSubmitText('');
            setAttachments([]);
            fetchData();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể nộp bài, vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const formatDeadline = (iso: string) => {
        const d = new Date(iso);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        return `Hạn: ${day}-${month}`;
    };

    const uniqueSubjects = ['Tất cả', ...Array.from(new Set(homeworks.map(h => h.subject.name)))];

    const renderCard = (hw: Homework) => {
        const done = isDone(hw._id);
        const isExpanded = expandedCard === hw._id;
        const deadlineDate = new Date(hw.deadLine);
        const isLate = !done && deadlineDate.getTime() < Date.now();

        return (
            <TouchableOpacity
                key={hw._id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => toggleExpand(hw._id)}
            >
                <View style={styles.cardTopRow}>
                    <View style={styles.subjectBadge}>
                        <Text style={styles.subjectBadgeText}>{hw.subject.name.toUpperCase()}</Text>
                    </View>

                    {done ? (
                        <View style={styles.doneBadge}>
                            <Ionicons name="time-outline" size={14} color="#27ae60" style={{ marginRight: 4 }} />
                            <Text style={styles.doneBadgeText}>Đã hoàn thành</Text>
                        </View>
                    ) : (
                        <View style={[styles.deadlineBadge, isLate && { backgroundColor: '#fdedec' }]}>
                            <Ionicons name="time-outline" size={14} color={isLate ? "#e74c3c" : "#e67e22"} style={{ marginRight: 4 }} />
                            <Text style={[styles.deadlineBadgeText, isLate && { color: '#e74c3c' }]}>{formatDeadline(hw.deadLine)}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.titleRow}>
                    <Text style={styles.hwTitle}>{hw.title}</Text>
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#95a5a6" />
                </View>

                {isExpanded && (
                    <View style={styles.expandedArea}>
                        <View style={styles.requirementBox}>
                            <Text style={styles.reqTitle}>YÊU CẦU:</Text>
                            <Text style={styles.reqDesc}>{hw.description}</Text>
                        </View>
                        {!done && (
                            <TouchableOpacity
                                style={styles.submitBtnLarge}
                                onPress={() => {
                                    setSelectedHomework(hw);
                                    setSubmitModalVisible(true);
                                }}
                            >
                                <Ionicons name="push-outline" size={20} color="white" style={{ marginRight: 8 }} />
                                <Text style={styles.submitBtnLargeText}>Nộp bài ngay</Text>
                            </TouchableOpacity>
                        )}
                        {done && (
                            <Text style={styles.doneNote}>Nộp báo cáo hoặc tài liệu đã được ghi nhận.</Text>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2980b9" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bài tập về nhà</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                        Đang giao
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                    onPress={() => setActiveTab('completed')}
                >
                    <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
                        Đã nộp / Chấm điểm
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
                <View style={styles.filterIconCircle}>
                    <Ionicons name="options-outline" size={18} color="#7f8c8d" />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {uniqueSubjects.map(sub => (
                        <TouchableOpacity
                            key={sub}
                            style={[styles.filterPill, activeFilter === sub && styles.activeFilterPill]}
                            onPress={() => setActiveFilter(sub)}
                        >
                            <Text style={[styles.filterPillText, activeFilter === sub && styles.activeFilterText]}>{sub}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
            >
                {filteredHomeworks.map(renderCard)}

                {filteredHomeworks.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={80} color="#ecf0f1" />
                        <Text style={styles.emptyText}>Thật tuyệt vời! Không có bài tập nào.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Submission Modal */}
            <Modal visible={submitModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nộp bài tập</Text>
                            <TouchableOpacity onPress={() => {
                                setSubmitModalVisible(false);
                                setAttachments([]);
                                setSubmitText('');
                            }}>
                                <Ionicons name="close" size={24} color="#2c3e50" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalHwTitle}>{selectedHomework?.title}</Text>

                        <Text style={styles.sectionLabel}>Tính kèm tệp/ảnh:</Text>
                        <View style={styles.attachRow}>
                            <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage}>
                                <Ionicons name="image-outline" size={24} color="#3498db" />
                                <Text style={styles.attachText}>Chọn ảnh</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.attachBtn} onPress={handlePickDocument}>
                                <Ionicons name="document-attach-outline" size={24} color="#9b59b6" />
                                <Text style={styles.attachText}>Tải tệp lên</Text>
                            </TouchableOpacity>
                        </View>

                        {attachments.length > 0 && (
                            <ScrollView style={styles.attachmentsList} horizontal showsHorizontalScrollIndicator={false}>
                                {attachments.map((file, idx) => (
                                    <View key={idx} style={styles.attachmentBadge}>
                                        <Ionicons name={file.type === 'image' ? "image" : "document"} size={16} color="#7f8c8d" />
                                        <Text style={styles.attachmentName} numberOfLines={1}>{file.name}</Text>
                                        <TouchableOpacity onPress={() => removeAttachment(idx)}>
                                            <Ionicons name="close-circle" size={18} color="#e74c3c" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <Text style={styles.sectionLabel}>Hoặc điền link G-Drive / Ghi chú:</Text>
                        <TextInput
                            style={styles.submitInput}
                            placeholder="Nhập đường dẫn Google Drive hoặc nội dung..."
                            multiline
                            textAlignVertical="top"
                            value={submitText}
                            onChangeText={setSubmitText}
                        />

                        <TouchableOpacity style={styles.submitBtnLarge} onPress={handleSubmit}>
                            <Text style={styles.submitBtnLargeText}>Gửi bài làm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
    },
    backButton: { padding: 5, marginLeft: -5 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },

    tabBar: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#2980b9' },
    tabText: { fontSize: 15, color: '#7f8c8d', fontWeight: '600' },
    activeTabText: { color: '#2980b9', fontWeight: 'bold' },

    filterSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fdfdfd', borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
    filterIconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f2f6', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    filterScroll: { alignItems: 'center', paddingRight: 20 },
    filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f2f6', marginRight: 10 },
    activeFilterPill: { backgroundColor: '#2980b9' },
    filterPillText: { fontSize: 13, color: '#34495e', fontWeight: '600' },
    activeFilterText: { color: 'white' },

    scrollContent: { padding: 20 },

    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 18,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e8ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    subjectBadge: { backgroundColor: '#eaf4fd', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    subjectBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#2980b9' },
    deadlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef5e7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    deadlineBadgeText: { fontSize: 11, fontWeight: '600', color: '#e67e22' },
    doneBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eafaf1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    doneBadgeText: { fontSize: 11, fontWeight: '600', color: '#27ae60' },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    hwTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginRight: 15 },
    expandedArea: { marginTop: 15, overflow: 'hidden' },
    requirementBox: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 10, marginBottom: 15 },
    reqTitle: { fontSize: 12, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 5 },
    reqDesc: { fontSize: 14, color: '#34495e', lineHeight: 22 },
    submitBtnLarge: { backgroundColor: '#2980b9', flexDirection: 'row', paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    submitBtnLargeText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
    doneNote: { fontSize: 13, color: '#7f8c8d', fontStyle: 'italic', marginTop: 10 },

    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyText: { marginTop: 15, fontSize: 15, color: '#bdc3c7', fontWeight: '500' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    modalHwTitle: { fontSize: 16, fontWeight: 'bold', color: '#2980b9', marginBottom: 20 },
    sectionLabel: { fontSize: 14, fontWeight: '700', color: '#34495e', marginBottom: 10 },
    attachRow: { flexDirection: 'row', marginBottom: 20 },
    attachBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f2f6', paddingVertical: 12, borderRadius: 12, marginRight: 10 },
    attachText: { fontSize: 14, fontWeight: '600', color: '#34495e', marginLeft: 8 },
    attachmentsList: { flexDirection: 'row', marginBottom: 20 },
    attachmentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecf0f1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
    attachmentName: { fontSize: 12, color: '#2c3e50', width: 60, marginHorizontal: 6 },
    submitInput: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 15, fontSize: 14, color: '#2c3e50', marginBottom: 25, borderWidth: 1, borderColor: '#e1e5e8', height: 100 },
});
