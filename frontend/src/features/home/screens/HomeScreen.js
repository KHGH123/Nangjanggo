import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/shared/components/Header';
import GroupCard from '@/features/group/components/GroupCard';
import CreateGroupModal from '@/features/group/components/CreateGroupModal';
import JoinGroupModal from '@/features/group/components/JoinGroupModal';
import { useGroups } from '@/features/group/hooks/useGroups';
import { colors } from '@/shared/constants/colors';

export default function HomeScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { groups, loading, error, addGroup } = useGroups();
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [joinModalVisible, setJoinModalVisible] = useState(false);

    const handleCreateGroup = (group) => {
        addGroup(group);
        setCreateModalVisible(false);
    };

    const handleJoinGroup = (group) => {
        addGroup(group);
    };

    const renderContent = () => {
        if (loading) {
            return <ActivityIndicator style={styles.center} color={colors.primary} />;
        }
        if (error) {
            return <Text style={styles.message}>그룹 정보를 불러오지 못했어요.</Text>;
        }
        if (groups.length === 0) {
            return <Text style={styles.message}>참여 중인 그룹이 없어요.</Text>;
        }
        return groups.map((group) => (
            <GroupCard key={group.id} group={group} onPress={() => {}} />
        ));
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Header navigation={navigation} />
            <View style={styles.container}>
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
});
