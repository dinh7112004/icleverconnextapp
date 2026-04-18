import React, { useState } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert, 
    KeyboardAvoidingView, 
    Platform,
    ScrollView,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authApi } from '../services/api';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }: any) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        className: 'Lớp 7A1',
        schoolName: 'Trường THCS Ngôi Sao'
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async () => {
        const { fullName, email, password, className, schoolName } = formData;
        
        if (!fullName || !email || !password || !className || !schoolName) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.register({
                ...formData,
                email: email.trim(),
                password: password.trim()
            });
            
            if (response.data.success) {
                Alert.alert(
                    'Thành công', 
                    'Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.',
                    [{ text: 'Đăng nhập ngay', onPress: () => navigation.navigate('Login') }]
                );
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Đã có lỗi xảy ra khi đăng ký';
            Alert.alert('Lỗi đăng ký', message);
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#2c3e50" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Tạo tài khoản</Text>
                    <Text style={styles.subtitle}>Tham gia cộng đồng học tập thông minh</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Họ và tên</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nguyễn Văn A"
                            value={formData.fullName}
                            onChangeText={(val) => updateField('fullName', val)}
                        />
                    </View>

                    <Text style={styles.label}>Email</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="example@email.com"
                            value={formData.email}
                            onChangeText={(val) => updateField('email', val)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <Text style={styles.label}>Trường học</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="business-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Tên trường của bạn"
                            value={formData.schoolName}
                            onChangeText={(val) => updateField('schoolName', val)}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Lớp</Text>
                            <View style={[styles.inputContainer, { marginRight: 5 }]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Lớp 7A1"
                                    value={formData.className}
                                    onChangeText={(val) => updateField('className', val)}
                                />
                            </View>
                        </View>
                    </View>

                    <Text style={styles.label}>Mật khẩu</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="********"
                            value={formData.password}
                            onChangeText={(val) => updateField('password', val)}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons 
                                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                size={20} 
                                color="#7f8c8d" 
                            />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.termsText}>
                        Bằng cách đăng ký, bạn đồng ý với <Text style={styles.termsLink}>Điều khoản & Chính sách</Text> của chúng tôi.
                    </Text>

                    <TouchableOpacity 
                        style={styles.buttonContainer} 
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#2ecc71', '#27ae60']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.registerButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>ĐĂNG KÝ TÀI KHOẢN</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.loginContainer}>
                        <Text style={styles.hasAccountText}>Đã có tài khoản? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.loginLink}>Đăng nhập</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    scrollContent: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 60, paddingBottom: 30 },
    backButton: { marginBottom: 20 },
    header: { marginBottom: 40 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
    subtitle: { fontSize: 14, color: '#7f8c8d' },
    form: { width: '100%' },
    row: { flexDirection: 'row', width: '100%' },
    label: { fontSize: 14, fontWeight: '600', color: '#34495e', marginBottom: 8, marginLeft: 5 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ecf0f1',
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: '#2c3e50', fontSize: 16 },
    termsText: { fontSize: 12, color: '#7f8c8d', textAlign: 'center', marginBottom: 30, paddingHorizontal: 20 },
    termsLink: { color: '#3b5998', fontWeight: 'bold' },
    buttonContainer: {
        elevation: 5,
        shadowColor: '#27ae60',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    registerButton: {
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    hasAccountText: { color: '#7f8c8d', fontSize: 14 },
    loginLink: { color: '#3b5998', fontSize: 14, fontWeight: 'bold' },
});
