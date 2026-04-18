import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { tuitionApi } from '../services/api';
import { getCurrentStudentId } from '../services/userHelper';

const formatMoney = (amount: number) =>
    amount.toLocaleString('vi-VN') + ' đ';

export default function TuitionScreen({ navigation }: any) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const studentId = await getCurrentStudentId();
                if (!studentId) return;
                const res = await tuitionApi.get(studentId);
                setData(res.data.data);
            } catch (err) {
                console.error('TuitionScreen error:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);


    if (loading || !data) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#e97e37" /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Học phí</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                {/* Orange total banner */}
                <LinearGradient
                    colors={['#f9a03f', '#e84118']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.banner}
                >
                    <Text style={styles.bannerLabel}>TỔNG TIỀN CẦN ĐÓNG</Text>
                    <Text style={styles.bannerAmount}>{formatMoney(data.totalDue)}</Text>
                    <Text style={styles.bannerDeadline}>Hạn chốt: {data.deadline}</Text>
                </LinearGradient>

                {/* Section title */}
                <View style={styles.sectionRow}>
                    <Ionicons name="card-outline" size={20} color="#3b5998" />
                    <Text style={styles.sectionTitle}>Danh sách khoản thu</Text>
                </View>

                {/* Items */}
                <View style={styles.listContainer}>
                    {data.items.map((item: any, i: number) => (
                        <View
                            key={item.id}
                            style={[styles.feeCard, i === data.items.length - 1 && { marginBottom: 0 }]}
                        >
                            {/* Top row: name + amount */}
                            <View style={styles.feeTopRow}>
                                <Text style={styles.feeName}>{item.name}</Text>
                                <Text style={styles.feeAmount}>{formatMoney(item.amount)}</Text>
                            </View>

                            {/* Period pill */}
                            <View style={styles.periodPill}>
                                <Text style={styles.periodText}>{item.period}</Text>
                            </View>

                            {/* Divider */}
                            <View style={styles.divider} />

                            {/* Bottom row: due date + status */}
                            <View style={styles.feeBottomRow}>
                                <Text style={styles.dueDateText}>Hạn: {item.dueDate}</Text>
                                {item.status === 'paid' ? (
                                    <View style={styles.badgePaid}>
                                        <Ionicons name="checkmark-circle-outline" size={14} color="#27ae60" />
                                        <Text style={styles.badgePaidText}>Đã đóng</Text>
                                    </View>
                                ) : (
                                    <View style={styles.badgeUnpaid}>
                                        <Ionicons name="alert-circle-outline" size={14} color="#e97e37" />
                                        <Text style={styles.badgeUnpaidText}>Chưa đóng</Text>
                                    </View>
                                )}
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
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, height: 60, backgroundColor: 'white',
        borderBottomWidth: 1, borderBottomColor: '#eee'
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },

    banner: {
        marginHorizontal: 16, marginTop: 18, marginBottom: 24,
        borderRadius: 20, paddingHorizontal: 22, paddingVertical: 24,
    },
    bannerLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
    bannerAmount: { color: 'white', fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
    bannerDeadline: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },

    sectionRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 14 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginLeft: 10 },

    listContainer: { marginHorizontal: 16, gap: 12 },

    feeCard: {
        backgroundColor: 'white', borderRadius: 16, padding: 18,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    feeTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    feeName: { fontSize: 15, fontWeight: 'bold', color: '#2c3e50', flex: 1, marginRight: 10 },
    feeAmount: { fontSize: 15, fontWeight: 'bold', color: '#2980b9' },

    periodPill: {
        alignSelf: 'flex-start', backgroundColor: '#f1f2f6',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14
    },
    periodText: { fontSize: 12, color: '#7f8c8d', fontWeight: '500' },

    divider: { height: 1, backgroundColor: '#f1f2f6', marginBottom: 14 },

    feeBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dueDateText: { fontSize: 13, color: '#95a5a6' },

    badgePaid: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#e8f5e9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20
    },
    badgePaidText: { fontSize: 13, fontWeight: 'bold', color: '#27ae60' },

    badgeUnpaid: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#fff3e0', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
        borderWidth: 1, borderColor: '#f9a03f'
    },
    badgeUnpaidText: { fontSize: 13, fontWeight: 'bold', color: '#e97e37' },
});
