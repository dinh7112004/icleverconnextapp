import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, TextInput, FlatList,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { medicineApi } from '../services/api';
import { getCurrentStudentId } from '../services/userHelper';

type ViewMode = 'list' | 'create';

export default function MedicineInstructionScreen({ navigation }: any) {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [instructions, setInstructions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [time, setTime] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        fetchInstructions();
    }, []);

    const fetchInstructions = async () => {
        try {
            setLoading(true);
            const studentId = await getCurrentStudentId();
            if (!studentId) { setLoading(false); return; }
            const response = await medicineApi.getAll(studentId);
            setInstructions(response.data.data || []);
        } catch (error) {
            console.error('Error fetching instructions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (viewMode === 'create') {
            setViewMode('list');
        } else {
            navigation.goBack();
        }
    };

    const handleSubmit = async () => {
        if (!name || !dosage || !time) return;
        
        try {
            setLoading(true);
            const studentId = await getCurrentStudentId();
            if (!studentId) return;
            const newInstruction = {
                studentId,
                name,
                dosage,
                time,
                note,
                date: new Date().toISOString().split('T')[0],
            };
            await medicineApi.submit(newInstruction);
            await fetchInstructions();
            setViewMode('list');
            setName('');
            setDosage('');
            setTime('');
            setNote('');
        } catch (error) {
            console.error('Error submitting instruction:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderHistoryItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="pill" size={24} color="#009688" />
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.medName}>{item.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: item.status === 'Đã uống' ? '#e8f5e9' : '#fff8e1' }]}>
                            <Text style={[styles.statusText, { color: item.status === 'Đã uống' ? '#2e7d32' : '#fbc02d' }]}>
                                {item.status}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.medInfoRow}>
                        <Text style={styles.infoLabel}>Liều: <Text style={styles.infoValue}>{item.dosage}</Text></Text>
                        <View style={styles.timeTag}>
                            <Ionicons name="time-outline" size={14} color="#7f8c8d" />
                            <Text style={styles.timeText}>{item.time}</Text>
                        </View>
                    </View>
                </View>
            </View>
            <Text style={styles.dateText}>Ngày: {item.date}</Text>
        </View>
    );

    const renderListView = () => (
        <View style={styles.content}>
            <Text style={styles.sectionTitle}>LỊCH SỬ DẶN THUỐC</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#009688" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={instructions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderHistoryItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="pill-off" size={60} color="#ddd" />
                            <Text style={styles.emptyText}>Chưa có dặn thuốc nào</Text>
                        </View>
                    }
                />
            )}
        </View>
    );

    const renderCreateView = () => (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.formCard}>
                <Text style={styles.formTitle}>Tạo phiếu dặn thuốc</Text>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tên thuốc</Text>
                    <TextInput 
                        style={styles.input}
                        placeholder="Ví dụ: Thuốc ho Prospan"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Liều lượng</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder="VD: 5ml"
                            value={dosage}
                            onChangeText={setDosage}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Giờ uống</Text>
                        <View style={styles.timeInputContainer}>
                            <TextInput 
                                style={[styles.input, { flex: 1, borderBottomWidth: 0 }]}
                                placeholder="--:-- --"
                                value={time}
                                onChangeText={setTime}
                            />
                            <Ionicons name="time-outline" size={20} color="#7f8c8d" style={styles.clockIcon} />
                        </View>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ghi chú thêm</Text>
                    <TextInput 
                        style={[styles.input, styles.textArea]}
                        placeholder="Uống sau khi ăn..."
                        multiline
                        numberOfLines={4}
                        value={note}
                        onChangeText={setNote}
                    />
                </View>

                <TouchableOpacity style={styles.cameraBox}>
                    <Ionicons name="camera-outline" size={32} color="#7f8c8d" />
                    <Text style={styles.cameraText}>Chụp ảnh thuốc (nếu có)</Text>
                </TouchableOpacity>

                <View style={styles.buttonRow}>
                    <TouchableOpacity 
                        style={[styles.button, styles.cancelBtn]}
                        onPress={() => setViewMode('list')}
                    >
                        <Text style={styles.cancelBtnText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.button, styles.submitBtn]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Gửi phiếu</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Dặn thuốc</Text>
                    {viewMode === 'list' ? (
                        <TouchableOpacity 
                            style={styles.addBtn}
                            onPress={() => setViewMode('create')}
                        >
                            <Ionicons name="add" size={28} color="white" />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 44 }} />
                    )}
                </View>

                {viewMode === 'list' ? renderListView() : renderCreateView()}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        height: 60, 
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    backBtn: { width: 44, height: 44, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#009688', justifyContent: 'center', alignItems: 'center' },
    
    content: { flex: 1, padding: 20 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 20 },
    listContainer: { paddingBottom: 20 },
    card: { 
        backgroundColor: 'white', 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#e0f2f1', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    cardContent: { flex: 1 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    medName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    medInfoRow: { flexDirection: 'row', alignItems: 'center' },
    infoLabel: { fontSize: 14, color: '#95a5a6' },
    infoValue: { fontWeight: 'bold', color: '#2c3e50' },
    timeTag: { flexDirection: 'row', alignItems: 'center', marginLeft: 16 },
    timeText: { fontSize: 14, color: '#2c3e50', marginLeft: 4, fontWeight: '500' },
    dateText: { textAlign: 'right', fontSize: 11, color: '#bdc3c7', marginTop: 10 },

    formContainer: { flex: 1, padding: 20 },
    formCard: { 
        backgroundColor: 'white', 
        borderRadius: 20, 
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5
    },
    formTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 24 },
    inputGroup: { marginBottom: 20 },
    row: { flexDirection: 'row' },
    label: { fontSize: 14, color: '#7f8c8d', marginBottom: 8 },
    input: { 
        backgroundColor: '#f8f9fa', 
        borderRadius: 12, 
        padding: 14, 
        fontSize: 15, 
        color: '#2c3e50',
        borderWidth: 1,
        borderColor: '#eee'
    },
    timeInputContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#f8f9fa', 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#eee' 
    },
    clockIcon: { marginRight: 12 },
    textArea: { height: 100, textAlignVertical: 'top' },
    cameraBox: { 
        height: 100, 
        borderWidth: 1.5, 
        borderColor: '#ddd', 
        borderStyle: 'dashed', 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center',
        marginVertical: 20
    },
    cameraText: { color: '#7f8c8d', fontSize: 13, marginTop: 8 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    button: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    cancelBtn: { backgroundColor: '#f5f5f5', marginRight: 12 },
    cancelBtnText: { color: '#7f8c8d', fontWeight: 'bold' },
    submitBtn: { backgroundColor: '#009688' },
    submitBtnText: { color: 'white', fontWeight: 'bold' },

    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#bdc3c7', fontSize: 16, marginTop: 16 }
});
