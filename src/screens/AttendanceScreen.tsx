import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { academicApi } from '../services/api';
import { getCurrentStudentId } from '../services/userHelper';

export default function AttendanceScreen({ navigation }: any) {
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const studentId = await getCurrentStudentId();
                if (!studentId) { setLoading(false); return; }
                const response = await academicApi.getAttendance(studentId);
                const rawData = response.data.data || [];
                
                // Map real API data to component structure
                const mappedData = rawData.map((item: any) => {
                    const dateObj = new Date(item.date);
                    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                    return {
                        ...item,
                        status: item.status.toLowerCase(), // Convert PRESENT -> present
                        date: dateObj.toLocaleDateString('vi-VN'),
                        dayName: days[dateObj.getDay()]
                    };
                });
                
                setAttendanceData(mappedData);
            } catch (error) {
                console.error('Error fetching attendance:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b5998" />
            </View>
        );
    }

    const presentCount = attendanceData.filter(item => item.status === 'present').length;
    const excusedCount = attendanceData.filter(item => item.status === 'excused').length;
    const absentCount = attendanceData.filter(item => item.status === 'absent').length;

    const renderStatusBadge = (status: string) => {
        if (status === 'present') {
            return (
                <View style={[styles.badge, { backgroundColor: '#e8f5e9' }]}>
                    <Ionicons name="checkmark-circle-outline" size={14} color="#27ae60" />
                    <Text style={[styles.badgeText, { color: '#27ae60' }]}>Có mặt</Text>
                </View>
            );
        } else if (status === 'excused') {
            return (
                <View style={[styles.badge, { backgroundColor: '#fff3e0' }]}>
                    <Ionicons name="alert-circle-outline" size={14} color="#f39c12" />
                    <Text style={[styles.badgeText, { color: '#f39c12' }]}>Có phép</Text>
                </View>
            );
        } else {
            return (
                <View style={[styles.badge, { backgroundColor: '#ffebee' }]}>
                    <Ionicons name="close-circle-outline" size={14} color="#e74c3c" />
                    <Text style={[styles.badgeText, { color: '#e74c3c' }]}>Vắng</Text>
                </View>
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Điểm danh tháng 9</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: '#27ae60' }]}>{presentCount}</Text>
                        <Text style={styles.statLabel}>Đi học</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: '#f39c12' }]}>{excusedCount}</Text>
                        <Text style={styles.statLabel}>Có phép</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: '#e74c3c' }]}>{absentCount}</Text>
                        <Text style={styles.statLabel}>Không phép</Text>
                    </View>
                </View>

                {/* Section Title */}
                <View style={styles.sectionTitleRow}>
                    <Ionicons name="calendar-outline" size={20} color="#34495e" />
                    <Text style={styles.sectionTitle}>Chi tiết điểm danh</Text>
                </View>

                {/* Detail List */}
                <View style={styles.listContainer}>
                    {attendanceData.map((item, index) => (
                        <View 
                            key={index} 
                            style={[
                                styles.listItem, 
                                index === attendanceData.length - 1 ? { borderBottomWidth: 0 } : {}
                            ]}
                        >
                            <View style={styles.itemLeft}>
                                <Text style={styles.itemDate}>{item.dayName}, {item.date}</Text>
                                {item.note ? <Text style={styles.itemNote}>{item.note}</Text> : null}
                            </View>
                            <View style={styles.itemRight}>
                                {renderStatusBadge(item.status)}
                            </View>
                        </View>
                    ))}
                </View>
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
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    scrollContent: { padding: 20 },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25
    },
    statCard: {
        backgroundColor: 'white',
        borderRadius: 15,
        paddingVertical: 15,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f2f6'
    },
    statNumber: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
    statLabel: { fontSize: 12, color: '#7f8c8d' },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#34495e', marginLeft: 10 },
    listContainer: {
        backgroundColor: 'white',
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingTop: 5,
        paddingBottom: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f2f6'
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6'
    },
    itemLeft: { flex: 1 },
    itemDate: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
    itemNote: { fontSize: 12, color: '#95a5a6', marginTop: 4 },
    itemRight: { marginLeft: 15 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20
    },
    badgeText: { fontSize: 12, fontWeight: 'bold', marginLeft: 4 }
});
