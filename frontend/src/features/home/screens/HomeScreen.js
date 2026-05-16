import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    BackHandler,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Header from '@/shared/components/Header';
import GroupCard from '@/features/group/components/GroupCard';
import CreateGroupModal from '@/features/group/components/CreateGroupModal';
import JoinGroupModal from '@/features/group/components/JoinGroupModal';
import { useGroups } from '@/features/group/hooks/useGroups';
import { colors } from '@/shared/constants/colors';


export default function HomeScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { groups, loading, error, addGroup, joinGroupByCode, refreshGroups } = useGroups();
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [joinModalVisible, setJoinModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortByName, setSortByName] = useState(false);
    const [adminOnly, setAdminOnly] = useState(false);

    const handleCreateGroup = async (group) => {
        const groupId = await addGroup(group);
        setCreateModalVisible(false);
        return groupId;
    };

    const handleJoinGroup = async (group) => {
        await joinGroupByCode(group);
    };

    useFocusEffect(
        useCallback(() => {
            refreshGroups();

            const onBackPress = () => {
                Alert.alert('앱 종료', '앱을 종료하시겠습니까?', [
                    { text: '취소', style: 'cancel' },
                    { text: '종료', style: 'destructive', onPress: () => BackHandler.exitApp() },
                ]);
                return true;
            };
            const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => sub.remove();
        }, [refreshGroups])
    );

    const filteredGroups = useMemo(() => {
        let result = [...groups];

        if (searchQuery.trim()) {
            result = result.filter(g =>
                g.groupName.toLowerCase().includes(searchQuery.trim().toLowerCase())
            );
        }

        if (adminOnly) {
            result = result.filter(g => g.admin);
        }

        if (sortByName) {
            result.sort((a, b) => a.groupName.localeCompare(b.groupName, 'ko'));
        }

        return result;
    }, [groups, searchQuery, adminOnly, sortByName]);

    const renderContent = () => {
        if (loading) {
            return <ActivityIndicator style={styles.center} color={colors.primary} />;
        }
        if (error) {
            return <Text style={styles.message}>그룹 정보를 불러오지 못했어요.</Text>;
        }
        if (filteredGroups.length === 0) {
            return (
                <Text style={styles.message}>
                    {searchQuery.trim() || adminOnly ? '조건에 맞는 그룹이 없어요.' : '참여 중인 그룹이 없어요.'}
                </Text>
            );
        }
        return filteredGroups.map((group) => (
            <GroupCard
                key={group.id}
                group={group}
                onPress={() => navigation.navigate('GroupHomeScreen', { group })}
            />
        ));
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Header navigation={navigation} />

            <View style={styles.container}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={18} color={colors.placeholder} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="그룹 검색"
                        placeholderTextColor={colors.placeholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={16} color={colors.placeholder} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.sortRow}>
                    <View style={styles.sortSpacer} />
                    <TouchableOpacity
                        style={[styles.sortChip, sortByName && styles.sortChipActive]}
                        onPress={() => setSortByName(v => !v)}
                    >
                        <Text style={[styles.sortChipText, sortByName && styles.sortChipTextActive]}>이름순</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sortChip, adminOnly && styles.adminChipActive]}
                        onPress={() => setAdminOnly(v => !v)}
                    >
                        <Text style={[styles.sortChipText, adminOnly && styles.sortChipTextActive]}>관리중</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {renderContent()}
                </ScrollView>

                <View style={styles.bottomButtons}>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => setCreateModalVisible(true)}>
                        <Text style={styles.primaryButtonText}>그룹 만들기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => setJoinModalVisible(true)}>
                        <Text style={styles.secondaryButtonText}>그룹 참여하기</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <CreateGroupModal
                visible={createModalVisible}
                onClose={() => setCreateModalVisible(false)}
                onSubmit={handleCreateGroup}
            />
            <JoinGroupModal
                visible={joinModalVisible}
                onClose={() => setJoinModalVisible(false)}
                onJoined={handleJoinGroup}
            />

            {/* TODO: 개발용 임시 버튼 - NFC 연동 완료 후 삭제 */}
            <TouchableOpacity
                style={styles.devNfcButton}
                onPress={() => navigation.navigate('FoodCreateByNFC')}
            >
                <Text style={styles.devButtonText}>(임시 NFC)</Text>
            </TouchableOpacity>
            {/* TODO: 여기까지 삭제 */}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.white,
    },
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        marginHorizontal: 16,
        marginTop: 14,
        marginBottom: 8,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
        padding: 0,
    },
    sortRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 10,
    },
    sortSpacer: {
        flex: 1,
    },
    sortChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sortChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    adminChipActive: {
        backgroundColor: '#FF9500',
        borderColor: '#FF9500',
    },
    sortChipText: {
        fontSize: 13,
        color: colors.placeholder,
        fontWeight: '500',
    },
    sortChipTextActive: {
        color: colors.white,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 12,
        flexGrow: 1,
    },
    center: {
        marginTop: 40,
    },
    message: {
        textAlign: 'center',
        marginTop: 40,
        color: colors.placeholder,
        fontSize: 14,
    },
    bottomButtons: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '600',
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: colors.disabled,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '600',
    },
    // TODO: 개발용 임시 스타일 - NFC 연동 완료 후 삭제
    devNfcButton: {
        position: 'absolute',
        bottom: 150,
        right: 20,
        backgroundColor: '#FF6B35',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    devButtonText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '700',
    },
    // TODO: 여기까지 삭제
});
