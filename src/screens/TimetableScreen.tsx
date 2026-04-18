import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Dimensions, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons, CommunityIcon } from '@expo/vector-icons';
import { scheduleApi, userApi } from '../services/api'; 
import { getCurrentUser } from '../services/userHelper';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

export default function TimetableScreen({ navigation }: any) {
    const [viewType, setViewType] = useState<'daily' | 'weekly'>('daily');
    
    const getInitialDay = () => {
        const dayIndex = new Date().getDay(); 
        if (dayIndex === 0 || dayIndex === 6) return 'Thứ 2'; 
        return `Thứ ${dayIndex + 1}`;
    };

    const [selectedDay, setSelectedDay] = useState(getInitialDay());
    const [timetable, setTimetable] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);

    const SUBJECT_COLORS: Record<string, string> = {
        'Toán học': '#2ecc71',
        'Ngữ văn': '#e67e22',
        'Tiếng Anh': '#9b59b6',
        'Vật lý': '#3498db',
        'Hóa học': '#f1c40f',
        'Sinh học': '#27ae60',
        'Lịch sử': '#d35400',
        'Địa lý': '#16a085',
        'GDCD': '#7f8c8d',
        'Tin học': '#2c3e50',
        'Thể dục': '#ff4757',
        'Âm nhạc': '#ff9f43',
        'Mỹ thuật': '#ee5253',
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            
            // Thêm một chút delay nhỏ để đảm bảo AsyncStorage đã kịp lưu dữ liệu sau khi login
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const user = await getCurrentUser();
            setUserProfile(user);
            
            // Kiểm tra classId từ Profile hoặc dùng Helper chuyên dụng
            const classId = user?.classId || '';
            console.log('[DEBUG] Thông tin User hiện tại:', JSON.stringify({
                id: user?.id,
                fullName: user?.fullName,
                role: user?.role,
                classId: user?.classId,
                className: user?.className
            }, null, 2));

            if (!classId) {
                console.warn('[DEBUG] CẢNH BÁO: classId vẫn trống sau khi login. Thử lại lần cuối...');
                // Nếu vẫn trống, có thể do cache, thử lấy lại lần cuối
                const retryUser = await getCurrentUser();
                if (!retryUser?.classId) {
                    console.error('[DEBUG] LỖI: Không thể tìm thấy classId trong bộ nhớ.');
                    setTimetable([]);
                    setLoading(false);
                    return;
                }
            }

            const response = await scheduleApi.getSchedulesByClass(classId || user?.classId || '');
            console.log('[DEBUG] API Response Status:', response.status);
            
            let rawData: any[] = [];
            if (response.data && response.data.success) {
                // Kiểm tra các định dạng data khác nhau từ NestJS (Pagination hoặc Array trực tiếp)
                const dataPayload = response.data.data;
                if (Array.isArray(dataPayload)) {
                    rawData = dataPayload;
                } else if (dataPayload && Array.isArray(dataPayload.data)) {
                    rawData = dataPayload.data;
                }
            }
            
            console.log(`[DEBUG] Thành công! Nhận được ${rawData.length} tiết học từ Server`);
            
            const formattedData = transformScheduleData(rawData);
            setTimetable(formattedData);

        } catch (error: any) {
            console.error('[DEBUG] Lỗi Fetch Timetable:', error);
            Alert.alert('Lỗi kết nối', 'Không thể lấy dữ liệu từ máy chủ. Vui lòng kiểm tra mạng.');
        } finally {
            setLoading(false);
        }
    };

    // Hàm "Phiên dịch" dữ liệu Backend sang Frontend
    const transformScheduleData = (rawData: any[]) => {
        // Map Thứ từ Backend (Enum) sang UI (String)
        const daysMap: Record<string, string> = {
            'monday': 'Thứ 2',
            'tuesday': 'Thứ 3',
            'wednesday': 'Thứ 4',
            'thursday': 'Thứ 5',
            'friday': 'Thứ 6',
        };

        // Khởi tạo khung thời khóa biểu rỗng (5 ngày, mỗi ngày 10 tiết)
        const formatted = DAYS.map(day => ({
            dayOfWeek: day,
            lessons: new Array(10).fill(null) 
        }));

        rawData.forEach(item => {
            const viDay = daysMap[item.dayOfWeek];
            const dayObj = formatted.find(d => d.dayOfWeek === viDay);
            
            if (dayObj && item.period >= 1 && item.period <= 10) {
                // Format lại giờ (VD: từ "07:30:00" thành "07:30")
                const formattedItem = {
                    ...item,
                    startTime: item.startTime ? item.startTime.substring(0, 5) : '',
                    endTime: item.endTime ? item.endTime.substring(0, 5) : '',
                };
                // Nhét môn học vào đúng vị trí tiết (Tiết 1 -> index 0, Tiết 2 -> index 1)
                dayObj.lessons[item.period - 1] = formattedItem;
            }
        });

        return formatted;
    };
    const currentDayData = timetable.find(d => d.dayOfWeek === selectedDay);

    const renderDailyView = () => {
        if (!currentDayData || currentDayData.lessons.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={64} color="#bdc3c7" />
                    <Text style={styles.emptyText}>Không có lịch học cho ngày này</Text>
                </View>
            );
        }

        return (
            <ScrollView style={styles.dailyScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.dailyHeader}>
                    <Ionicons name="calendar" size={20} color="#3b5998" />
                    <Text style={styles.dailyHeaderTitle}>Lịch học {selectedDay}</Text>
                </View>

                {currentDayData.lessons.map((lesson: any, index: number) => {
                    if (!lesson) return null;
                    const color = SUBJECT_COLORS[lesson.subject?.name] || '#3b5998';
                    return (
                        <View key={index} style={styles.lessonItem}>
                            <View style={styles.timelineContainer}>
                                <View style={[styles.timelineCircle, { borderColor: color }]}>
                                    <Text style={[styles.timelineIndex, { color: color }]}>{index + 1}</Text>
                                </View>
                                {index < currentDayData.lessons.length - 1 && <View style={styles.timelineLine} />}
                            </View>

                            <View style={[styles.lessonCard, { borderLeftWidth: 5, borderLeftColor: color }]}>
                                <View style={styles.lessonMain}>
                                    <View>
                                        <Text style={styles.subjectName}>{lesson?.subject?.name || 'Môn học'}</Text>
                                        <Text style={styles.roomText}>Phòng: {lesson?.room || 'Đang cập nhật'}</Text>
                                    </View>
                                    <View style={styles.timeBadge}>
                                        <Ionicons name="time" size={12} color="#576574" />
                                        <Text style={styles.timeText}>{lesson?.startTime} - {lesson?.endTime}</Text>
                                    </View>
                                </View>
                                <View style={styles.teacherRow}>
                                    <View style={styles.avatarMini}>
                                        <Text style={styles.avatarTxt}>{(lesson?.teacher?.fullName || 'G').charAt(0)}</Text>
                                    </View>
                                    <Text style={styles.teacherName}>{lesson?.teacher?.fullName || 'Đang cập nhật'}</Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        );
    };

    const renderWeeklyView = () => {
        return (
            <ScrollView horizontal style={styles.weeklyScroll} showsHorizontalScrollIndicator={false}>
                <View>
                    <View style={styles.gridHeader}>
                        <View style={[styles.gridCell, styles.headerCell, { width: 60 }]}>
                            <Text style={styles.headerText}>Tiết</Text>
                        </View>
                        {DAYS.map(day => (
                            <View key={day} style={[styles.gridCell, styles.headerCell]}>
                                <Text style={styles.headerText}>{day}</Text>
                            </View>
                        ))}
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.periodSection}>
                            <Ionicons name="sunny-outline" size={14} color="#e67e22" />
                            <Text style={styles.periodText}>BUỔI SÁNG</Text>
                        </View>

                        {[1, 2, 3, 4, 5].map(period => (
                            <View key={period} style={styles.gridRow}>
                                <View style={[styles.gridCell, { width: 60 }]}>
                                    <Text style={styles.periodIndex}>{period}</Text>
                                </View>
                                {DAYS.map(day => {
                                    const dayData = timetable.find(d => d.dayOfWeek === day);
                                    const lesson = dayData?.lessons[period - 1];
                                    return (
                                        <View key={day} style={styles.gridCell}>
                                            <Text style={styles.gridSubject} numberOfLines={1}>
                                                {lesson?.subject?.name || '-'}
                                            </Text>
                                            <Text style={styles.gridTeacher} numberOfLines={1}>
                                                {lesson?.teacher?.fullName || ''}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        ))}

                        <View style={styles.lunchSection}>
                            <Text style={styles.lunchText}>NGHỈ TRƯA</Text>
                        </View>

                        <View style={styles.periodSection}>
                            <Ionicons name="moon-outline" size={14} color="#3b5998" />
                            <Text style={styles.periodText}>BUỔI CHIỀU</Text>
                        </View>

                        {[6, 7, 8].map(period => (
                            <View key={period} style={styles.gridRow}>
                                <View style={[styles.gridCell, { width: 60 }]}>
                                    <Text style={styles.periodIndex}>{period}</Text>
                                </View>
                                {DAYS.map(day => (
                                    <View key={day} style={styles.gridCell}>
                                        <Text style={styles.gridSubject}>-</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b5998" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Thời khóa biểu</Text>
                <View style={styles.toggleContainer}>
                    <TouchableOpacity 
                        style={[styles.toggleBtn, viewType === 'daily' && styles.activeToggle]}
                        onPress={() => setViewType('daily')}
                    >
                        <Ionicons name="list" size={20} color={viewType === 'daily' ? '#2980b9' : '#7f8c8d'} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.toggleBtn, viewType === 'weekly' && styles.activeToggle]}
                        onPress={() => setViewType('weekly')}
                    >
                        <Ionicons name="grid-outline" size={18} color={viewType === 'weekly' ? '#2980b9' : '#7f8c8d'} />
                    </TouchableOpacity>
                </View>
            </View>

            {viewType === 'daily' && (
                <View style={styles.daysBarContainer}>
                    <View style={styles.daysBar}>
                        {DAYS.map(day => (
                            <TouchableOpacity 
                                key={day} 
                                style={[styles.dayTab, selectedDay === day && styles.activeDayTab]}
                                onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    setSelectedDay(day);
                                }}
                            >
                                <Text style={[styles.dayTabText, selectedDay === day && styles.activeDayTabText]}>{day}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <View style={styles.content}>
                {viewType === 'daily' ? renderDailyView() : renderWeeklyView()}
            </View>
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
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    screenTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', flex: 1, marginLeft: 15 },
    toggleContainer: { flexDirection: 'row', backgroundColor: '#f1f2f6', borderRadius: 8, padding: 2 },
    toggleBtn: { padding: 6, borderRadius: 6 },
    activeToggle: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    daysBarContainer: { paddingHorizontal: 20, marginTop: 15 },
    daysBar: { 
        flexDirection: 'row', 
        height: 44, 
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: '#f1f2f6'
    },
    dayTab: { 
        flex: 1,
        justifyContent: 'center', 
        alignItems: 'center', 
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    activeDayTab: { backgroundColor: '#5c7bdb' },
    dayTabText: { fontSize: 14, color: '#7f8c8d', fontWeight: '500' },
    activeDayTabText: { color: 'white' },
    content: { flex: 1 },
    dailyScroll: { padding: 20 },
    dailyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    dailyHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginLeft: 10 },
    lessonItem: { flexDirection: 'row', marginBottom: 5 },
    timelineContainer: { width: 40, alignItems: 'center' },
    timelineCircle: { 
        width: 32, 
        height: 32, 
        borderRadius: 16, 
        backgroundColor: 'white', 
        borderWidth: 2, 
        borderColor: '#5c7bdb',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1
    },
    timelineIndex: { color: '#5c7bdb', fontWeight: 'bold', fontSize: 14 },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#eee', marginTop: -2 },
    lessonCard: { 
        flex: 1, 
        backgroundColor: 'white', 
        borderRadius: 15, 
        padding: 15, 
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    lessonMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    subjectName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
    timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    timeText: { fontSize: 11, color: '#7f8c8d', marginLeft: 4 },
    teacherRow: { flexDirection: 'row', alignItems: 'center' },
    teacherName: { fontSize: 13, color: '#7f8c8d', marginLeft: 6 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { marginTop: 15, color: '#bdc3c7', fontSize: 14 },

    // Weekly Styles
    weeklyScroll: { flex: 1, backgroundColor: 'white' },
    gridHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
    gridRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
    gridCell: { width: 100, minHeight: 70, justifyContent: 'center', alignItems: 'center', padding: 5, borderRightWidth: 1, borderRightColor: '#f1f2f6' },
    headerCell: { height: 50, backgroundColor: '#f1f5ff', borderRightColor: '#fff' },
    headerText: { fontWeight: 'bold', color: '#3b5998', fontSize: 14 },
    periodIndex: { fontWeight: 'bold', color: '#7f8c8d' },
    gridSubject: { fontWeight: 'bold', color: '#2c3e50', fontSize: 13, marginBottom: 2 },
    gridTeacher: { color: '#7f8c8d', fontSize: 10 },
    periodSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: '#fcfcfc' },
    periodText: { fontSize: 11, fontWeight: 'bold', color: '#576574', marginLeft: 6, letterSpacing: 1 },
    lunchSection: { height: 40, backgroundColor: '#f8fafe', justifyContent: 'center', alignItems: 'center' },
    lunchText: { fontSize: 11, fontWeight: 'bold', color: '#bdc3c7', letterSpacing: 2 },
    roomText: { fontSize: 12, color: '#8395a7', marginTop: 2 },
    avatarMini: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#f1f2f6', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    avatarTxt: { fontSize: 10, color: '#3b5998', fontWeight: 'bold' }
});
