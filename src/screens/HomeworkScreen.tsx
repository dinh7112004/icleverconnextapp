import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Dimensions, RefreshControl, Alert, TextInput, Modal, LayoutAnimation, Platform, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { academicApi, uploadApi } from '../services/api';
import { getCurrentUser, getCurrentStudentId, getCurrentClassId } from '../services/userHelper';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

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
    feedback?: string;
    submittedAt?: string;
}

export default function HomeworkScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [homeworks, setHomeworks] = useState<Homework[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
    const [activeFilter, setActiveFilter] = useState<string>(t('homework.all'));
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    // Modal state
    const [submitModalVisible, setSubmitModalVisible] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
    const [submitText, setSubmitText] = useState('');
    const [attachments, setAttachments] = useState<any[]>([]);
    const [studentInfo, setStudentInfo] = useState<any>(null);
    
    // Debug state
    const [debugIds, setDebugIds] = useState({ studentId: 'Loading...', classId: 'Loading...' });

    const loadInitialData = async () => {
        const cacheKey = 'homework_cache';
        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                setHomeworks(data.homeworks || []);
                setSubmissions(data.submissions || []);
                setLoading(false);
            }

            const studentProfileString = await AsyncStorage.getItem('student_profile');
            if (studentProfileString) {
                setStudentInfo(JSON.parse(studentProfileString));
            }

            const studentId = await getCurrentStudentId();
            const classId = await getCurrentClassId();
            if (!studentId || !classId) {
                if (!cached) setError('Không tìm thấy thông tin lớp học.');
                setLoading(false);
                return;
            }

            const [hwRes, subRes] = await Promise.all([
                academicApi.getHomeworks(classId),
                academicApi.getSubmissions(studentId)
            ]);

            const hwData = hwRes.data.data || [];
            const subData = subRes.data.data || [];
            setHomeworks(hwData);
            setSubmissions(subData);
            AsyncStorage.setItem(cacheKey, JSON.stringify({ homeworks: hwData, submissions: subData }));
        } catch (error: any) {
            console.error('Error fetching homework data:', error);
            if (!loading) setError(error.message || 'Lỗi kết nối máy chủ');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const isDone = useCallback((hwId: string) => {
        return submissions.some(s => String(s.homework) === String(hwId));
    }, [submissions]);

    const uniqueSubjects = useMemo(() => {
        return [t('homework.all'), ...Array.from(new Set(homeworks.map(h => h.subject.name)))];
    }, [homeworks, t]);

    const filteredHomeworks = useMemo(() => {
        return homeworks.filter(hw => {
            const done = isDone(hw._id);
            const matchesTab = activeTab === 'pending' ? !done : done;
            const matchesSubject = activeFilter === t('homework.all') || hw.subject.name === activeFilter;
            return matchesTab && matchesSubject;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [homeworks, submissions, activeTab, activeFilter, isDone, t]);

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
            Alert.alert(t('common.error'), t('homework.missingData'));
            return;
        }

        try {
            setLoading(true);
            
            // BƯỚC 1: Tải các file đính kèm lên server trước (vì backend lms không nhận multipart trực tiếp)
            const uploadedFiles: any[] = [];
            
            for (const file of attachments) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', {
                    uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
                    type: file.type === 'image' ? 'image/jpeg' : 'application/octet-stream',
                    name: file.name || `file_${Date.now()}`
                } as any);

                try {
                    const uploadRes = await uploadApi.post(uploadFormData, 'homework');
                    if (uploadRes.data && uploadRes.data.url) {
                        uploadedFiles.push({
                            url: uploadRes.data.url,
                            name: file.name,
                            type: file.type
                        });
                    }
                } catch (err) {
                    console.error('File upload failed:', err);
                }
            }

            // BƯỚC 2: Gửi thông tin bài làm kèm các link file (JSON)
            const submitData = {
                textContent: submitText,
                studentId: studentInfo?.id || '',
                studentName: studentInfo?.fullName || '',
                files: uploadedFiles
            };

            await academicApi.submitHomework(selectedHomework._id, submitData);
            
            Alert.alert(t('common.success'), t('homework.submitSuccess'));
            setSubmitModalVisible(false);
            setSubmitText('');
            setAttachments([]);
            loadInitialData();
        } catch (error) {
            console.error('Submit homework error:', error);
            Alert.alert(t('common.error'), t('homework.submitFailed'));
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

    const renderCard = (hw: Homework) => {
        const done = isDone(hw._id);
        const isExpanded = expandedCard === hw._id;
        const deadlineDate = new Date(hw.deadLine);
        const isLate = !done && deadlineDate.getTime() < Date.now();
        const submission = submissions.find(s => String(s.homework) === String(hw._id));

        return (
            <TouchableOpacity
                key={hw._id}
                style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, isExpanded && [styles.activeCardBorder, { borderColor: theme.primary, backgroundColor: isDark ? '#1e293b' : '#f8faff' }]]}
                activeOpacity={0.9}
                onPress={() => toggleExpand(hw._id)}
            >
                <View style={styles.cardTopRow}>
                    <View style={[styles.subjectBadge, { backgroundColor: isDark ? '#1e293b' : '#eef2ff' }]}>
                        <Text style={[styles.subjectBadgeText, { color: isDark ? '#60A5FA' : '#3b82f6' }]}>{hw.subject.name.toUpperCase()}</Text>
                    </View>

                    {done ? (
                        <View style={[styles.doneBadgeRef, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4' }]}>
                            <Ionicons name="time-outline" size={14} color="#27ae60" style={{ marginRight: 4 }} />
                            <Text style={styles.doneBadgeTextRef}>Đã hoàn thành</Text>
                        </View>
                    ) : (
                        <View style={[styles.deadlineBadge, { backgroundColor: isDark ? (isLate ? '#451a1a' : '#4a2b10') : (isLate ? '#fdedec' : '#fff7ed') }]}>
                            <Ionicons name="time-outline" size={14} color={isLate ? "#e74c3c" : "#e67e22"} style={{ marginRight: 4 }} />
                            <Text style={[styles.deadlineBadgeText, isLate && { color: '#e74c3c' }]}>{formatDeadline(hw.deadLine)}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.titleRow}>
                    <Text style={[styles.hwTitle, { color: theme.text }]}>{hw.title}</Text>
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                </View>

                {!isExpanded && (
                    <Text style={[styles.briefDescText, { color: theme.textSecondary }]} numberOfLines={1}>{hw.description}</Text>
                )}

                {isExpanded && (
                    <View style={styles.expandedArea}>
                        <View style={[styles.requirementBox, { backgroundColor: isDark ? '#2D3748' : '#f8fafc' }]}>
                            <Text style={[styles.reqTitle, { color: theme.textSecondary }]}>YÊU CẦU:</Text>
                            <Text style={[styles.reqDesc, { color: theme.text }]}>{hw.description}</Text>
                        </View>
                        {!done && (
                            <TouchableOpacity
                                style={[styles.submitBtnPremium, { backgroundColor: theme.primary }]}
                                onPress={() => {
                                    setSelectedHomework(hw);
                                    setSubmitModalVisible(true);
                                }}
                            >
                                <Ionicons name="checkmark-done-circle-outline" size={24} color="white" style={{ marginRight: 10 }} />
                                <Text style={styles.submitBtnTextPremium}>Hoàn thành nộp bài</Text>
                            </TouchableOpacity>
                        )}
                        {done && submission && (
                            <View style={[styles.resultBoxRef, { backgroundColor: isDark ? '#451a1a' : '#fef2f2', borderColor: isDark ? '#7f1d1d' : '#fee2e2' }]}>
                                <View style={styles.resultScoreCol}>
                                    <Text style={[styles.resultLabelRef, { color: theme.textSecondary }]}>ĐIỂM SỐ</Text>
                                    <View style={styles.scoreValueRow}>
                                        <Text style={styles.scoreValueMain}>{submission.grade}</Text>
                                        <Text style={[styles.scoreValueSub, { color: theme.textSecondary }]}>/10</Text>
                                    </View>
                                </View>
                                <View style={[styles.resultDividerRef, { backgroundColor: isDark ? '#7f1d1d' : '#fee2e2' }]} />
                                <View style={styles.resultFeedbackCol}>
                                    <Text style={[styles.resultLabelRef, { color: theme.textSecondary }]}>NHẬN XÉT</Text>
                                    <Text style={[styles.feedbackTextRef, { color: theme.text }]}>
                                        "{submission.feedback || 'Học sinh hoàn thành bài làm tốt.'}"
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        );
    };


    if (error) {
        return (
            <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <Ionicons name="cloud-offline-outline" size={64} color="#e74c3c" />
                <Text style={{ marginTop: 16, fontSize: 16, color: theme.text, textAlign: 'center', paddingHorizontal: 40 }}>
                    {error}
                </Text>
                <Text style={{ marginTop: 8, fontSize: 14, color: theme.textSecondary, textAlign: 'center', paddingHorizontal: 40 }}>
                    Không thể kết nối tới máy chủ. Vui lòng kiểm tra địa chỉ IP trong api.ts (nếu dùng máy thật).
                </Text>
                <TouchableOpacity 
                    style={[styles.submitBtnLarge, { marginTop: 20, paddingHorizontal: 30, backgroundColor: theme.primary }]} 
                    onPress={() => loadInitialData()}
                >
                    <Text style={styles.submitBtnLargeText}>Thử lại</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Bài tập về nhà</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={[styles.tabBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && [styles.activeTab, { borderBottomColor: theme.primary }]]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'pending' && [styles.activeTabText, { color: theme.primary }]]}>
                        {t('homework.pending')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'completed' && [styles.activeTab, { borderBottomColor: theme.primary }]]}
                    onPress={() => setActiveTab('completed')}
                >
                    <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'completed' && [styles.activeTabText, { color: theme.primary }]]}>
                        {t('homework.completed')}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.filterSection, { backgroundColor: theme.surface }]}>
                <View style={[styles.filterIconCircle, { backgroundColor: isDark ? '#2D3748' : '#f1f5f9' }]}>
                    <Ionicons name="options-outline" size={18} color={theme.textSecondary} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {uniqueSubjects.map(sub => (
                        <TouchableOpacity
                            key={sub}
                            style={[styles.filterPill, { backgroundColor: isDark ? '#2D3748' : '#f1f5f9' }, activeFilter === sub && [styles.activeFilterPill, { backgroundColor: theme.primary }]]}
                            onPress={() => setActiveFilter(sub)}
                        >
                            <Text style={[styles.filterPillText, { color: theme.textSecondary }, activeFilter === sub && styles.activeFilterText]}>{sub}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadInitialData(); }} />}
            >
                {filteredHomeworks.map(renderCard)}

                {filteredHomeworks.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={80} color={isDark ? '#2D3748' : '#ecf0f1'} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Thật tuyệt vời! Không có bài tập nào.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Submission Modal */}
            <Modal visible={submitModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Nộp bài tập</Text>
                            <TouchableOpacity onPress={() => {
                                setSubmitModalVisible(false);
                                setAttachments([]);
                                setSubmitText('');
                            }}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Môn học / Bài tập</Text>
                        <View style={[styles.hwInfoBox, { backgroundColor: isDark ? '#1e3a8a' : '#f8faff' }]}>
                            <Text style={[styles.hwInfoText, { color: isDark ? '#93c5fd' : '#1e40af' }]}>
                                {selectedHomework?.subject.name} - {selectedHomework?.title}
                            </Text>
                        </View>

                        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Nội dung bài làm</Text>
                        <TextInput
                            style={[styles.submitInput, { backgroundColor: isDark ? '#2D3748' : '#f8fafc', color: theme.text, borderColor: theme.border }]}
                            placeholder="Nhập nội dung trả lời..."
                            placeholderTextColor={theme.textSecondary}
                            multiline
                            textAlignVertical="top"
                            value={submitText}
                            onChangeText={setSubmitText}
                        />

                        <TouchableOpacity 
                            style={[styles.uploadArea, { backgroundColor: isDark ? '#2D3748' : '#f8fafc', borderColor: theme.border }]} 
                            onPress={() => {
                                Alert.alert(
                                    "Đính kèm tệp",
                                    "Chọn loại tệp muốn đính kèm",
                                    [
                                        { text: "Ảnh", onPress: handlePickImage },
                                        { text: "Tệp tin", onPress: handlePickDocument },
                                        { text: "Hủy", style: "cancel" }
                                    ]
                                );
                            }}
                        >
                            <View style={[styles.uploadIconCircle, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }]}>
                                <Ionicons name="cloud-upload-outline" size={32} color={isDark ? '#60A5FA' : '#3b82f6'} />
                            </View>
                            <Text style={[styles.uploadText, { color: theme.text }]}>Chạm để tải ảnh bài làm</Text>
                            <Text style={[styles.uploadSubText, { color: theme.textSecondary }]}>Hỗ trợ JPG, PNG, PDF</Text>
                        </TouchableOpacity>

                        {attachments.length > 0 && (
                            <ScrollView style={styles.attachmentsList} horizontal showsHorizontalScrollIndicator={false}>
                                {attachments.map((file, idx) => (
                                    <View key={idx} style={[styles.attachmentBadge, { backgroundColor: isDark ? '#2D3748' : '#f1f5f9' }]}>
                                        <Ionicons name={file.type === 'image' ? "image" : "document"} size={16} color={theme.primary} />
                                        <Text style={[styles.attachmentName, { color: theme.text }]} numberOfLines={1}>{file.name}</Text>
                                        <TouchableOpacity onPress={() => removeAttachment(idx)}>
                                            <Ionicons name="close-circle" size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <TouchableOpacity style={[styles.submitBtnPremium, { backgroundColor: theme.primary }]} onPress={handleSubmit}>
                            <Ionicons name="checkmark-done-circle-outline" size={24} color="white" style={{ marginRight: 10 }} />
                            <Text style={styles.submitBtnTextPremium}>Hoàn thành nộp bài</Text>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', flex: 1, textAlign: 'center', marginRight: 40 },

    tabBar: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#3b82f6' },
    tabText: { fontSize: 15, color: '#64748b', fontWeight: '600' },
    activeTabText: { color: '#1e40af', fontWeight: 'bold' },

    filterSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white' },
    filterIconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    filterScroll: { alignItems: 'center' },
    filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8 },
    activeFilterPill: { backgroundColor: '#3b82f6' },
    filterPillText: { fontSize: 13, color: '#475569', fontWeight: '500' },
    activeFilterText: { color: 'white', fontWeight: '600' },

    scrollContent: { padding: 16 },

    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    activeCardBorder: {
        borderColor: '#3b82f6',
        backgroundColor: '#f8faff',
    },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    subjectBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    subjectBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#3b82f6' },
    deadlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    deadlineBadgeText: { fontSize: 11, fontWeight: '600', color: '#ea580c' },
    doneBadgeRef: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    doneBadgeTextRef: { fontSize: 11, fontWeight: '600', color: '#27ae60' },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    hwTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1e293b' },
    briefDescText: { fontSize: 13, color: '#64748b', marginTop: 4 },
    
    expandedArea: { marginTop: 12 },
    requirementBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16 },
    reqTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', marginBottom: 4 },
    reqDesc: { fontSize: 14, color: '#334155', lineHeight: 20 },
    
    resultBoxRef: {
        flexDirection: 'row',
        backgroundColor: '#fef2f2',
        borderRadius: 10,
        padding: 16,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    resultScoreCol: { width: 80, alignItems: 'center' },
    resultLabelRef: { fontSize: 10, fontWeight: '800', color: '#94a3b8', marginBottom: 4 },
    scoreValueRow: { flexDirection: 'row', alignItems: 'baseline' },
    scoreValueMain: { fontSize: 24, fontWeight: '800', color: '#ef4444' },
    scoreValueSub: { fontSize: 12, color: '#94a3b8' },
    resultDividerRef: { width: 1, backgroundColor: '#fee2e2', marginHorizontal: 12 },
    resultFeedbackCol: { flex: 1 },
    feedbackTextRef: { fontSize: 13, color: '#334155', fontStyle: 'italic', lineHeight: 18 },

    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { marginTop: 12, fontSize: 14, color: '#94a3b8' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
    hwInfoBox: { backgroundColor: '#f8faff', padding: 16, borderRadius: 12, marginBottom: 16 },
    hwInfoText: { fontSize: 15, fontWeight: '600', color: '#1e40af' },
    sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6 },
    submitInput: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, fontSize: 14, height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
    uploadArea: { height: 140, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', marginBottom: 16 },
    uploadIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    uploadText: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    uploadSubText: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    attachmentsList: { marginVertical: 12 },
    attachmentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8 },
    attachmentName: { fontSize: 11, color: '#475569', maxWidth: 80, marginLeft: 4, marginRight: 4 },
    submitBtnPremium: { backgroundColor: '#3b82f6', flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    submitBtnTextPremium: { color: 'white', fontSize: 16, fontWeight: '700' },
    submitBtnLarge: { backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
    submitBtnLargeText: { color: 'white', fontWeight: '700' },
});
