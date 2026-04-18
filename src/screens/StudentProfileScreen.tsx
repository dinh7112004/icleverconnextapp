import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, SafeAreaView,
    TouchableOpacity, ActivityIndicator, TextInput
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { studentApi } from '../services/api';

export default function StudentProfileScreen({ navigation }: any) {
    const [activeTab, setActiveTab] = useState(1);
    const [profile, setProfile] = useState<any>(null);
    const [editedProfile, setEditedProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await studentApi.getProfile();
            const rawData = response.data.data || response.data;
            
            // Mapping real API flat structure to component's nested structure
            const mappedProfile = {
                personal: {
                    fullName: rawData.fullName || rawData.user?.fullName,
                    class: rawData.currentClass?.name || 'Chưa xếp lớp',
                    school: rawData.school?.name || 'iClever Connect',
                    studentId: rawData.studentCode,
                    dob: rawData.dateOfBirth ? new Date(rawData.dateOfBirth).toLocaleDateString('vi-VN') : '---',
                    gender: rawData.gender || '---',
                    ethnicity: rawData.ethnicity || 'Kinh',
                    hometown: rawData.birthplace || 'Việt Nam',
                    address: rawData.address || 'Chưa cập nhật',
                    phone: rawData.phone || '---',
                    email: rawData.email || '---',
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
                        name: '---',
                        phone: '---',
                        job: '---'
                    },
                    mother: {
                        name: '---',
                        phone: '---',
                        job: '---'
                    }
                }
            };
            
            setProfile(mappedProfile);
            setEditedProfile(JSON.parse(JSON.stringify(mappedProfile)));
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
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

    const handleSave = () => {
        setProfile(JSON.parse(JSON.stringify(editedProfile)));
        setIsEditing(false);
    };

    const toggleEdit = () => {
        if (!isEditing) {
            setEditedProfile(JSON.parse(JSON.stringify(profile)));
        }
        setIsEditing(!isEditing);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hồ sơ học sinh</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {isEditing ? (
                        <TouchableOpacity style={styles.saveBtnWhite} onPress={handleSave}>
                            <Ionicons name="save-outline" size={16} color="#2b58de" style={{ marginRight: 5 }} />
                            <Text style={styles.saveBtnTextBlue}>Lưu</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.editBtn} onPress={toggleEdit}>
                            <Ionicons name="pencil" size={20} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarCircle}>
                        <Text style={{ fontSize: 48 }}>👨🏽‍🦲</Text>
                    </View>
                    {!isEditing && (
                        <TouchableOpacity style={styles.cameraBtn}>
                            <Ionicons name="camera" size={16} color="#3b5998" />
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.profileName}>{profile?.personal?.fullName}</Text>
                <Text style={styles.profileSubText}>
                    Lớp {profile?.personal?.class || '7A1'} • Trường {profile?.personal?.school || 'THCS Ngôi Sao'}
                </Text>
            </View>

            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 1 && styles.activeTabItem]}
                    onPress={() => setActiveTab(1)}
                >
                    <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>Thông tin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 2 && styles.activeTabItem]}
                    onPress={() => setActiveTab(2)}
                >
                    <Text style={[styles.tabText, activeTab === 2 && styles.activeTabText]}>Sức khỏe</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 3 && styles.activeTabItem]}
                    onPress={() => setActiveTab(3)}
                >
                    <Text style={[styles.tabText, activeTab === 3 && styles.activeTabText]}>Liên hệ</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderLabel = (label: string) => <Text style={styles.inputLabel}>{label}</Text>;

    const renderValueRow = (label: string, value: string, isLight = false) => (
        <View style={styles.viewRow}>
            <Text style={styles.viewLabel}>{label}</Text>
            <Text style={[styles.viewValue, isLight && styles.viewValueLight]}>{value || 'Chưa cập nhật'}</Text>
        </View>
    );

    const renderInputBox = (label: string, section: string, field: string, half = false, subSection?: string) => {
        const value = subSection
            ? editedProfile[section][subSection][field]
            : editedProfile[section][field];

        return (
            <View style={[styles.inputGroup, half && { flex: 1, marginHorizontal: 4 }]}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                    style={styles.boundingBox}
                    value={value}
                    onChangeText={(val) => handleUpdateField(section, field, val, subSection)}
                />
            </View>
        );
    };

    const renderPersonalInfo = () => (
        <View style={styles.tabContent}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="person-outline" size={18} color="#3b5998" />
                    <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
                </View>

                {isEditing ? (
                    <>
                        <View style={styles.viewRow}>
                            <Text style={styles.viewLabel}>Mã học sinh</Text>
                            <Text style={styles.viewValue}>{profile?.personal?.studentId}</Text>
                        </View>
                        {renderInputBox('Họ và tên', 'personal', 'fullName')}
                        <View style={styles.row}>
                            {renderInputBox('Ngày sinh', 'personal', 'dob', true)}
                            {renderInputBox('Giới tính', 'personal', 'gender', true)}
                        </View>
                    </>
                ) : (
                    <>
                        {renderValueRow('Mã học sinh', profile?.personal?.studentId)}
                        {renderValueRow('Họ và tên', profile?.personal?.fullName)}
                        {renderValueRow('Ngày sinh', profile?.personal?.dob)}
                        {renderValueRow('Giới tính', profile?.personal?.gender)}
                    </>
                )}
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="card-outline" size={18} color="#3b5998" />
                    <Text style={styles.cardTitle}>Định danh & Quê quán</Text>
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
                        {renderValueRow('Số CCCD', profile?.personal?.idCard, true)}
                        {renderValueRow('Ngày cấp', profile?.personal?.idIssueDate, true)}
                        {renderValueRow('Nơi cấp', profile?.personal?.idIssuePlace, true)}
                        {renderValueRow('Dân tộc', profile?.personal?.ethnicity)}
                        {renderValueRow('Quê quán', profile?.personal?.hometown, true)}
                    </>
                )}
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="location-outline" size={18} color="#3b5998" />
                    <Text style={styles.cardTitle}>Liên lạc</Text>
                </View>
                <Text style={styles.fieldLabel}>Địa chỉ thường trú</Text>
                {isEditing ? (
                    <TextInput
                        style={[styles.boundingBox, { minHeight: 60, textAlignVertical: 'top', marginTop: 8 }]}
                        value={editedProfile?.personal?.address}
                        onChangeText={(val) => handleUpdateField('personal', 'address', val)}
                        multiline
                    />
                ) : (
                    <Text style={styles.addressText}>{profile?.personal?.address}</Text>
                )}
            </View>
        </View>
    );

    const renderHealthInfo = () => (
        <View style={styles.tabContent}>
            <View style={styles.healthStatsRow}>
                <View style={styles.healthStatCard}>
                    <MaterialCommunityIcons name="ruler" size={24} color="#3b5998" />
                    <Text style={styles.healthStatLabel}>Chiều cao (cm)</Text>
                    {isEditing ? (
                        <TextInput
                            style={styles.boundingBoxSmall}
                            value={editedProfile?.health?.height}
                            onChangeText={(val) => handleUpdateField('health', 'height', val)}
                        />
                    ) : (
                        <Text style={styles.healthStatValue}>{profile?.health?.height || 'cm'}</Text>
                    )}
                </View>
                <View style={styles.healthStatCard}>
                    <MaterialCommunityIcons name="weight-kilogram" size={24} color="#e67e22" />
                    <Text style={styles.healthStatLabel}>Cân nặng (kg)</Text>
                    {isEditing ? (
                        <TextInput
                            style={styles.boundingBoxSmall}
                            value={editedProfile?.health?.weight}
                            onChangeText={(val) => handleUpdateField('health', 'weight', val)}
                        />
                    ) : (
                        <Text style={styles.healthStatValue}>{profile?.health?.weight || 'kg'}</Text>
                    )}
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="heart-outline" size={18} color="#e74c3c" />
                    <Text style={styles.cardTitle}>Thông tin y tế</Text>
                </View>
                {isEditing ? (
                    <>
                        <View style={styles.row}>
                            {renderInputBox('Nhóm máu', 'health', 'bloodType', true)}
                            {renderInputBox('Thị lực', 'health', 'vision', true)}
                        </View>
                        {renderInputBox('Mã BHYT', 'health', 'insuranceId')}
                        <View style={styles.importantNote}>
                            <Text style={styles.noteLabel}>LƯU Ý QUAN TRỌNG</Text>
                            <TextInput
                                style={styles.noteInput}
                                value={editedProfile?.health?.importantNote}
                                onChangeText={(val) => handleUpdateField('health', 'importantNote', val)}
                                multiline
                            />
                        </View>
                    </>
                ) : (
                    <>
                        {renderValueRow('Nhóm máu', profile?.health?.bloodType, true)}
                        {renderValueRow('Thị lực', profile?.health?.vision)}
                        {renderValueRow('Mã BHYT', profile?.health?.insuranceId, true)}

                        <View style={styles.importantNote}>
                            <Text style={styles.noteLabel}>LƯU Ý QUAN TRỌNG</Text>
                            <Text style={styles.noteContent}>{profile?.health?.importantNote}</Text>
                        </View>
                        {renderValueRow('Khám sức khỏe', profile?.health?.lastCheckup)}
                    </>
                )}
            </View>
        </View>
    );

    const renderContactInfo = () => (
        <View style={styles.tabContent}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="people-outline" size={18} color="#3b5998" />
                    <Text style={styles.cardTitle}>Thông tin bố</Text>
                </View>
                {isEditing ? (
                    <>
                        {renderInputBox('Họ và tên', 'contacts', 'name', false, 'father')}
                        {renderInputBox('Điện thoại', 'contacts', 'phone', false, 'father')}
                        <View style={styles.viewRow}><Text style={styles.viewLabel}>Nghề nghiệp</Text><Text style={styles.viewValue}>{profile?.contacts?.father?.job}</Text></View>
                    </>
                ) : (
                    <>
                        {renderValueRow('Họ và tên', profile?.contacts?.father?.name)}
                        {renderValueRow('Điện thoại', profile?.contacts?.father?.phone)}
                        {renderValueRow('Nghề nghiệp', profile?.contacts?.father?.job)}
                    </>
                )}
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="people-outline" size={18} color="#e84393" />
                    <Text style={styles.cardTitle}>Thông tin mẹ</Text>
                </View>
                {isEditing ? (
                    <>
                        {renderInputBox('Họ và tên', 'contacts', 'name', false, 'mother')}
                        {renderInputBox('Điện thoại', 'contacts', 'phone', false, 'mother')}
                        <View style={styles.viewRow}><Text style={styles.viewLabel}>Nghề nghiệp</Text><Text style={styles.viewValue}>{profile?.contacts?.mother?.job}</Text></View>
                    </>
                ) : (
                    <>
                        {renderValueRow('Họ và tên', profile?.contacts?.mother?.name)}
                        {renderValueRow('Điện thoại', profile?.contacts?.mother?.phone)}
                        {renderValueRow('Nghề nghiệp', profile?.contacts?.mother?.job)}
                    </>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3b5998" />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {renderHeader()}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 50, paddingTop: 10 }}
                    >
                        {activeTab === 1 && renderPersonalInfo()}
                        {activeTab === 2 && renderHealthInfo()}
                        {activeTab === 3 && renderContactInfo()}
                    </ScrollView>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: '#2b58de',
        paddingTop: 10,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    editBtn: {
        width: 36,
        height: 36,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center'
    },
    saveBtnWhite: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#2b58de'
    },
    saveBtnTextBlue: { color: '#2b58de', fontWeight: 'bold', fontSize: 13 },
    avatarSection: { alignItems: 'center', marginTop: 10 },
    avatarContainer: { position: 'relative' },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e1e8ef',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white'
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 6,
        borderRadius: 15,
        elevation: 2
    },
    profileName: { fontSize: 22, fontWeight: 'bold', color: 'white', marginTop: 15 },
    profileSubText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 25,
        borderRadius: 18,
        padding: 5,
        elevation: 3
    },
    tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 15 },
    activeTabItem: { backgroundColor: '#2b58de' },
    tabText: { fontSize: 14, fontWeight: '600', color: '#7f8c8d' },
    activeTabText: { color: 'white' },

    tabContent: { paddingHorizontal: 16, marginTop: 10 },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        elevation: 2
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginLeft: 10 },

    viewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6'
    },
    viewLabel: { fontSize: 14, color: '#7f8c8d' },
    viewValue: { fontSize: 15, color: '#2c3e50', fontWeight: 'bold', textAlign: 'right' },
    viewValueLight: { color: '#bdc3c7', fontWeight: '500' },

    row: { flexDirection: 'row', marginHorizontal: -4 },
    inputGroup: { marginBottom: 15 },
    fieldLabel: { fontSize: 13, color: '#7f8c8d', marginBottom: 8 },
    inputLabel: { fontSize: 13, color: '#7f8c8d', marginBottom: 8 },
    boundingBox: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#dcdde1',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#2c3e50',
        fontWeight: '500'
    },
    boundingBoxSmall: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#dcdde1',
        borderRadius: 8,
        width: '100%',
        paddingVertical: 6,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2b58de',
        marginTop: 5
    },

    healthStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    healthStatCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 5,
        elevation: 2
    },
    healthStatLabel: { fontSize: 12, color: '#7f8c8d', marginTop: 10, marginBottom: 5 },
    healthStatValue: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },

    importantNote: {
        backgroundColor: '#fff5f5',
        padding: 15,
        borderRadius: 15,
        marginVertical: 15,
        borderWidth: 1,
        borderColor: '#ffe8e8'
    },
    noteLabel: { fontSize: 11, fontWeight: 'bold', color: '#e74c3c', marginBottom: 10 },
    noteContent: { fontSize: 14, color: '#2c3e50', fontWeight: '500', lineHeight: 22 },
    noteInput: {
        fontSize: 14,
        color: '#2c3e50',
        fontWeight: '500',
        minHeight: 50,
        textAlignVertical: 'top'
    },
    addressText: { fontSize: 15, color: '#2c3e50', fontWeight: '600', lineHeight: 24, marginTop: 10 }
});
