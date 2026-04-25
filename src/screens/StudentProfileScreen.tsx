import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView,
    TouchableOpacity, ActivityIndicator, TextInput, Image, Platform, Alert, DeviceEventEmitter
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { studentApi, uploadApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import { userCache } from '../services/userCache';

const mapRawToProfile = (rawData: any) => {
    if (!rawData) return null;
    return {
        personal: {
            fullName: rawData.fullName || rawData.user?.fullName,
            class: rawData.currentClass?.name || rawData.className || '---',
            school: rawData.school?.name || rawData.schoolName || '---',
            studentId: rawData.studentCode,
            dob: rawData.dateOfBirth ? new Date(rawData.dateOfBirth).toLocaleDateString('vi-VN') : '---',
            gender: rawData.gender || '---',
            idCard: rawData.citizenId || '',
            idIssueDate: rawData.citizenIdIssuedAt ? new Date(rawData.citizenIdIssuedAt).toLocaleDateString('vi-VN') : '',
            idIssuePlace: rawData.citizenIdIssuedPlace || '',
            ethnicity: rawData.ethnicity || 'Kinh',
            hometown: rawData.birthplace || '---',
            address: rawData.address || 'Chưa cập nhật',
            phone: rawData.phone || '---',
            email: rawData.email || '---',
            avatarUrl: rawData.avatarUrl,
        },
        health: {
            height: rawData.healthInfo?.height?.toString() || '',
            weight: rawData.healthInfo?.weight?.toString() || '',
            bloodType: rawData.healthInfo?.bloodType || '---',
            vision: rawData.healthInfo?.vision || '---',
            insuranceId: rawData.healthInfo?.insuranceId || '---',
            importantNote: rawData.healthInfo?.importantNote || 'Không có lưu ý đặc biệt',
        },
        contacts: {
            father: {
                name: rawData.parents?.find((p: any) => p.relationship === 'Cha' || p.relationship === 'father' || p.relationship === 'Parent')?.fullName || '---',
                phone: rawData.parents?.find((p: any) => p.relationship === 'Cha' || p.relationship === 'father' || p.relationship === 'Parent')?.phone || '---',
                job: rawData.parents?.find((p: any) => p.relationship === 'Cha' || p.relationship === 'father' || p.relationship === 'Parent')?.occupation || '---'
            },
            mother: {
                name: rawData.parents?.find((p: any) => p.relationship === 'Mẹ' || p.relationship === 'mother')?.fullName || '---',
                phone: rawData.parents?.find((p: any) => p.relationship === 'Mẹ' || p.relationship === 'mother')?.phone || '---',
                job: rawData.parents?.find((p: any) => p.relationship === 'Mẹ' || p.relationship === 'mother')?.occupation || '---'
            }
        }
    };
};

export default function StudentProfileScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState(1);
    
    // Khởi tạo ĐỒNG BỘ từ RAM
    const initialRaw = userCache.getStudentProfile();
    const initialProfile = mapRawToProfile(initialRaw);
    
    const [profile, setProfile] = useState<any>(initialProfile);
    const [editedProfile, setEditedProfile] = useState<any>(initialProfile ? JSON.parse(JSON.stringify(initialProfile)) : null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(!initialProfile);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // 1. Kiểm tra kho RAM trước, nếu có thì dùng luôn (Gần như 0ms)
            const ramData = userCache.getStudentProfile();
            if (ramData) {
                const mapped = mapRawToProfile(ramData);
                setProfile(mapped);
                setEditedProfile(JSON.parse(JSON.stringify(mapped)));
                setLoading(false);
            } else {
                // 2. Nếu RAM chưa có (vừa mở App), kiểm tra máy (AsyncStorage)
                const cached = await AsyncStorage.getItem('student_profile');
                if (cached) {
                    const cachedData = JSON.parse(cached);
                    setProfile(cachedData);
                    setEditedProfile(JSON.parse(JSON.stringify(cachedData)));
                    setLoading(false);
                }
            }

            // 3. Luôn lấy dữ liệu mới nhất từ Server để cập nhật RAM & Máy
            const response = await studentApi.getProfile();
            const rawData = response.data.data || response.data;
            
            const mappedProfile = mapRawToProfile(rawData);
            
            // Cập nhật lại giao diện
            setProfile(mappedProfile);
            setEditedProfile(JSON.parse(JSON.stringify(mappedProfile)));
            
            // LƯU DỮ LIỆU THÔ ĐỂ CÁC MÀN HÌNH KHÁC ĐỌC ĐƯỢC
            userCache.setStudentProfile(rawData);
            AsyncStorage.setItem('student_profile', JSON.stringify(rawData));
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const handlePickAvatar = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];
                const localUri = selectedImage.uri;

                // 1. CẬP NHẬT "TỨC THÌ" (INSTANT UI)
                const instantProfile = {
                    ...profile,
                    personal: { ...profile.personal, avatarUrl: localUri }
                };
                setProfile(instantProfile);
                setEditedProfile(JSON.parse(JSON.stringify(instantProfile)));
                setIsUploadingAvatar(true); // Hiện loading
                
                // Cập nhật ngay vào RAM & Máy để giữ ảnh kể cả khi lỗi mạng
                const rawData = userCache.getStudentProfile();
                if (rawData) {
                    rawData.avatarUrl = localUri;
                    userCache.setStudentProfile(rawData);
                    await AsyncStorage.setItem('student_profile', JSON.stringify(rawData));
                }
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    const userObj = JSON.parse(storedUser);
                    userObj.avatarUrl = localUri;
                    userCache.setUser(userObj);
                    await AsyncStorage.setItem('user', JSON.stringify(userObj));
                }
                
                DeviceEventEmitter.emit('refresh_user_profile');

                // 2. Upload ngầm
                const formData = new FormData();
                formData.append('file', {
                    uri: localUri,
                    type: 'image/jpeg',
                    name: 'avatar.jpg',
                } as any);

                // Snapshot profile tại thời điểm bấm để tránh stale closure
                const profileSnapshot = instantProfile;

                try {
                    const uploadResponse = await uploadApi.post(formData, 'avatars');

                    // Kiểm tra backend có trả về url không
                    if (!uploadResponse.data?.url) {
                        throw new Error(`Backend không trả về url. Response: ${JSON.stringify(uploadResponse.data)}`);
                    }

                    const serverUrl = uploadResponse.data.url;
                    const finalAvatarUrl = `${serverUrl}?t=${Date.now()}`;
                    await studentApi.updateProfile({ avatarUrl: serverUrl });

                    // Thành công -> Cập nhật link server vào cache
                    const currentRaw = userCache.getStudentProfile();
                    if (currentRaw) {
                        currentRaw.avatarUrl = finalAvatarUrl;
                        userCache.setStudentProfile(currentRaw, true);
                        await AsyncStorage.setItem('student_profile', JSON.stringify(currentRaw));
                    }
                    
                    const currentUser = userCache.getUser();
                    if (currentUser) {
                        currentUser.avatarUrl = finalAvatarUrl;
                        userCache.setUser(currentUser, true);
                        await AsyncStorage.setItem('user', JSON.stringify(currentUser));
                    }

                    // Cập nhật lại giao diện với link server
                    setProfile({
                        ...profileSnapshot,
                        personal: { ...profileSnapshot.personal, avatarUrl: finalAvatarUrl }
                    });
                    DeviceEventEmitter.emit('refresh_user_profile');
                } catch (err: any) {
                    console.log('Upload failed:', err);
                    // Hiện thông báo lỗi để dễ debug
                    const errMsg = err?.response?.data?.message || err?.message || 'Không rõ lỗi';
                    Alert.alert('Upload thất bại', `Không thể tải ảnh lên server.\n\nLỗi: ${errMsg}`);
                } finally {
                    setIsUploadingAvatar(false);
                }
            }
        } catch (error) {
            console.error('Error picking avatar:', error);
            setIsUploadingAvatar(false);
        }
    };



    const handleUpdateField = (section: string, field: string, value: string, subSection?: string) => {
        setEditedProfile((prev: any) => {
            const next = { ...prev };
            if (subSection) {
                next[section][subSection][field] = value;
            } else {
                next[section][field] = value;
            }
            return next;
        });
    };

    const handleSave = async () => {
        const newProfile = JSON.parse(JSON.stringify(editedProfile));
        setProfile(newProfile);
        setIsEditing(false);

        try {
            let genderValue = editedProfile.personal.gender;
            if (genderValue === 'Nam' || genderValue === 'male') genderValue = 'male';
            else if (genderValue === 'Nữ' || genderValue === 'female') genderValue = 'female';
            else if (genderValue === 'Khác') genderValue = 'other';

            const apiData: any = {
                fullName: editedProfile.personal.fullName,
                gender: genderValue,
                ethnicity: editedProfile.personal.ethnicity,
                birthplace: editedProfile.personal.hometown,
                address: editedProfile.personal.address,
                citizenId: editedProfile.personal.idCard,
                citizenIdIssuedPlace: editedProfile.personal.idIssuePlace,
                healthInfo: {
                    height: parseFloat(editedProfile.health.height) || undefined,
                    weight: parseFloat(editedProfile.health.weight) || undefined,
                    bloodType: editedProfile.health.bloodType,
                    vision: editedProfile.health.vision,
                    insuranceId: editedProfile.health.insuranceId,
                    importantNote: editedProfile.health.importantNote,
                }
            };

            await studentApi.updateProfile(apiData);
            AsyncStorage.setItem('student_profile', JSON.stringify(newProfile));
            
            // Phát tín hiệu cập nhật tức thì
            DeviceEventEmitter.emit('refresh_user_profile');
        } catch (error: any) {
            console.error('Error saving profile:', error);
            Alert.alert(t('common.error'), t('profile.syncFailed'));
        }
    };

    const formatGender = (gender: string) => {
        if (!gender) return '---';
        if (gender.toLowerCase() === 'male' || gender === 'Nam') return 'Nam';
        if (gender.toLowerCase() === 'female' || gender === 'Nữ') return 'Nữ';
        return gender;
    };

    const renderValueBox = (label: string, value: string, half = false) => (
        <View style={[styles.valueBox, half && { flex: 1 }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontSize: 13, marginBottom: 8 }]}>{label}</Text>
            <Text style={[styles.valueText, { color: theme.text, fontSize: 16, fontWeight: '700' }]}>{value || '---'}</Text>
        </View>
    );

    const renderInputBox = (label: string, section: string, field: string, half = false, subSection?: string) => {
        const value = subSection
            ? editedProfile[section][subSection][field]
            : editedProfile[section][field];

        return (
            <View style={[styles.inputGroup, half && { flex: 1, marginHorizontal: 4 }]}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
                <TextInput
                    style={[styles.inputField, { backgroundColor: isDark ? '#1e293b' : '#f1f4f9', color: theme.text }]}
                    value={value}
                    onChangeText={(val) => handleUpdateField(section, field, val, subSection)}
                />
            </View>
        );
    };

    const renderPersonalInfo = () => (
        <View style={styles.tabContent}>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <View style={styles.cardHeader}>
                    <Ionicons name="person-outline" size={18} color="#3b82f6" style={{ marginRight: 10 }} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Thông tin cá nhân</Text>
                </View>

                {isEditing ? (
                    <>
                        {renderInputBox('Họ và tên', 'personal', 'fullName')}
                        <View style={styles.row}>
                            {renderInputBox('Ngày sinh', 'personal', 'dob', true)}
                            {renderInputBox('Giới tính', 'personal', 'gender', true)}
                        </View>
                    </>
                ) : (
                    <>
                        {renderValueBox('Họ và tên', profile?.personal?.fullName)}
                        <View style={styles.row}>
                            {renderValueBox('Ngày sinh', profile?.personal?.dob, true)}
                            {renderValueBox('Giới tính', formatGender(profile?.personal?.gender), true)}
                        </View>
                    </>
                )}
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <View style={styles.cardHeader}>
                    <Ionicons name="card-outline" size={18} color="#3b82f6" style={{ marginRight: 10 }} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Định danh & Quê quán</Text>
                </View>
                {isEditing ? (
                    <>
                        {renderInputBox('Số CCCD/Mã định danh', 'personal', 'idCard')}
                        <View style={styles.row}>
                            {renderInputBox('Ngày cấp', 'personal', 'idIssueDate', true)}
                            {renderInputBox('Nơi cấp', 'personal', 'idIssuePlace', true)}
                        </View>
                        {renderInputBox('Dân tộc', 'personal', 'ethnicity')}
                        {renderInputBox('Quê quán', 'personal', 'hometown')}
                    </>
                ) : (
                    <>
                        {renderValueBox('Số CCCD/Mã định danh', profile?.personal?.idCard)}
                        <View style={styles.row}>
                            {renderValueBox('Ngày cấp', profile?.personal?.idIssueDate, true)}
                            {renderValueBox('Nơi cấp', profile?.personal?.idIssuePlace, true)}
                        </View>
                        {renderValueBox('Dân tộc', profile?.personal?.ethnicity)}
                        {renderValueBox('Quê quán', profile?.personal?.hometown)}
                    </>
                )}
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <View style={styles.cardHeader}>
                    <Ionicons name="location-outline" size={18} color="#f97316" style={{ marginRight: 10 }} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Liên lạc</Text>
                </View>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 8 }]}>Địa chỉ thường trú</Text>
                {isEditing ? (
                    <TextInput
                        style={[styles.inputField, { minHeight: 60, textAlignVertical: 'top', backgroundColor: isDark ? '#1e293b' : '#f1f4f9', color: theme.text }]}
                        value={editedProfile?.personal?.address}
                        onChangeText={(val) => handleUpdateField('personal', 'address', val)}
                        multiline
                    />
                ) : (
                    <Text style={[styles.addressText, { color: theme.text, fontSize: 16, fontWeight: '700' }]}>{profile?.personal?.address}</Text>
                )}
            </View>
        </View>
    );

    const renderHealthInfo = () => (
        <View style={styles.tabContent}>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <View style={styles.cardHeader}>
                    <Ionicons name="heart" size={18} color="#f43f5e" style={{ marginRight: 10 }} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Chi số cơ thể</Text>
                </View>
                
                <View style={styles.healthGrid}>
                    <View style={styles.healthGridItem}>
                        <View style={[styles.healthCardInner, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                            <Ionicons name="link-outline" size={24} color="#3b82f6" style={styles.healthIcon} />
                            <Text style={[styles.healthLabel, { color: theme.textSecondary }]}>Chiều cao (cm)</Text>
                            <TextInput 
                                style={[styles.healthInput, { color: theme.text, backgroundColor: isDark ? '#0f172a' : 'white', borderColor: isDark ? '#334155' : '#e2e8f0' }]}
                                value={isEditing ? editedProfile?.health?.height : profile?.health?.height}
                                editable={isEditing}
                                onChangeText={(val) => handleUpdateField('health', 'height', val)}
                                placeholder="---"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>
                    </View>
                    <View style={styles.healthGridItem}>
                        <View style={[styles.healthCardInner, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                            <Ionicons name="briefcase-outline" size={24} color="#f97316" style={styles.healthIcon} />
                            <Text style={[styles.healthLabel, { color: theme.textSecondary }]}>Cân nặng (kg)</Text>
                            <TextInput 
                                style={[styles.healthInput, { color: theme.text, backgroundColor: isDark ? '#0f172a' : 'white', borderColor: isDark ? '#334155' : '#e2e8f0' }]}
                                value={isEditing ? editedProfile?.health?.weight : profile?.health?.weight}
                                editable={isEditing}
                                onChangeText={(val) => handleUpdateField('health', 'weight', val)}
                                placeholder="---"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>
                    </View>
                </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <View style={styles.cardHeader}>
                    <Ionicons name="medical-outline" size={18} color="#f43f5e" style={{ marginRight: 10 }} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Thông tin y tế</Text>
                </View>
                
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Nhóm máu</Text>
                        <TextInput 
                            style={[styles.inputField, { backgroundColor: isDark ? '#1e293b' : '#f1f4f9', color: theme.text }]}
                            value={isEditing ? editedProfile?.health?.bloodType : profile?.health?.bloodType}
                            editable={isEditing}
                            onChangeText={(val) => handleUpdateField('health', 'bloodType', val)}
                            placeholder="---"
                            placeholderTextColor={theme.textSecondary}
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Thị lực</Text>
                        <TextInput 
                            style={[styles.inputField, { backgroundColor: isDark ? '#1e293b' : '#f1f4f9', color: theme.text }]}
                            value={isEditing ? editedProfile?.health?.vision : profile?.health?.vision}
                            editable={isEditing}
                            onChangeText={(val) => handleUpdateField('health', 'vision', val)}
                            placeholder="---"
                            placeholderTextColor={theme.textSecondary}
                        />
                    </View>
                </View>

                <View style={[styles.inputGroup, { marginTop: 15 }]}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Mã BHYT</Text>
                    <TextInput 
                        style={[styles.inputField, { backgroundColor: isDark ? '#1e293b' : '#f1f4f9', color: theme.text }]}
                        value={isEditing ? editedProfile?.health?.insuranceId : profile?.health?.insuranceId}
                        editable={isEditing}
                        onChangeText={(val) => handleUpdateField('health', 'insuranceId', val)}
                        placeholder="---"
                        placeholderTextColor={theme.textSecondary}
                    />
                </View>

                <View style={[styles.importantNoteBox, { backgroundColor: isDark ? '#451a1a' : '#fff1f2' }]}>
                    <Text style={styles.noteTitle}>LƯU Ý QUAN TRỌNG</Text>
                    {isEditing ? (
                        <TextInput 
                            style={[styles.noteInput, { color: theme.text }]}
                            value={editedProfile?.health?.importantNote}
                            onChangeText={(val) => handleUpdateField('health', 'importantNote', val)}
                            multiline
                        />
                    ) : (
                        <Text style={[styles.noteContent, { color: theme.text }]}>{profile?.health?.importantNote || 'Không có lưu ý đặc biệt'}</Text>
                    )}
                </View>
            </View>
        </View>
    );

    const renderContactInfo = () => (
        <View style={styles.tabContent}>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <View style={styles.cardHeader}>
                    <Ionicons name="people-outline" size={18} color="#3b82f6" style={{ marginRight: 10 }} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Thông tin bố</Text>
                </View>
                {isEditing ? (
                    <>
                        {renderInputBox('Họ và tên', 'contacts', 'name', false, 'father')}
                        {renderInputBox('Điện thoại', 'contacts', 'phone', false, 'father')}
                        {renderInputBox('Nghề nghiệp', 'contacts', 'job', false, 'father')}
                    </>
                ) : (
                    <>
                        {renderValueBox('Họ và tên', profile?.contacts?.father?.name)}
                        {renderValueBox('Điện thoại', profile?.contacts?.father?.phone)}
                        {renderValueBox('Nghề nghiệp', profile?.contacts?.father?.job)}
                    </>
                )}
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <View style={styles.cardHeader}>
                    <Ionicons name="people-outline" size={18} color="#db2777" style={{ marginRight: 10 }} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Thông tin mẹ</Text>
                </View>
                {isEditing ? (
                    <>
                        {renderInputBox('Họ và tên', 'contacts', 'name', false, 'mother')}
                        {renderInputBox('Điện thoại', 'contacts', 'phone', false, 'mother')}
                        {renderInputBox('Nghề nghiệp', 'contacts', 'job', false, 'mother')}
                    </>
                ) : (
                    <>
                        {renderValueBox('Họ và tên', profile?.contacts?.mother?.name)}
                        {renderValueBox('Điện thoại', profile?.contacts?.mother?.phone)}
                        {renderValueBox('Nghề nghiệp', profile?.contacts?.mother?.job)}
                    </>
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8f9fa' }]}>
            <View style={{ flex: 1 }}>
                <View style={[styles.header, { backgroundColor: isDark ? '#1e293b' : '#1d57e8' }]}>
                    <SafeAreaView edges={['top']} style={styles.headerSafe}>
                        <View style={styles.topNav}>
                            <TouchableOpacity 
                                onPress={() => navigation.goBack()} 
                                style={[styles.backBtn, { padding: 10, marginLeft: -10 }]}
                                hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
                            >
                                <Ionicons name="chevron-back" size={28} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Hồ sơ học sinh</Text>
                            {isEditing ? (
                                <TouchableOpacity 
                                    onPress={handleSave} 
                                    style={[styles.saveBtn, { backgroundColor: 'white' }]}
                                >
                                    <Feather name="save" size={16} color="#1d57e8" style={{ marginRight: 5 }} />
                                    <Text style={[styles.saveBtnText, { color: '#1d57e8' }]}>Lưu</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity 
                                    onPress={() => setIsEditing(true)} 
                                    style={[styles.editBtnCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)' }]}
                                >
                                    <Feather name="edit" size={18} color="white" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.userInfo}>
                            <View style={styles.avatarWrapper}>
                                <View style={styles.avatarCircle}>
                                    {profile?.personal?.avatarUrl ? (
                                        <Image 
                                            key={profile.personal.avatarUrl}
                                            source={{ uri: profile.personal.avatarUrl }} 
                                            style={styles.avatarImage} 
                                            fadeDuration={0}
                                        />
                                    ) : (
                                        <View style={{ width: '100%', height: '100%', backgroundColor: '#e1e8ef', justifyContent: 'center', alignItems: 'center' }}>
                                            <Ionicons name="person" size={50} color="#94a3b8" />
                                        </View>
                                    )}

                                    {(loading || isUploadingAvatar) && (
                                        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }]}>
                                            <ActivityIndicator color="white" />
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity style={styles.cameraBtn} onPress={handlePickAvatar} disabled={isUploadingAvatar}>
                                    {isUploadingAvatar ? (
                                        <ActivityIndicator size="small" color="#1d57e8" />
                                    ) : (
                                        <Ionicons name="camera" size={18} color="#1d57e8" />
                                    )}
                                </TouchableOpacity>

                            </View>
                            <Text style={styles.userNameText}>{profile?.personal?.fullName || '---'}</Text>
                            <Text style={styles.userSubText}>
                                Lớp {profile?.personal?.class || '---'} • Trường {profile?.personal?.school || '---'}
                            </Text>
                        </View>
                    </SafeAreaView>
                </View>

                <View style={styles.tabBarWrapper}>
                    <View style={[styles.tabBar, { backgroundColor: isDark ? '#1e293b' : 'white' }]}>
                        <TouchableOpacity
                            style={[styles.tabItem, activeTab === 1 && styles.activeTab]}
                            onPress={() => setActiveTab(1)}
                        >
                            <Text style={[styles.tabText, activeTab === 1 ? styles.activeTabText : { color: theme.textSecondary }]}>Thông tin</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabItem, activeTab === 2 && styles.activeTab]}
                            onPress={() => setActiveTab(2)}
                        >
                            <Text style={[styles.tabText, activeTab === 2 ? styles.activeTabText : { color: theme.textSecondary }]}>Sức khỏe</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabItem, activeTab === 3 && styles.activeTab]}
                            onPress={() => setActiveTab(3)}
                        >
                            <Text style={[styles.tabText, activeTab === 3 ? styles.activeTabText : { color: theme.textSecondary }]}>Liên hệ</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                    {activeTab === 1 && renderPersonalInfo()}
                    {activeTab === 2 && renderHealthInfo()}
                    {activeTab === 3 && renderContactInfo()}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingBottom: 40,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerSafe: {
        paddingHorizontal: 16,
    },
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
    },
    backBtn: { 
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
        marginLeft: 15,
    },
    editBtnCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        elevation: 2,
    },
    saveBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    userInfo: {
        alignItems: 'center',
        marginTop: 10,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#e1e8ef',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: 'white',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    userNameText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 15,
    },
    userSubText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 5,
    },
    tabBarWrapper: {
        marginTop: -25,
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    tabBar: {
        flexDirection: 'row',
        borderRadius: 15,
        padding: 5,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#3b82f6',
    },
    tabText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    activeTabText: {
        color: 'white',
    },
    tabContent: {
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    valueBox: {
        marginBottom: 20,
    },
    valueText: {
        lineHeight: 22,
    },
    row: {
        flexDirection: 'row',
    },
    inputGroup: {
        marginBottom: 15,
    },
    fieldLabel: {
        fontSize: 13,
        marginBottom: 8,
    },
    inputField: {
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 15,
        fontWeight: '500',
    },
    addressText: {
        lineHeight: 22,
    },
    healthGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    healthGridItem: {
        flex: 1,
        marginHorizontal: 4,
    },
    healthCardInner: {
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    healthIcon: {
        marginBottom: 10,
    },
    healthLabel: {
        fontSize: 12,
        marginBottom: 5,
    },
    healthInput: {
        fontSize: 18,
        fontWeight: 'bold',
        borderWidth: 1,
        borderRadius: 8,
        width: '100%',
        textAlign: 'center',
        paddingVertical: 5,
    },
    importantNoteBox: {
        padding: 15,
        borderRadius: 15,
        marginTop: 20,
    },
    noteTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#f43f5e',
        marginBottom: 8,
    },
    noteContent: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
    noteInput: {
        fontSize: 14,
        fontWeight: '500',
        minHeight: 50,
        textAlignVertical: 'top',
    }
});
