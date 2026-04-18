import React, { useState } from 'react';
import {
    StyleSheet, Text, View, ScrollView, SafeAreaView,
    TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function ChangePasswordScreen({ navigation }: any) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleUpdate = () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 8 ký tự');
            return;
        }

        Alert.alert('Thành công', 'Mật khẩu đã được cập nhật', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
    };

    const renderInput = (
        label: string, 
        value: string, 
        setValue: (v: string) => void, 
        show: boolean, 
        setShow: (s: boolean) => void,
        placeholder: string
    ) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={setValue}
                    placeholder={placeholder}
                    placeholderTextColor="#bdc3c7"
                    secureTextEntry={!show}
                />
                <TouchableOpacity onPress={() => setShow(!show)} style={styles.eyeIcon}>
                    <Ionicons name={show ? "eye-outline" : "eye-off-outline"} size={20} color="#bdc3c7" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="lock-closed-outline" size={40} color="#2b58de" />
                        </View>

                        {renderInput('Mật khẩu hiện tại', oldPassword, setOldPassword, showOld, setShowOld, 'Nhập mật khẩu cũ')}
                        {renderInput('Mật khẩu mới', newPassword, setNewPassword, showNew, setShowNew, 'Nhập mật khẩu mới')}
                        {renderInput('Nhập lại mật khẩu mới', confirmPassword, setConfirmPassword, showConfirm, setShowConfirm, 'Xác nhận mật khẩu mới')}

                        <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
                            <Ionicons name="checkmark-circle-outline" size={22} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.updateBtnText}>Cập nhật mật khẩu</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.footerNote}>
                        Mật khẩu nên bao gồm ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số để đảm bảo an toàn.
                    </Text>
                </ScrollView>
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
        borderBottomColor: '#f1f2f6'
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    scrollContent: { padding: 20, alignItems: 'center' },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        marginTop: 20
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f4ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30
    },
    inputGroup: { width: '100%', marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#7f8c8d', marginBottom: 8 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f2f6',
        borderRadius: 12,
        backgroundColor: '#f9f9f9',
        height: 55,
        paddingHorizontal: 15
    },
    input: { flex: 1, fontSize: 15, color: '#2c3e50', fontWeight: '500' },
    eyeIcon: { padding: 5 },
    updateBtn: {
        flexDirection: 'row',
        backgroundColor: '#2b58de',
        width: '100%',
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 3,
        shadowColor: '#2b58de',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    updateBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    footerNote: {
        marginTop: 30,
        textAlign: 'center',
        fontSize: 13,
        color: '#95a5a6',
        lineHeight: 20,
        paddingHorizontal: 20
    }
});
