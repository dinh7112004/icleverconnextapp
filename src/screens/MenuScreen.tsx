import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, Modal, Image } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MenuScreenProps {
    isVisible: boolean;
    onClose: () => void;
    setIsLoggedIn?: (val: boolean) => void;
    avatarUrl?: string;
}

export default function MenuScreen({ isVisible, onClose, setIsLoggedIn, avatarUrl }: MenuScreenProps) {
    const navigation = useNavigation<any>();
    const [userRole, setUserRole] = React.useState<string>('STUDENT');
    const [userName, setUserName] = React.useState<string>('');

    React.useEffect(() => {
        if (isVisible) {
            fetchUserData();
        }
    }, [isVisible]);

    const fetchUserData = async () => {
        try {
            // First check AsyncStorage for quick load
            const stored = await AsyncStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                setUserName(parsed.fullName);
                setUserRole(parsed.role);
            }

            // Sync with Server
            const { userApi } = require('../services/api');
            const response = await userApi.getProfile();
            const userData = response.data.data;
            setUserName(userData.fullName);
            setUserRole(userData.role);
        } catch (error) {
            console.error('Error fetching user data in Menu:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.multiRemove(['userToken', 'refreshToken', 'user']);
            if (setIsLoggedIn) setIsLoggedIn(false);
            onClose();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const renderMenuItem = (icon: any, title: string, hasChevron = true, onPress?: () => void) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuItemLeft}>
                <View style={styles.iconCircle}>
                    {icon}
                </View>
                <Text style={styles.menuItemText}>{title}</Text>
            </View>
            {hasChevron && <Ionicons name="chevron-forward" size={18} color="#bdc3c7" />}
        </TouchableOpacity>
    );

    return (
        <Modal
            animationType={isVisible ? "slide" : "none"}
            transparent={false}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                {/* --- TOP HEADER --- */}
                <View style={styles.blueHeader}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="chevron-back" size={30} color="white" />
                    </TouchableOpacity>

                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarPlaceholder}>
                                {avatarUrl && avatarUrl.startsWith('http') ? (
                                    <Image 
                                        source={{ uri: avatarUrl }} 
                                        style={{ width: 70, height: 70, borderRadius: 35 }} 
                                    />
                                ) : (
                                    <Text style={{ fontSize: 32 }}>{avatarUrl || (userName ? userName.charAt(0) : '👨🏽‍🦲')}</Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.profileText}>
                            <Text style={styles.userName}>{userName || 'Người dùng'}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>
                                    {userRole === 'STUDENT' ? 'Học sinh' : 
                                     userRole === 'PARENT' ? 'Phụ huynh' : userRole}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* --- TÀI KHOẢN --- */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>TÀI KHOẢN</Text>
                        {renderMenuItem(
                            <Feather name="user" size={20} color="#3b5998" />, 
                            "Hồ sơ học sinh", 
                            true,
                            () => {
                                navigation.navigate('StudentProfile');
                                onClose();
                            }
                        )}
                        {renderMenuItem(
                            <Feather name="lock" size={20} color="#3b5998" />, 
                            "Đổi mật khẩu",
                            true,
                            () => {
                                navigation.navigate('ChangePassword');
                                onClose();
                            }
                        )}
                        {renderMenuItem(
                            <Feather name="bell" size={20} color="#3b5998" />, 
                            "Cài đặt thông báo",
                            true,
                            () => {
                                navigation.navigate('NotificationSettings');
                                onClose();
                            }
                        )}
                    </View>

                    {/* --- ỨNG DỤNG --- */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>ỨNG DỤNG</Text>
                        {renderMenuItem(
                            <Feather name="shield" size={20} color="#3b5998" />, 
                            "Chính sách bảo mật",
                            true,
                            () => {
                                navigation.navigate('PrivacyPolicy');
                                onClose();
                            }
                        )}
                        {renderMenuItem(
                            <Feather name="help-circle" size={20} color="#3b5998" />, 
                            "Trợ giúp & Hỗ trợ",
                            true,
                            () => {
                                navigation.navigate('HelpSupport');
                                onClose();
                            }
                        )}
                        {renderMenuItem(
                            <Feather name="settings" size={20} color="#3b5998" />, 
                            "Cài đặt chung",
                            true,
                            () => {
                                navigation.navigate('GeneralSettings');
                                onClose();
                            }
                        )}
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* --- LOGOUT BUTTON --- */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Đăng xuất</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    blueHeader: {
        backgroundColor: '#3b5998',
        paddingTop: 10,
        paddingBottom: 35,
        paddingHorizontal: 20,
    },
    closeBtn: {
        alignSelf: 'flex-start',
        padding: 5,
        marginBottom: 10,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    avatarPlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#e1e8ef',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileText: {
        marginLeft: 20,
    },
    userName: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 5,
    },
    roleBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    section: {
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#95a5a6',
        marginBottom: 15,
        letterSpacing: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuItemText: {
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '500',
    },
    footer: {
        padding: 20,
        paddingBottom: 30,
        borderTopWidth: 1,
        borderTopColor: '#f1f2f6',
    },
    logoutBtn: {
        width: '100%',
        height: 55,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#e74c3c',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    logoutText: {
        color: '#e74c3c',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
