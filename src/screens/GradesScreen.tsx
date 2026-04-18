import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { academicApi, schoolsApi } from '../services/api';
import { getCurrentStudentId, getCurrentSchoolId } from '../services/userHelper';

const { width } = Dimensions.get('window');

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

export default function GradesScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState<SubjectReport[]>([]);
    const [totalGPA, setTotalGPA] = useState(0);
    const [semester, setSemester] = useState('SEMESTER_1');
    const [academicYearName, setAcademicYearName] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const studentId = await getCurrentStudentId();
            const schoolId = await getCurrentSchoolId();
            
            if (!studentId || !schoolId) {
                console.warn('[Grades] Missing studentId or schoolId');
                setLoading(false);
                return;
            }

            // 1. Lấy năm học hiện tại
            let academicYearId = '';
            try {
                const yearRes = await schoolsApi.getCurrentAcademicYear(schoolId);
                const yearData = yearRes.data.data;
                academicYearId = yearData.id;
                setAcademicYearName(yearData.name);
            } catch (err) {
                console.error('[Grades] Error fetching academic year:', err);
                // Fallback hoặc báo lỗi
            }

            if (academicYearId) {
                // 2. Lấy báo cáo điểm
                const reportRes = await academicApi.getGradeReport(studentId, academicYearId, semester);
                const reportData = reportRes.data.data;
                
                setSubjects(reportData.subjects || []);
                setTotalGPA(reportData.gpa || 0);
            }
        } catch (error) {
            console.error('[Grades] Error fetching grades report:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRank = (gpa: number) => {
        if (gpa >= 8.0) return { title: 'Học lực: Giỏi', color: '#27ae60', icon: 'trending-up' };
        if (gpa >= 6.5) return { title: 'Học lực: Khá', color: '#f39c12', icon: 'trending-flat' };
        if (gpa >= 5.0) return { title: 'Học lực: TB', color: '#e67e22', icon: 'trending-flat' };
        return { title: 'Học lực: Yếu', color: '#e74c3c', icon: 'trending-down' };
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b5998" />
            </View>
        );
    }

    const rank = getRank(totalGPA);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kết quả học tập</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* GPA Summary Card */}
                <LinearGradient
                    colors={['#3498db', '#2980b9']}
                    style={styles.summaryCard}
                >
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
                    <Ionicons name="book-outline" size={20} color="#3b5998" />
                    <Text style={styles.sectionTitle}>Bảng điểm chi tiết</Text>
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
                            <View key={index} style={styles.subjectCard}>
                                <View style={styles.subjectHeader}>
                                    <View>
                                        <Text style={styles.subjectName}>{subject.subjectName}</Text>
                                        <Text style={{ fontSize: 12, color: '#7f8c8d' }}>Học kỳ: {semester === 'SEMESTER_1' ? 'I' : 'II'}</Text>
                                    </View>
                                    <Text style={styles.subjectAvg}>TB: {subject.average.toFixed(1)}</Text>
                                </View>

                                <View style={styles.scoreRow}>
                                    <Text style={styles.scoreLabel}>Điểm TX:</Text>
                                    <View style={styles.scoreList}>
                                        {regularScores.length > 0 ? regularScores.map((s, i) => (
                                            <View key={i} style={styles.scoreBubble}>
                                                <Text style={styles.scoreBubbleText}>{s.score}</Text>
                                            </View>
                                        )) : <Text style={{ color: '#ccc' }}>-</Text>}
                                    </View>
                                </View>

                                <View style={styles.scoreRow}>
                                    <Text style={styles.scoreLabel}>Giữa kỳ:</Text>
                                    <View style={styles.scoreList}>
                                        <Text style={styles.midtermScore}>{midtermScore ? midtermScore.score : '-'}</Text>
                                    </View>
                                </View>

                                <View style={styles.scoreRow}>
                                    <Text style={styles.scoreLabel}>Cuối kỳ:</Text>
                                    <View style={styles.scoreList}>
                                        <Text style={styles.finalScore}>{finalScore ? finalScore.score : '-'}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
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
        paddingHorizontal: 15, 
        height: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#2c3e50' },
    scrollContent: { padding: 20 },
    summaryCard: {
        borderRadius: 24,
        padding: 25,
        marginBottom: 25,
    },
    summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    gpaContainer: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 10 },
    gpaValue: { color: 'white', fontSize: 56, fontWeight: 'bold' },
    gpaMax: { color: 'rgba(255,255,255,0.7)', fontSize: 20, fontWeight: '600', marginBottom: 10, marginLeft: 8 },
    badgeRow: { flexDirection: 'row', marginTop: 10 },
    badge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 12, 
        paddingVertical: 8, 
        borderRadius: 12 
    },
    badgeText: { color: 'white', fontSize: 13, fontWeight: '700', marginLeft: 6 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginLeft: 5 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginLeft: 10 },
    subjectCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
    subjectName: { fontSize: 17, fontWeight: 'bold', color: '#2c3e50' },
    subjectAvg: { fontSize: 15, fontWeight: '700', color: '#27ae60' },
    scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    scoreLabel: { fontSize: 14, color: '#7f8c8d', width: 80 },
    scoreList: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, alignItems: 'center' },
    scoreBubble: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#f1f2f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginBottom: 5,
    },
    scoreBubbleText: { fontSize: 13, fontWeight: 'bold', color: '#2c3e50' },
    midtermScore: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
    finalScore: { fontSize: 16, fontWeight: 'bold', color: '#2980b9' },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#bdc3c7', marginTop: 10, fontSize: 16 }
});
