import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView,
    TouchableOpacity, SafeAreaView, ActivityIndicator,
    StatusBar, Dimensions, Modal, Alert, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { surveyApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SurveyScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();
    const [surveys, setSurveys] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
    const [takingModal, setTakingModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const loadInitialData = async () => {
        const cacheKey = 'survey_cache';
        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                setSurveys(JSON.parse(cached));
                setLoading(false);
            }

            const response = await surveyApi.getSurveys();
            let surveyData = { ongoing: [], history: [] };
            if (response.data && response.data.success) {
                const innerData = response.data.data;
                surveyData = innerData?.data || innerData || surveyData;
            }
            setSurveys(surveyData);
            AsyncStorage.setItem(cacheKey, JSON.stringify(surveyData));
        } catch (error) {
            console.error('Error fetching surveys:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const renderOngoingCard = (item: any) => (
        <View key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: isDark ? '#000' : '#000' }]}>
            <View style={styles.cardHeader}>
                <View style={styles.badgeRow}>
                    {item.isNew && (
                        <View style={[styles.newBadge, { backgroundColor: isDark ? '#064e3b' : '#e8f5e9' }]}>
                            <Ionicons name="flash" size={10} color="#00c853" style={{ marginRight: 4 }} />
                            <Text style={styles.newText}>Mới</Text>
                        </View>
                    )}
                </View>
                <View style={styles.expiryBox}>
                    <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.expiryText, { color: theme.textSecondary }]}>Hạn: {item.expiryDate}</Text>
                </View>
            </View>
            
            <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
            
            <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.questionCount, { color: theme.textSecondary }]}>{item.questions} câu hỏi</Text>
                </View>
                
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: isDark ? '#065f46' : '#dcfce7' }]} 
                    activeOpacity={0.7}
                    onPress={() => {
                        setSelectedSurvey(item);
                        setRating(0);
                        setComment('');
                        setTakingModal(true);
                    }}
                >
                    <Text style={styles.actionBtnText}>Làm khảo sát</Text>
                    <Ionicons name="chevron-forward" size={16} color="#00c853" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderHistoryItem = (item: any) => {
        const isCompleted = item.status === 'completed';
        const isExpired = item.status === 'expired';
        
        return (
            <TouchableOpacity key={item.id} style={[styles.historyItem, { borderBottomColor: theme.border }]} activeOpacity={0.6}>
                <View style={styles.historyInfo}>
                    <Text style={[styles.historyTitle, { color: theme.text }, isExpired && styles.textMuted]}>{item.title}</Text>
                    <View style={styles.statusRow}>
                        <Ionicons 
                            name={isCompleted ? "checkmark-circle" : "alert-circle-outline"} 
                            size={16} 
                            color={isCompleted ? "#00c853" : theme.textSecondary} 
                        />
                        <Text style={[styles.statusText, { color: isCompleted ? "#00c853" : theme.textSecondary }]}>
                            {isCompleted ? "Đã hoàn thành" : "Đã hết hạn"}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.border} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDark ? '#1E293B' : '#f8fafc' }]}>
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Khảo sát & Ý kiến</Text>
                <View style={{ width: 40 }} />
            </View>

            {
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Section: ĐANG DIỄN RA */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ĐANG DIỄN RA</Text>
                        {surveys?.ongoing?.length > 0 ? (
                            surveys.ongoing.map(renderOngoingCard)
                        ) : (
                            <View style={[styles.emptyCard, { backgroundColor: isDark ? '#1E293B' : '#f8fafc' }]}>
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Hiện không có khảo sát nào đang diễn ra</Text>
                            </View>
                        )}
                    </View>

                    {/* Section: LỊCH SỬ */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>LỊCH SỬ</Text>
                        <View style={[styles.historyContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            {surveys?.history?.length > 0 ? (
                                surveys.history.map(renderHistoryItem)
                            ) : (
                                <View style={[styles.emptyCard, { backgroundColor: isDark ? '#1E293B' : '#f8fafc' }]}>
                                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Chưa có lịch sử khảo sát</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            }

            {/* Take Survey Modal */}
            <Modal
                visible={takingModal}
                transparent
                animationType="slide"
                onRequestClose={() => setTakingModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: theme.surface }]}>
                        <View style={[styles.modalIndicator, { backgroundColor: theme.border }]} />
                        <View style={[styles.modalHeaderInner, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedSurvey?.title}</Text>
                            <TouchableOpacity onPress={() => setTakingModal(false)}>
                                <Ionicons name="close-circle" size={32} color={theme.border} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.questionBox}>
                                <Text style={[styles.questionText, { color: theme.text }]}>1. Bạn đánh giá như thế nào về chất lượng dịch vụ này?</Text>
                                <View style={styles.ratingRow}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <TouchableOpacity 
                                            key={star} 
                                            style={styles.starBtn}
                                            onPress={() => setRating(star)}
                                        >
                                            <Ionicons 
                                                name={star <= rating ? "star" : "star-outline"} 
                                                size={32} 
                                                color={star <= rating ? "#f1c40f" : theme.border} 
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.questionBox}>
                                <Text style={[styles.questionText, { color: theme.text }]}>2. Ý kiến đóng góp thêm của bạn:</Text>
                                <TextInput
                                    style={[styles.textArea, { backgroundColor: isDark ? '#1E293B' : '#f8fafc', borderColor: theme.border, color: theme.text }]}
                                    placeholder="Nhập ý kiến của bạn tại đây..."
                                    placeholderTextColor={theme.textSecondary}
                                    multiline
                                    textAlignVertical="top"
                                    value={comment}
                                    onChangeText={setComment}
                                />
                            </View>
                        </ScrollView>

                        <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
                            <TouchableOpacity 
                                style={[styles.submitBtn, submitting && styles.btnDisabled]} 
                                onPress={async () => {
                                    if (!selectedSurvey) return;
                                    setSubmitting(true);
                                    try {
                                        const response = await surveyApi.submitSurvey(selectedSurvey.id);
                                        if (response.data.success) {
                                            setTakingModal(false);
                                            Alert.alert("Thành công", "Cảm ơn bạn đã gửi phản hồi!");
                                            loadInitialData(); // Refresh list to move to history
                                        }
                                    } catch (error) {
                                        console.error('Submit error:', error);
                                        Alert.alert("Lỗi", "Không thể gửi phản hồi lúc này.");
                                    } finally {
                                        setSubmitting(false);
                                    }
                                }}
                                disabled={submitting}
                            >
                                {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Gửi phản hồi</Text>}
                            </TouchableOpacity>
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
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
    
    scrollContent: { padding: 20 },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 13, fontWeight: '900', color: '#64748b', letterSpacing: 1, marginBottom: 20 },

    // Card Design
    card: { 
        backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 20,
        borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    badgeRow: { flexDirection: 'row', gap: 8 },
    newBadge: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', 
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 
    },
    newText: { color: '#00c853', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    expiryBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    expiryText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
    cardTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 20, lineHeight: 26 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    questionCount: { fontSize: 14, color: '#64748b', fontWeight: '600' },
    actionBtn: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', 
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#dcfce7'
    },
    actionBtnText: { color: '#00c853', fontSize: 14, fontWeight: '800', marginRight: 4 },

    // History Design
    historyContainer: { backgroundColor: 'white', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
    historyItem: { 
        flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' 
    },
    historyInfo: { flex: 1 },
    historyTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
    textMuted: { color: '#94a3b8' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusText: { fontSize: 13, fontWeight: '600' },
    
    emptyCard: { padding: 30, backgroundColor: '#f8fafc', borderRadius: 24, alignItems: 'center' },
    emptyText: { color: '#94a3b8', fontSize: 14, textAlign: 'center' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: SCREEN_WIDTH > 400 ? '70%' : '85%', paddingBottom: 20 },
    modalIndicator: { width: 40, height: 5, backgroundColor: '#e2e8f0', borderRadius: 3, alignSelf: 'center', marginTop: 12 },
    modalHeaderInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', flex: 1, marginRight: 15 },
    modalBody: { padding: 24 },
    questionBox: { marginBottom: 30 },
    questionText: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 16, lineHeight: 24 },
    ratingRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
    starBtn: { padding: 5 },
    textArea: { height: 120, backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    placeholderText: { color: '#94a3b8', fontSize: 14 },
    modalFooter: { padding: 24, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    submitBtn: { backgroundColor: '#00c853', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#00c853', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    submitBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
    btnDisabled: { backgroundColor: '#cbd5e1', shadowOpacity: 0 },
});
