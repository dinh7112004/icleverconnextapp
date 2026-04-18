import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { academicApi } from '../services/api';
import { getCurrentClassId } from '../services/userHelper';

export default function CurriculumScreen({ route, navigation }: any) {
    const { subjectId, subjectName } = route.params;
    const [lessons, setLessons] = useState<any[]>([]);
    const [courseId, setCourseId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [noCourse, setNoCourse] = useState(false);

    useEffect(() => {
        fetchLessons();
    }, []);

    const fetchLessons = async () => {
        try {
            const classId = await getCurrentClassId();
            
            // Bước 1: Tìm Course thuộc Subject này và Class này
            const courseRes = await academicApi.getCoursesBySubject(subjectId, classId);
            const courses = courseRes.data?.data || courseRes.data || [];


            if (!courses || courses.length === 0) {
                setNoCourse(true);
                return;
            }

            // Lấy course đầu tiên (hoặc course đã publish)
            const course = courses.find((c: any) => c.status === 'published') || courses[0];
            setCourseId(course._id);

            // Bước 2: Lấy danh sách bài học của Course đó
            const lessonRes = await academicApi.getLessons(course._id);
            const lessonData = lessonRes.data?.data || lessonRes.data || [];
            setLessons(Array.isArray(lessonData) ? lessonData : []);
        } catch (error) {
            console.error('Error fetching lessons:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{subjectName}</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.subNav}>
                <Text style={styles.subNavText}>CHƯƠNG TRÌNH HỌC</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 50 }} />
                ) : noCourse ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="folder-open-outline" size={64} color="#bdc3c7" />
                        <Text style={styles.emptyText}>Chưa có khóa học nào cho môn này</Text>
                    </View>
                ) : lessons.length > 0 ? (
                    lessons.map((lesson, index) => (
                        <TouchableOpacity 
                            key={lesson._id} 
                            style={styles.lessonCard}
                            onPress={() => navigation.navigate('LessonDetail', { 
                                lessonId: lesson._id, 
                                courseId: lesson.courseId, // Truyền thêm courseId
                                title: lesson.title 
                            })}
                        >
                            <View style={styles.lessonIcon}>
                                <View style={styles.circleOuter}>
                                    <View style={styles.circleInner} />
                                </View>
                            </View>
                            <View style={styles.lessonInfo}>
                                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                                <View style={styles.metaRow}>
                                    <View style={styles.metaBadge}>
                                        <Ionicons name="hourglass-outline" size={14} color="#7f8c8d" />
                                        {/* Lấy estimatedMinutes từ backend thay vì duration */}
                                        <Text style={styles.metaText}>{lesson.estimatedMinutes} phút</Text>
                                    </View>
                                    <View style={[styles.metaBadge, { backgroundColor: '#fff9db' }]}>
                                        <Ionicons name="eye-outline" size={14} color="#f1c40f" />
                                        {/* Dùng viewCount từ backend thay cho coinsReward (mock) */}
                                        <Text style={[styles.metaText, { color: '#f39c12', fontWeight: 'bold' }]}>
                                            {lesson.viewCount} lượt xem
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.statusDot} />
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#bdc3c7" />
                        <Text style={styles.emptyText}>Chưa có bài học nào cho môn này</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingVertical: 15,
        backgroundColor: 'white'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    subNav: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
    subNavText: { fontSize: 13, fontWeight: 'bold', color: '#7f8c8d', letterSpacing: 0.5 },
    scrollContent: { padding: 20 },
    lessonCard: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#f1f2f6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    lessonIcon: { marginRight: 15 },
    circleOuter: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' },
    circleInner: { width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: '#3498db' },
    lessonInfo: { flex: 1 },
    lessonTitle: { fontSize: 15, fontWeight: 'bold', color: '#2c3e50', marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center' },
    metaBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#f1f2f6', 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 6,
        marginRight: 10
    },
    metaText: { fontSize: 12, color: '#7f8c8d', marginLeft: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e74c3c' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, color: '#95a5a6', fontSize: 16 }
});
