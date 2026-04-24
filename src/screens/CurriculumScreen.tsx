import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { academicApi } from '../services/api';
import { getCurrentClassId } from '../services/userHelper';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = 'curriculum_cache_';

export default function CurriculumScreen({ route, navigation }: any) {
    const { isDark, theme } = useTheme();
    const { subjectId, subjectName } = route.params;
    const [lessons, setLessons] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [noCourse, setNoCourse] = useState(false);

    const fetchLessons = useCallback(async (isRefresh = false) => {
        if (!isRefresh && lessons.length === 0) setLoading(true);
        try {
            const classId = await getCurrentClassId();
            const cacheKey = `${CACHE_KEY_PREFIX}${subjectId}_${classId}`;

            // Load from cache first
            if (!isRefresh && lessons.length === 0) {
                const cached = await AsyncStorage.getItem(cacheKey);
                if (cached) {
                    setLessons(JSON.parse(cached));
                    setLoading(false);
                }
            }
            
            const courseRes = await academicApi.getCoursesBySubject(subjectId, classId || undefined);
            const courses = courseRes.data?.data || courseRes.data || [];

            if (!courses || courses.length === 0) {
                setNoCourse(true);
                setLessons([]);
                return;
            }

            const course = courses.find((c: any) => c.status === 'published') || courses[0];
            const lessonRes = await academicApi.getLessons(course._id);
            const lessonData = lessonRes.data?.data || lessonRes.data || [];
            const finalLessons = Array.isArray(lessonData) ? lessonData : [];
            
            setLessons(finalLessons);
            setNoCourse(false);
            AsyncStorage.setItem(cacheKey, JSON.stringify(finalLessons));
        } catch (error) {
            console.error('Error fetching lessons:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [subjectId, lessons.length]);

    useEffect(() => {
        fetchLessons();
    }, [fetchLessons]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLessons(true);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{subjectName}</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={[styles.subNav, { borderBottomColor: theme.border }]}>
                <Text style={[styles.subNavText, { color: theme.textSecondary }]}>CHƯƠNG TRÌNH HỌC</Text>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading && lessons.length === 0 ? (
                    <View style={styles.centerLoading}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : noCourse ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="folder-open-outline" size={64} color={isDark ? '#2D3748' : '#bdc3c7'} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Chưa có khóa học nào cho môn này</Text>
                    </View>
                ) : lessons.length > 0 ? (
                    lessons.map((lesson) => (
                        <TouchableOpacity 
                            key={lesson._id} 
                            style={[styles.lessonCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: isDark ? '#000' : '#000' }]}
                            onPress={() => navigation.navigate('LessonDetail', { 
                                lessonId: lesson._id, 
                                courseId: lesson.courseId,
                                title: lesson.title 
                            })}
                        >
                            <View style={styles.lessonIcon}>
                                <View style={[styles.circleOuter, { backgroundColor: isDark ? '#1e3a8a' : '#e3f2fd' }]}>
                                    <View style={[styles.circleInner, { borderColor: theme.primary }]} />
                                </View>
                            </View>
                            <View style={styles.lessonInfo}>
                                <Text style={[styles.lessonTitle, { color: theme.text }]}>{lesson.title}</Text>
                                <View style={styles.metaRow}>
                                    <View style={[styles.metaBadge, { backgroundColor: isDark ? '#1E293B' : '#f1f2f6' }]}>
                                        <Ionicons name="hourglass-outline" size={14} color={theme.textSecondary} />
                                        <Text style={[styles.metaText, { color: theme.textSecondary }]}>{lesson.estimatedMinutes || 0} phút</Text>
                                    </View>
                                    <View style={[styles.metaBadge, { backgroundColor: isDark ? '#451a03' : '#fff9db' }]}>
                                        <Ionicons name="star" size={14} color={isDark ? '#fbbf24' : '#f1c40f'} />
                                        <Text style={[styles.metaText, { color: isDark ? '#fbbf24' : '#f39c12', fontWeight: 'bold' }]}>
                                            +{lesson.rewardCoins || 20}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.statusDot} />
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color={isDark ? '#2D3748' : '#bdc3c7'} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Chưa có bài học nào</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerLoading: { marginTop: 100, alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    subNav: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
    subNavText: { fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
    scrollContent: { padding: 20 },
    lessonCard: { borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderWidth: 1, elevation: 2, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    lessonIcon: { marginRight: 15 },
    circleOuter: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    circleInner: { width: 22, height: 22, borderRadius: 11, borderWidth: 3 },
    lessonInfo: { flex: 1 },
    lessonTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center' },
    metaBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 },
    metaText: { fontSize: 12, marginLeft: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e74c3c' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, fontSize: 16 }
});
