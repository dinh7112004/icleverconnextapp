import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import apiClient, { scheduleApi, academicApi } from '../services/api';
import { getCurrentUser } from '../services/userHelper';
import { useTheme } from '../context/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

export default function TimetableScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();
    const [viewType, setViewType] = useState<'daily' | 'weekly'>('daily');
    const [selectedDay, setSelectedDay] = useState(() => {
        const dayIndex = new Date().getDay();
        if (dayIndex === 0 || dayIndex === 6) return 'Thứ 2';
        return `Thứ ${dayIndex + 1}`;
    });
    const [timetable, setTimetable] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const SUBJECT_COLORS: Record<string, string> = {
        'Toán học': '#2ecc71', 'Ngữ văn': '#e67e22', 'Tiếng Anh': '#9b59b6', 'Vật lý': '#3498db',
        'Hóa học': '#f1c40f', 'Sinh học': '#27ae60', 'Lịch sử': '#d35400', 'Địa lý': '#16a085',
        'GDCD': '#7f8c8d', 'Tin học': '#2c3e50', 'Thể dục': '#ff4757', 'Âm nhạc': '#ff9f43', 'Mỹ thuật': '#ee5253',
    };

    const loadInitialData = async () => {
        const cacheKey = 'timetable_cache';
        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                setTimetable(JSON.parse(cached));
                setLoading(false);
            }

            const user = await getCurrentUser();
            const classId = user?.classId;
            const schoolId = user?.schoolId;
            if (!classId || !schoolId) {
                setLoading(false);
                return;
            }

            // 1. Lấy dữ liệu thô từ danh sách tổng
            const response = await scheduleApi.getSchedulesByClass(classId);
            let rawData = [];
            if (response.data?.success) {
                const dataPayload = response.data.data;
                rawData = Array.isArray(dataPayload) ? dataPayload : (dataPayload?.data || []);
            }

            // 2. Nếu rỗng hoặc thiếu, dùng API timetable gom nhóm
            if (rawData.length < 5) {
                 try {
                     // Lấy năm học hiện tại chuẩn xác
                     const schoolId = user.schoolId || (rawData[0]?.schoolId);
                     let yearId = 'current';
                     if (schoolId) {
                         const yearRes = await academicApi.getGradeReport(user.id, '', ''); // Placeholder or specific API
                         // Tìm năm học thực tế
                         const currentYearRes = await apiClient.get(`/schools/academic-years/list?schoolId=${schoolId}`);
                         if (currentYearRes.data?.success && currentYearRes.data.data.length > 0) {
                             yearId = currentYearRes.data.data[0].id;
                         }
                     }

                     const timetableRes = await scheduleApi.getTimetable(classId, yearId, 'semester_1');
                     if (timetableRes.data?.success) {
                         const tt = timetableRes.data.data.timetable;
                         const converted: any[] = [];
                         Object.keys(tt).forEach(day => {
                             tt[day].forEach((item: any) => {
                                 converted.push({ ...item, dayOfWeek: day });
                             });
                         });
                         rawData = converted;
                     }
                 } catch (apiErr) {
                     console.error('Lỗi khi lấy timetable phụ:', apiErr);
                 }
            }

            const formattedData = transformScheduleData(rawData);
            setTimetable(formattedData);
            await AsyncStorage.setItem(cacheKey, JSON.stringify(formattedData));
        } catch (error) {
            console.error('Lỗi Timetable API:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadInitialData(); }, []);

    const transformScheduleData = (rawData: any[]) => {
        const daysMap: Record<string, string> = {
            'monday': 'Thứ 2', 'tuesday': 'Thứ 3', 'wednesday': 'Thứ 4', 'thursday': 'Thứ 5', 'friday': 'Thứ 6'
        };

        const formatted = DAYS.map(day => ({
            dayOfWeek: day,
            lessons: new Array(10).fill(null)
        }));

        rawData.forEach(item => {
            const viDay = daysMap[item.dayOfWeek?.toLowerCase()];
            const dayObj = formatted.find(d => d.dayOfWeek === viDay);
            const period = parseInt(item.period);
            if (dayObj && period >= 1 && period <= 10) {
                dayObj.lessons[period - 1] = {
                    ...item,
                    period: period,
                    startTime: item.startTime?.substring(0, 5),
                    endTime: item.endTime?.substring(0, 5)
                };
            }
        });
        return formatted;
    };

    const renderDailyView = () => {
        const currentDayData = timetable.find(d => d.dayOfWeek === selectedDay);
        if (!currentDayData) return null;

        const morningLessons = currentDayData.lessons.slice(0, 5);
        const afternoonLessons = currentDayData.lessons.slice(5, 10).filter((l: any) => l !== null);

        return (
            <ScrollView style={styles.dailyScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.dailyHeader}>
                    <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                    <Text style={[styles.dailyHeaderTitle, { color: theme.text }]}>Lịch học {selectedDay}</Text>
                </View>
                
                {/* Morning Section - Always 5 slots */}
                {morningLessons.map((lesson: any, index: number) => {
                    const periodNum = index + 1;
                    // Tìm môn học thực sự tương ứng với tiết này
                    const actualLesson = morningLessons.find((l: any) => l?.period === periodNum) || lesson;
                    const color = actualLesson ? (SUBJECT_COLORS[actualLesson.subjectName || actualLesson.subject?.name] || theme.primary) : theme.border;
                    
                    return (
                        <View key={`morning-${periodNum}`} style={styles.lessonItem}>
                            <View style={styles.timelineContainer}>
                                <View style={[styles.timelineCircle, { borderColor: color, backgroundColor: theme.surface }]}>
                                    <Text style={[styles.timelineIndex, { color: color }]}>{periodNum}</Text>
                                </View>
                                <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                            </View>
                            <View style={[styles.lessonCard, { backgroundColor: theme.surface, borderColor: isDark ? '#334155' : '#f1f5f9' }]}>
                                <View style={styles.lessonMain}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.subjectName, { color: actualLesson ? theme.text : theme.textSecondary, fontStyle: actualLesson ? 'normal' : 'italic' }]}>
                                            {actualLesson?.subjectName || actualLesson?.subject?.name || 'Trống'}
                                        </Text>
                                        <View style={styles.teacherRow}>
                                            <Ionicons name="person-outline" size={14} color={theme.textSecondary} />
                                            <Text style={[styles.teacherName, { color: theme.textSecondary }]}>
                                                GV: {actualLesson?.teacherName || actualLesson?.teacher?.fullName || '---'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.timeBadge, { backgroundColor: isDark ? '#1E293B' : '#f8fafc', borderColor: theme.border }]}>
                                        <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                                        <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                                            {actualLesson?.startTime || '--:--'} - {actualLesson?.endTime || '--:--'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    );
                })}

                {afternoonLessons.length > 0 && (
                    <>
                        <View style={styles.afternoonDivider}>
                            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                            <Text style={[styles.afternoonTitle, { color: theme.textSecondary }]}>BUỔI CHIỀU</Text>
                            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                        </View>
                        {afternoonLessons.map((lesson: any) => {
                            const color = SUBJECT_COLORS[lesson.subject?.name] || theme.primary;
                            return (
                                <View key={`afternoon-${lesson.period}`} style={styles.afternoonItem}>
                                    <View style={[styles.lessonCard, { backgroundColor: theme.surface, borderColor: isDark ? '#334155' : '#f1f5f9', marginLeft: 0 }]}>
                                        <View style={styles.lessonMain}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.subjectName, { color: theme.text }]}>{lesson?.subject?.name}</Text>
                                                <View style={styles.teacherRow}>
                                                    <Ionicons name="person-outline" size={14} color={theme.textSecondary} />
                                                    <Text style={[styles.teacherName, { color: theme.textSecondary }]}>GV: {lesson?.teacher?.fullName}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        );
    };

    const renderWeeklyView = () => (
        <ScrollView horizontal style={[styles.weeklyScroll, { backgroundColor: theme.background }]} showsHorizontalScrollIndicator={false}>
            <View>
                <View style={[styles.gridHeader, { borderBottomColor: theme.border }]}>
                    <View style={[styles.gridCell, styles.headerCell, { width: 60, backgroundColor: isDark ? '#1E293B' : '#f1f5ff', borderRightColor: theme.border }]}>
                        <Text style={[styles.headerText, { color: theme.primary }]}>Tiết</Text>
                    </View>
                    {DAYS.map(day => (
                        <View key={day} style={[styles.gridCell, styles.headerCell, { backgroundColor: isDark ? '#1E293B' : '#f1f5ff', borderRightColor: theme.border }]}>
                            <Text style={[styles.headerText, { color: theme.primary }]}>{day}</Text>
                        </View>
                    ))}
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={[styles.periodSection, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.periodText, { color: theme.textSecondary }]}>BUỔI SÁNG</Text>
                    </View>
                    {[1, 2, 3, 4, 5].map((period: number) => (
                        <View key={period} style={[styles.gridRow, { borderBottomColor: theme.border }]}>
                            <View style={[styles.gridCell, { width: 60, borderRightColor: theme.border }]}>
                                <Text style={[styles.periodIndex, { color: theme.textSecondary }]}>{period}</Text>
                            </View>
                            {DAYS.map(day => {
                                const lesson = timetable.find(d => d.dayOfWeek === day)?.lessons[period - 1];
                                return (
                                    <View key={day} style={[styles.gridCell, { borderRightColor: theme.border }]}>
                                        <Text style={[styles.gridSubject, { color: theme.text }]} numberOfLines={1}>{lesson?.subject?.name || '-'}</Text>
                                        <Text style={[styles.gridTeacher, { color: theme.textSecondary }]} numberOfLines={1}>{lesson?.teacher?.fullName || ''}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                    <View style={[styles.lunchSection, { backgroundColor: isDark ? '#1E293B' : '#f8fafe' }]}><Text style={[styles.lunchText, { color: theme.textSecondary }]}>NGHỈ TRƯA</Text></View>
                    {[6, 7, 8, 9, 10].some(p => DAYS.some(d => timetable.find(td => td.dayOfWeek === d)?.lessons[p-1])) && (
                        <>
                            <View style={[styles.periodSection, { backgroundColor: theme.surface }]}><Text style={[styles.periodText, { color: theme.textSecondary }]}>BUỔI CHIỀU</Text></View>
                            {[6, 7, 8, 9, 10].map((period: number) => (
                                <View key={period} style={[styles.gridRow, { borderBottomColor: theme.border }]}>
                                    <View style={[styles.gridCell, { width: 60, borderRightColor: theme.border }]}>
                                        <Text style={[styles.periodIndex, { color: theme.textSecondary }]}></Text>
                                    </View>
                                    {DAYS.map(day => {
                                        const lesson = timetable.find(d => d.dayOfWeek === day)?.lessons[period - 1];
                                        return (
                                            <View key={day} style={[styles.gridCell, { borderRightColor: theme.border }]}>
                                                <Text style={[styles.gridSubject, { color: theme.text }]} numberOfLines={1}>{lesson?.subject?.name || '-'}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            ))}
                        </>
                    )}
                </ScrollView>
            </View>
        </ScrollView>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.screenTitle, { color: theme.text }]}>Thời khóa biểu</Text>
                <View style={[styles.toggleContainer, { backgroundColor: isDark ? '#1E293B' : '#f1f2f6' }]}>
                    <TouchableOpacity style={[styles.toggleBtn, viewType === 'daily' && [styles.activeToggle, { backgroundColor: theme.surface }]]} onPress={() => setViewType('daily')}>
                        <Ionicons name="list" size={20} color={viewType === 'daily' ? theme.primary : theme.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleBtn, viewType === 'weekly' && [styles.activeToggle, { backgroundColor: theme.surface }]]} onPress={() => setViewType('weekly')}>
                        <Ionicons name="grid-outline" size={18} color={viewType === 'weekly' ? theme.primary : theme.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {viewType === 'daily' && (
                <View style={styles.daysBarContainer}>
                    <View style={[styles.daysBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        {DAYS.map(day => (
                            <TouchableOpacity
                                key={day}
                                style={[styles.dayTab, selectedDay === day && [styles.activeDayTab, { backgroundColor: theme.primary }]]}
                                onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    setSelectedDay(day);
                                }}
                            >
                                <Text style={[styles.dayTabText, { color: theme.textSecondary }, selectedDay === day && { color: 'white' }]}>{day}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <View style={styles.content}>
                {loading ? <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text style={{color: theme.text}}>Đang tải...</Text></View> : (viewType === 'daily' ? renderDailyView() : renderWeeklyView())}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1 },
    screenTitle: { fontSize: 18, fontWeight: '800', flex: 1, marginLeft: 15 },
    toggleContainer: { flexDirection: 'row', borderRadius: 10, padding: 4 },
    toggleBtn: { padding: 8, borderRadius: 8 },
    activeToggle: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    daysBarContainer: { paddingHorizontal: 20, marginTop: 20 },
    daysBar: { flexDirection: 'row', borderRadius: 15, padding: 5, borderWidth: 1 },
    dayTab: { flex: 1, paddingVertical: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
    activeDayTab: {},
    dayTabText: { fontSize: 14, fontWeight: '600' },
    content: { flex: 1 },
    dailyScroll: { paddingHorizontal: 20, paddingTop: 20 },
    dailyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    dailyHeaderTitle: { fontSize: 18, fontWeight: '700', marginLeft: 12 },
    lessonItem: { flexDirection: 'row', minHeight: 110 },
    afternoonItem: { marginBottom: 5 },
    timelineContainer: { width: 50, alignItems: 'center' },
    timelineCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, justifyContent: 'center', alignItems: 'center', zIndex: 2, marginTop: 5 },
    timelineIndex: { fontWeight: '700', fontSize: 16 },
    timelineLine: { width: 2, flex: 1, marginVertical: -5 },
    lessonCard: { flex: 1, borderRadius: 20, padding: 18, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1 },
    lessonMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    subjectName: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
    timeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
    timeText: { fontSize: 12, fontWeight: '600', marginLeft: 5 },
    teacherRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    teacherName: { fontSize: 14, marginLeft: 6, fontWeight: '500' },
    afternoonDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
    dividerLine: { flex: 1, height: 1 },
    afternoonTitle: { marginHorizontal: 15, fontSize: 13, fontWeight: '800', letterSpacing: 2 },
    weeklyScroll: { flex: 1 },
    gridHeader: { flexDirection: 'row', borderBottomWidth: 1 },
    gridRow: { flexDirection: 'row', borderBottomWidth: 1 },
    gridCell: { width: 110, minHeight: 85, justifyContent: 'center', alignItems: 'center', padding: 8, borderRightWidth: 1 },
    headerCell: { height: 60 },
    headerText: { fontWeight: '800', fontSize: 14 },
    periodIndex: { fontWeight: '800', fontSize: 16 },
    gridSubject: { fontWeight: '700', fontSize: 13, textAlign: 'center', marginBottom: 4 },
    gridTeacher: { fontSize: 10, fontWeight: '500' },
    periodSection: { paddingVertical: 15, alignItems: 'center' },
    periodText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
    lunchSection: { height: 50, justifyContent: 'center', alignItems: 'center' },
    lunchText: { fontSize: 12, fontWeight: '800', letterSpacing: 3 }
});
