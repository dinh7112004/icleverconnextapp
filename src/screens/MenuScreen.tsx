import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authEvents } from '../services/authEvents';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface MenuScreenProps {
    isVisible: boolean;
    onClose: () => void;
    avatarUrl?: string;
}

export default function MenuScreen({ isVisible, onClose, avatarUrl }: MenuScreenProps) {
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();
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
            authEvents.emitLogout();
            onClose();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const renderMenuItem = (icon: any, title: string, hasChevron = true, onPress?: () => void) => (
        <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: theme.border }]} 
            onPress={onPress}
        >
            <View style={styles.menuItemLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#2D3748' : '#f8f9fa' }]}>
                    {React.cloneElement(icon as React.ReactElement<any>, { color: isDark ? '#60A5FA' : '#3b5998' })}
                </View>
                <Text style={[styles.menuItemText, { color: theme.text }]}>{title}</Text>
            </View>
            {hasChevron && <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />}
        </TouchableOpacity>
    );

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                {/* --- TOP HEADER --- */}
                <View style={[styles.blueHeader, { backgroundColor: isDark ? '#1E293B' : '#3b5998' }]}>
                    <TouchableOpacity 
                        style={styles.closeBtn} 
                        onPress={onClose}
                        hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
                    >
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
                                    <Text style={{ fontSize: 32 }}>{avatarUrl || (userName ? userName.charAt(0) : '👨🏽‍Đ')}</Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.profileText}>
                            <Text style={styles.userName}>{userName || t('common.user')}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>
                                    {userRole === 'STUDENT' ? t('common.student') : 
                                     userRole === 'PARENT' ? t('common.parent') : userRole}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* --- ACCOUNT --- */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('menu.account')}</Text>
                        {renderMenuItem(
                            <Feather name="user" size={20} color="#3b5998" />, 
                            t('menu.profile'), 
                            true,
                            () => {
                                navigation.navigate('StudentProfile');
                                onClose();
                            }
                        )}
                        {renderMenuItem(
                            <Feather name="lock" size={20} color="#3b5998" />, 
                            t('menu.password'),
                            true,
                            () => {
                                navigation.navigate('ChangePassword');
                                onClose();
                            }
                        )}
                        {renderMenuItem(
                            <Feather name="bell" size={20} color="#3b5998" />, 
                            t('menu.notifications'),
                            true,
                            () => {
                                navigation.navigate('NotificationSettings');
                                onClose();
                            }
                        )}
                    </View>

                    {/* --- APP --- */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('menu.app')}</Text>
                        {renderMenuItem(
                            <Feather name="shield" size={20} color="#3b5998" />, 
                            t('menu.policy'),
                            true,
                            () => {
                                navigation.navigate('PrivacyPolicy');
                                onClose();
                            }
                        )}
                        {renderMenuItem(
                            <Feather name="help-circle" size={20} color="#3b5998" />, 
                            t('menu.support'),
                            true,
                            () => {
                                navigation.navigate('HelpSupport');
                                onClose();
                            }
                        )}
                        {renderMenuItem(
                            <Feather name="settings" size={20} color="#3b5998" />, 
                            t('menu.settings'),
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
                <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
                    <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: isDark ? '#1E293B' : 'white' }]} onPress={handleLogout}>
                        <Text style={styles.logoutText}>{t('menu.logout')}</Text>
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
        paddingTop: 20,
        paddingBottom: 35,
        paddingHorizontal: 20,
    },
    closeBtn: {
        alignSelf: 'flex-start',
        padding: 15,
        marginLeft: -10,
        marginBottom: 10,
        zIndex: 99,
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
