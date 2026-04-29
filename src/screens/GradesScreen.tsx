import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    ActivityIndicator, SafeAreaView, Dimensions, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { academicApi, schoolsApi } from '../services/api';
import { getCurrentStudentId, getCurrentSchoolId } from '../services/userHelper';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

// ─── In-memory cache (tồn tại trong RAM, đọc ngay 0ms) ──────────────────────
const memCache: Record<string, { subjects: SubjectReport[]; gpa: number; yearName: string }> = {};

interface Grade {
    id: string;
    score: number;
    coefficient: number;
    gradeType: 'ORAL' | 'QUIZ_15' | 'QUIZ_45' | 'FINAL';
    comment?: string;
}

interface SubjectReport {
    subjectId: string;
    subjectName: string;
    grades: Grade[];
    average: number;
}

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────
function SkeletonBox({ width: w, height: h, borderRadius = 8, style }: any) {
    const shimmer = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });
    return (
        <Animated.View
            style={[{ width: w, height: h, borderRadius, backgroundColor: '#CBD5E0', opacity }, style]}
        />
    );
}

function GradesSkeleton({ isDark }: { isDark: boolean }) {
    const bg = isDark ? '#2D3748' : '#E2E8F0';
    return (
        <View style={{ padding: 20 }}>
            <View style={[styles.summaryCard, { backgroundColor: isDark ? '#2B4A6F' : '#bcd4f0' }]}>
                <SkeletonBox width={160} height={14} borderRadius={7} style={{ backgroundColor: isDark ? '#3a6090' : '#9ab8d8' }} />
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginVertical: 14 }}>
                    <SkeletonBox width={80} height={56} borderRadius={10} style={{ backgroundColor: isDark ? '#3a6090' : '#9ab8d8' }} />
                    <SkeletonBox width={40} height={24} borderRadius={6} style={{ marginLeft: 10, marginBottom: 4, backgroundColor: isDark ? '#3a6090' : '#9ab8d8' }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <SkeletonBox width={110} height={34} borderRadius={12} style={{ backgroundColor: isDark ? '#3a6090' : '#9ab8d8' }} />
                    <SkeletonBox width={110} height={34} borderRadius={12} style={{ backgroundColor: isDark ? '#3a6090' : '#9ab8d8' }} />
                </View>
            </View>
            <SkeletonBox width={180} height={18} borderRadius={9} style={{ marginBottom: 18, backgroundColor: bg }} />
            {[0, 1, 2, 3].map(i => (
                <View key={i} style={[styles.subjectCard, { backgroundColor: isDark ? '#1A202C' : 'white', marginBottom: 15 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: isDark ? '#2D3748' : '#EEF0F5' }}>
                        <View>
                            <SkeletonBox width={140} height={16} borderRadius={8} style={{ backgroundColor: bg, marginBottom: 8 }} />
                            <SkeletonBox width={80} height={12} borderRadius={6} style={{ backgroundColor: bg }} />
                        </View>
                        <SkeletonBox width={50} height={22} borderRadius={11} style={{ backgroundColor: bg }} />
                    </View>
                    <SkeletonBox width={width - 100} height={12} borderRadius={6} style={{ backgroundColor: bg, marginBottom: 12 }} />
                    <SkeletonBox width={width - 140} height={12} borderRadius={6} style={{ backgroundColor: bg, marginBottom: 12 }} />
                    <SkeletonBox width={width - 160} height={12} borderRadius={6} style={{ backgroundColor: bg }} />
                </View>
            ))}
        </View>
    );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function GradesScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();

    const [semester, setSemester] = useState('SEMESTER_1');
    // ✅ Khởi tạo lazy từ RAM cache → render frame đầu đã có data, 0ms delay
    const [subjects, setSubjects] = useState<SubjectReport[]>(() => memCache['SEMESTER_1']?.subjects || []);
    const [totalGPA, setTotalGPA] = useState<number>(() => memCache['SEMESTER_1']?.gpa || 0);
    const [academicYearName, setAcademicYearName] = useState<string>(() => memCache['SEMESTER_1']?.yearName || '');
    const [skeletonVisible, setSkeletonVisible] = useState<boolean>(() => !memCache['SEMESTER_1']);
    const [refreshing, setRefreshing] = useState(false);

    const fadeAnim = useRef(new Animated.Value(memCache['SEMESTER_1'] ? 1 : 0)).current;

    const fadeIn = () =>
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();

    const applyData = (data: { subjects: SubjectReport[]; gpa: number; yearName: string }) => {
        setSubjects(data.subjects);
        setTotalGPA(data.gpa);
        setAcademicYearName(data.yearName);
    };

    const loadData = async (sem: string) => {
        const cacheKey = sem;

        // 1️⃣ RAM cache → hiện ngay, 0ms
        if (memCache[cacheKey]) {
            applyData(memCache[cacheKey]);
            setSkeletonVisible(false);
            fadeAnim.setValue(1);
            setRefreshing(true); // cập nhật ngầm
        } else {
            // 2️⃣ Disk cache (AsyncStorage) → fallback nhanh
            try {
                const cached = await AsyncStorage.getItem(`grades_cache_${cacheKey}`);
                if (cached) {
                    const data = JSON.parse(cached);
                    const parsed = { subjects: data.subjects || [], gpa: data.gpa || 0, yearName: data.yearName || '' };
                    memCache[cacheKey] = parsed;
                    applyData(parsed);
                    setSkeletonVisible(false);
                    fadeIn();
                    setRefreshing(true);
                }
            } catch (_) {}
        }

        // 3️⃣ Fetch mới từ API (luôn chạy ngầm để cập nhật)
        try {
            const studentId = await getCurrentStudentId();
            const schoolId = await getCurrentSchoolId();
            if (!studentId || !schoolId) {
                setSkeletonVisible(false);
                setRefreshing(false);
                if (fadeAnim.__getValue() === 0) fadeIn();
                return;
            }

            let academicYearId = '';
            let yearName = '';
            try {
                const yearRes = await schoolsApi.getCurrentAcademicYear(schoolId);
                const yearData = yearRes.data.data;
                academicYearId = yearData.id;
                yearName = yearData.name;
                setAcademicYearName(yearName);
            } catch (err) {
                console.error('[Grades] Error fetching academic year:', err);
            }

            if (academicYearId) {
                const reportRes = await academicApi.getGradeReport(studentId, academicYearId, sem);
                const reportData = reportRes.data.data;
                const subjectsData = reportData.subjects || [];
                const gpaData = reportData.gpa || 0;
                const fresh = { subjects: subjectsData, gpa: gpaData, yearName };

                memCache[cacheKey] = fresh; // cập nhật RAM cache
                applyData(fresh);
                AsyncStorage.setItem(`grades_cache_${cacheKey}`, JSON.stringify(fresh));
            }
        } catch (error) {
            console.error('[Grades] Error fetching grades report:', error);
        } finally {
            setSkeletonVisible(false);
            setRefreshing(false);
            if ((fadeAnim as any).__getValue?.() === 0) fadeIn();
            else if (!memCache[semester]) fadeIn();
        }
    };

    useEffect(() => {
        // Khi đổi semester, reset nếu chưa có RAM cache
        if (!memCache[semester]) {
            setSkeletonVisible(true);
            fadeAnim.setValue(0);
        } else {
            applyData(memCache[semester]);
            setSkeletonVisible(false);
            fadeAnim.setValue(1);
        }
        loadData(semester);
    }, [semester]);

    const getRank = (gpa: number) => {
        if (gpa >= 8.0) return { title: 'Học lực: Giỏi', icon: 'trending-up' };
        if (gpa >= 6.5) return { title: 'Học lực: Khá', icon: 'trending-flat' };
        if (gpa >= 5.0) return { title: 'Học lực: TB', icon: 'trending-flat' };
        return { title: 'Học lực: Yếu', icon: 'trending-down' };
    };

    const rank = getRank(totalGPA);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Kết quả học tập</Text>
                <View style={{ width: 40, alignItems: 'center' }}>
                    {refreshing && <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#3498db'} />}
                </View>
            </View>

            {skeletonVisible ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                    <GradesSkeleton isDark={isDark} />
                </ScrollView>
            ) : (
                <Animated.ScrollView
                    style={{ opacity: fadeAnim }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* GPA Card */}
                    <LinearGradient colors={['#3498db', '#2980b9']} style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>ĐIỂM TRUNG BÌNH HK1</Text>
                        <View style={styles.gpaContainer}>
                            <Text style={styles.gpaValue}>{totalGPA.toFixed(1)}</Text>
                            <Text style={styles.gpaMax}>/ 10.0</Text>
                        </View>
                        <View style={styles.badgeRow}>
                            <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Ionicons name={rank.icon as any} size={14} color="white" />
                                <Text style={styles.badgeText}>{rank.title}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)', marginLeft: 10 }]}>
                                <FontAwesome5 name="medal" size={12} color="white" />
                                <Text style={styles.badgeText}>Hạnh kiểm: Tốt</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="book-outline" size={20} color={isDark ? '#60A5FA' : '#3b5998'} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Bảng điểm chi tiết</Text>
                    </View>

                    {subjects.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={60} color="#ddd" />
                            <Text style={styles.emptyText}>Chưa có dữ liệu bảng điểm</Text>
                        </View>
                    ) : (
                        subjects.map((subject, index) => {
                            const regularScores = subject.grades.filter(g => g.gradeType === 'ORAL' || g.gradeType === 'QUIZ_15');
                            const midtermScore = subject.grades.find(g => g.gradeType === 'QUIZ_45');
                            const finalScore = subject.grades.find(g => g.gradeType === 'FINAL');
                            return (
                                <View key={index} style={[styles.subjectCard, { backgroundColor: theme.surface }]}>
                                    <View style={[styles.subjectHeader, { borderBottomColor: theme.border }]}>
                                        <View>
                                            <Text style={[styles.subjectName, { color: theme.text }]}>{subject.subjectName}</Text>
                                            <Text style={{ fontSize: 12, color: theme.textSecondary }}>Học kỳ: {semester === 'SEMESTER_1' ? 'I' : 'II'}</Text>
                                        </View>
                                        <Text style={styles.subjectAvg}>TB: {subject.average.toFixed(1)}</Text>
                                    </View>
                                    <View style={styles.scoreRow}>
                                        <View style={styles.labelContainer}>
                                            <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Điểm TX:</Text>
                                        </View>
                                        <View style={styles.scoreList}>
                                            {regularScores.length > 0 ? regularScores.map((s, i) => (
                                                <View key={i} style={[styles.scoreBubble, { backgroundColor: isDark ? '#2D3748' : '#f1f2f6' }]}>
                                                    <Text style={[styles.scoreBubbleText, { color: theme.text }]}>{Number(s.score || 0).toFixed(1)}</Text>
                                                </View>
                                            )) : <Text style={{ color: theme.textSecondary, marginTop: 4 }}>-</Text>}
                                        </View>
                                    </View>
                                    <View style={styles.scoreRow}>
                                        <View style={styles.labelContainer}>
                                            <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Giữa kỳ:</Text>
                                        </View>
                                        <View style={styles.scoreList}>
                                            <Text style={[styles.midtermScore, { color: theme.text }]}>{midtermScore ? Number(midtermScore.score || 0).toFixed(1) : '-'}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.scoreRow}>
                                        <View style={styles.labelContainer}>
                                            <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Cuối kỳ:</Text>
                                        </View>
                                        <View style={styles.scoreList}>
                                            <Text style={[styles.finalScore, { color: isDark ? '#60A5FA' : '#2980b9' }]}>{finalScore ? Number(finalScore.score || 0).toFixed(1) : '-'}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </Animated.ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 15, height: 60, backgroundColor: 'white',
        borderBottomWidth: 1, borderBottomColor: '#eee'
    },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#2c3e50' },
    scrollContent: { padding: 20 },
    summaryCard: { borderRadius: 24, padding: 25, marginBottom: 25 },
    summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    gpaContainer: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 10 },
    gpaValue: { color: 'white', fontSize: 56, fontWeight: 'bold' },
    gpaMax: { color: 'rgba(255,255,255,0.7)', fontSize: 20, fontWeight: '600', marginBottom: 10, marginLeft: 8 },
    badgeRow: { flexDirection: 'row', marginTop: 10 },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    badgeText: { color: 'white', fontSize: 13, fontWeight: '700', marginLeft: 6 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginLeft: 5 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginLeft: 10 },
    subjectCard: {
        backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 15,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },
    subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
    subjectName: { fontSize: 17, fontWeight: 'bold', color: '#2c3e50' },
    subjectAvg: { fontSize: 15, fontWeight: '700', color: '#27ae60' },
    scoreRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    labelContainer: { height: 32, justifyContent: 'center', width: 80 },
    scoreLabel: { fontSize: 14, color: '#7f8c8d' },
    scoreList: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, alignItems: 'center' },
    scoreBubble: { minWidth: 36, paddingHorizontal: 8, height: 32, borderRadius: 16, backgroundColor: '#f1f2f6', justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 8 },
    scoreBubbleText: { fontSize: 13, fontWeight: 'bold', color: '#2c3e50' },
    midtermScore: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginTop: 4 },
    finalScore: { fontSize: 16, fontWeight: 'bold', color: '#2980b9', marginTop: 4 },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#bdc3c7', marginTop: 10, fontSize: 16 },
    loadingWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    loadingText: { marginTop: 12, fontSize: 14, fontWeight: '500' }
});
