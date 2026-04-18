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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation, setIsLoggedIn }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
            return;
        }

        setLoading(true);
        console.log(`[Login] Đang gửi yêu cầu đăng nhập...`);
        
        try {
            const response = await authApi.login({ 
                identifier: email.trim().toLowerCase(), 
                password: password.trim() 
            });
            
            console.log('[Login-DEBUG] Full Response Data:', JSON.stringify(response.data, null, 2));
            
            if (response.data.success) {
                const { accessToken, refreshToken, user } = response.data.data;
                await AsyncStorage.setItem('userToken', accessToken);
                await AsyncStorage.setItem('refreshToken', refreshToken);
                await AsyncStorage.setItem('user', JSON.stringify(user));
                Alert.alert('Thành công', 'Đăng nhập thành công!');
                setIsLoggedIn(true);
            }
        } catch (error: any) {
            console.log('[Login Error] Chi tiết lỗi:', error.message);
            if (error.response) {
                console.log('[Login Error] Server Data:', error.response.data);
                console.log('[Login Error] Server Status:', error.response.status);
            }
            const message = error.response?.data?.message || 'Đã có lỗi xảy ra khi đăng nhập';
            Alert.alert('Lỗi đăng nhập', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <LinearGradient
                        colors={['#4c669f', '#3b5998', '#192f6a']}
                        style={styles.logoContainer}
                    >
                        <Ionicons name="school" size={50} color="white" />
                    </LinearGradient>
                    <Text style={styles.title}>iClever Connect</Text>
                    <Text style={styles.subtitle}>Cổng thông tin giáo dục thông minh</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="example@email.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <Text style={styles.label}>Mật khẩu</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="********"
                            value={password}
                            onChangeText={setPassword}
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

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.buttonContainer} 
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#3b5998', '#192f6a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.loginButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>ĐĂNG NHẬP</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.footerInfo}>
                        <Ionicons name="information-circle-outline" size={16} color="#7f8c8d" />
                        <Text style={styles.infoText}>
                            Tài khoản do nhà trường cấp. Vui lòng liên hệ văn phòng nếu bạn chưa có tài khoản.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    scrollContent: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 60, paddingBottom: 30 },
    header: { alignItems: 'center', marginBottom: 50 },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 10,
        shadowColor: '#3b5998',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    title: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
    subtitle: { fontSize: 14, color: '#7f8c8d', textAlign: 'center' },
    form: { width: '100%' },
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
    forgotPassword: { alignSelf: 'flex-end', marginBottom: 30 },
    forgotPasswordText: { color: '#3b5998', fontSize: 13, fontWeight: '600' },
    buttonContainer: {
        elevation: 5,
        shadowColor: '#3b5998',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    loginButton: {
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        backgroundColor: '#f1f2f6',
        padding: 15,
        borderRadius: 10,
    },
    infoText: { 
        color: '#7f8c8d', 
        fontSize: 12, 
        marginLeft: 8, 
        textAlign: 'center',
        lineHeight: 18,
        flex: 1
    },
});
