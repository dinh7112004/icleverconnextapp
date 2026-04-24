import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { authApi } from '../services/api';
import { authEvents } from '../services/authEvents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Import các màn hình
import HomeScreen from '../screens/HomeScreen';
import NewsScreen from '../screens/NewsScreen';
import ContactScreen from '../screens/ContactScreen';
import AIScreen from '../screens/AIScreen';
import AcademicListScreen from '../screens/AcademicListScreen';
import CurriculumScreen from '../screens/CurriculumScreen';
import LessonDetailScreen from '../screens/LessonDetailScreen';
import GameListScreen from '../screens/GameListScreen';
import MathRushScreen from '../screens/MathRushScreen';
import TimetableScreen from '../screens/TimetableScreen';
import GradesScreen from '../screens/GradesScreen';
import HomeworkScreen from '../screens/HomeworkScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import CanteenMenuScreen from '../screens/CanteenMenuScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import StudentProfileScreen from '../screens/StudentProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import GeneralSettingsScreen from '../screens/GeneralSettingsScreen';
import StudentNotesScreen from '../screens/StudentNotesScreen';
import MedicineInstructionScreen from '../screens/MedicineInstructionScreen';
import SchoolBusScreen from '../screens/SchoolBusScreen';
import TuitionScreen from '../screens/TuitionScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import LeaveRequestScreen from '../screens/LeaveRequestScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SurveyScreen from '../screens/SurveyScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function AppTabs() {
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any;
                    if (route.name === 'MainHome') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'MainNews') {
                        iconName = focused ? 'notifications' : 'notifications-outline';
                    } else if (route.name === 'MainContacts') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'MainAI') {
                        iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: isDark ? '#3B82F6' : '#3b5998',
                tabBarInactiveTintColor: isDark ? '#94A3B8' : 'gray',
                tabBarStyle: { 
                    height: 65, 
                    paddingBottom: 10,
                    backgroundColor: theme.surface,
                    borderTopColor: theme.border,
                },
                tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
            })}
        >
            <Tab.Screen
                name="MainHome"
                component={HomeScreen}
                options={{ tabBarLabel: t('tabs.home') }}
            />
            <Tab.Screen 
                name="MainNews" 
                component={NewsScreen} 
                options={{ tabBarLabel: t('tabs.news') }}
            />
            <Tab.Screen 
                name="MainContacts" 
                component={ContactScreen} 
                options={{ tabBarLabel: t('tabs.contacts') }}
            />
            <Tab.Screen 
                name="MainAI" 
                component={AIScreen} 
                options={{ tabBarLabel: t('tabs.ai') }}
            />
        </Tab.Navigator>
    );
}

function MainNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Màn hình chính chứa các Tabs */}
            <Stack.Screen 
                name="MainTabs" 
                component={AppTabs} 
            />
            
            {/* Các màn hình chi tiết & Tiện ích (Có thể truy cập từ bất kỳ Tab nào) */}
            <Stack.Screen name="AcademicList" component={AcademicListScreen} />
            <Stack.Screen name="Curriculum" component={CurriculumScreen} />
            <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
            <Stack.Screen name="GameList" component={GameListScreen} />
            <Stack.Screen name="MathRush" component={MathRushScreen} />
            <Stack.Screen name="Timetable" component={TimetableScreen} />
            <Stack.Screen name="Grades" component={GradesScreen} />
            <Stack.Screen name="Homework" component={HomeworkScreen} />
            <Stack.Screen name="Attendance" component={AttendanceScreen} />
            
            {/* Working features */}
            <Stack.Screen name="CanteenMenu" component={CanteenMenuScreen} />

            {/* Chat system */}
            <Stack.Screen name="ChatList" component={ChatListScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />

            {/* Placeholder screens for unfinished modules */}
            <Stack.Screen name="Tuition" component={TuitionScreen} />
            <Stack.Screen name="LeaveRequest" component={LeaveRequestScreen} />
            <Stack.Screen name="StudentNotes" component={StudentNotesScreen} />
            <Stack.Screen name="Activities" component={ActivitiesScreen} />
            <Stack.Screen name="MedicineInstruction" component={MedicineInstructionScreen} />
            <Stack.Screen name="SchoolBus" component={SchoolBusScreen} />
            <Stack.Screen name="Library" component={LibraryScreen} />
            <Stack.Screen name="Survey" component={SurveyScreen} />
            
            <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="GeneralSettings" component={GeneralSettingsScreen} />
            <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        </Stack.Navigator>
    );
}

function AuthenticationStack() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
        </AuthStack.Navigator>
    );
}

export default function AppNavigator() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const { isDark, theme } = useTheme();

    useEffect(() => {
        const unsubscribe = authEvents.subscribe((state) => {
            setIsLoggedIn(state);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                
                if (token) {
                    setIsLoggedIn(true);
                    
                    if (refreshToken) {
                        try {
                            const response = await authApi.refresh(refreshToken);
                            if (response.data && response.data.success) {
                                const { accessToken, refreshToken: newRefresh } = response.data.data;
                                await AsyncStorage.setItem('userToken', accessToken);
                                await AsyncStorage.setItem('refreshToken', newRefresh);
                            }
                        } catch (e) {
                            console.log('Background token refresh failed');
                        }
                    }
                } else {
                    setIsLoggedIn(false);
                }
            } catch (e) {
                console.error('Auth initialization error', e);
                setIsLoggedIn(false);
            }
        };

        initAuth();
    }, []);

    if (isLoggedIn === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer theme={{
            dark: isDark,
            colors: {
                primary: theme.primary,
                background: theme.background,
                card: theme.surface,
                text: theme.text,
                border: theme.border,
                notification: '#EF4444',
            },
            fonts: {
                regular: { fontFamily: 'System', fontWeight: '400' },
                medium: { fontFamily: 'System', fontWeight: '500' },
                bold: { fontFamily: 'System', fontWeight: '700' },
                heavy: { fontFamily: 'System', fontWeight: '800' },
            }
        }}>
            {isLoggedIn ? (
                <MainNavigator />
            ) : (
                <AuthenticationStack />
            )}
        </NavigationContainer>
    );
}