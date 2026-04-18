import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { authApi } from '../services/api';
import { authEvents } from '../services/authEvents';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import TuitionScreen from '../screens/TuitionScreen';
import CanteenMenuScreen from '../screens/CanteenMenuScreen';
import LeaveRequestScreen from '../screens/LeaveRequestScreen';
import StudentNotesScreen from '../screens/StudentNotesScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import MedicineInstructionScreen from '../screens/MedicineInstructionScreen';
import SchoolBusScreen from '../screens/SchoolBusScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import SurveyScreen from '../screens/SurveyScreen';
import StudentProfileScreen from '../screens/StudentProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import GeneralSettingsScreen from '../screens/GeneralSettingsScreen';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function AppTabs({ route }: any) {
    const { setIsLoggedIn } = route.params || {};
    
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any;
                    if (route.name === 'Trang chủ') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Tin tức') {
                        iconName = focused ? 'notifications' : 'notifications-outline';
                    } else if (route.name === 'Danh bạ') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Trợ lý AI') {
                        iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#3b5998',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: { height: 65, paddingBottom: 10 },
                tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
            })}
        >
            <Tab.Screen
                name="Trang chủ"
                component={HomeScreen}
                initialParams={{ setIsLoggedIn }}
            />
            <Tab.Screen name="Tin tức" component={NewsScreen} />
            <Tab.Screen name="Danh bạ" component={ContactScreen} />
            <Tab.Screen name="Trợ lý AI" component={AIScreen} />
        </Tab.Navigator>
    );
}

function MainNavigator({ setIsLoggedIn }: any) {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Màn hình chính chứa các Tabs */}
            <Stack.Screen 
                name="MainTabs" 
                component={AppTabs} 
                initialParams={{ setIsLoggedIn }}
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
            <Stack.Screen name="Tuition" component={TuitionScreen} />
            <Stack.Screen name="CanteenMenu" component={CanteenMenuScreen} />
            <Stack.Screen name="LeaveRequest" component={LeaveRequestScreen} />
            <Stack.Screen name="StudentNotes" component={StudentNotesScreen} />
            <Stack.Screen name="Activities" component={ActivitiesScreen} />
            <Stack.Screen name="MedicineInstruction" component={MedicineInstructionScreen} />
            <Stack.Screen name="SchoolBus" component={SchoolBusScreen} />
            <Stack.Screen name="Library" component={LibraryScreen} />
            <Stack.Screen name="ChatList" component={ChatListScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="Survey" component={SurveyScreen} />
            <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="GeneralSettings" component={GeneralSettingsScreen} />
        </Stack.Navigator>
    );
}

function AuthenticationStack({ setIsLoggedIn }: any) {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login">
                {(props) => <LoginScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
            </AuthStack.Screen>
        </AuthStack.Navigator>
    );
}

export default function AppNavigator() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

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
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3b5998" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {isLoggedIn ? (
                <MainNavigator setIsLoggedIn={setIsLoggedIn} />
            ) : (
                <AuthenticationStack setIsLoggedIn={setIsLoggedIn} />
            )}
        </NavigationContainer>
    );
}