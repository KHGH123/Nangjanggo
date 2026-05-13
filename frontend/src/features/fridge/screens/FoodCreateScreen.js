import React, { useState, useEffect, useContext } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Modal, FlatList,
    ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import { AuthContext } from '@/features/auth/context/AuthContext';
import { getMyGroups } from '@/features/group/api/groupApi';
import { getFridges } from '@/features/fridge/api/fridgeApi';
import { createFood } from '@/features/food/api/foodApi';

export default function FoodCreateScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { user } = useContext(AuthContext);
    const nfcFridgeId = route?.params?.fridgeId ? Number(route.params.fridgeId) : null;

    const [groups, setGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupModalVisible, setGroupModalVisible] = useState(false);

    const [fridges, setFridges] = useState([]);
    const [fridgesLoading, setFridgesLoading] = useState(false);
    const [selectedFridge, setSelectedFridge] = useState(null);
    const [fridgeModalVisible, setFridgeModalVisible] = useState(false);

    const [foodName, setFoodName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [memo, setMemo] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const data = await getMyGroups();
                setGroups(data);
            } catch (e) {
                Alert.alert('오류', '그룹 목록을 불러오지 못했습니다.');
            } finally {
                setGroupsLoading(false);
            }
        };
        fetchGroups();
    }, []);

    useEffect(() => {
        if (!selectedGroup) {
            setFridges([]);
            setSelectedFridge(null);
            return;
        }
        const fetchFridges = async () => {
            setFridgesLoading(true);
            try {
                const data = await getFridges(selectedGroup.id);
                setFridges(data);
                if (nfcFridgeId) {
                    const matched = data.find(f => f.id === nfcFridgeId);
                    if (matched) setSelectedFridge(matched);
                }
            } catch (e) {
                Alert.alert('오류', '냉장고 목록을 불러오지 못했습니다.');
            } finally {
                setFridgesLoading(false);
            }
        };
        fetchFridges();
    }, [selectedGroup]);

    const handleSubmit = async () => {
        const fridgeId = selectedFridge?.id;
        if (!fridgeId) {
            Alert.alert('냉장고를 선택해주세요');
            return;
        }
        if (!foodName.trim()) {
            Alert.alert('음식 이름을 입력해주세요');
            return;
        }
        try {
            setSubmitting(true);
            await createFood(fridgeId, { name: foodName.trim(), quantity, memo: memo.trim() });
            Alert.alert('완료', '음식이 저장되었습니다.', [
                { text: '확인', onPress: () => navigation.popToTop() },
            ]);
        } catch (e) {
            Alert.alert('오류', '음식 저장에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.popToTop()}>
                    <Text style={styles.backText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.title}>음식 저장</Text>
            </View>

            <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>

                <View style={styles.field}>
                    <Text style={styles.label}>그룹</Text>
                    {groupsLoading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : (
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => setGroupModalVisible(true)}
                        >
                            <Text style={selectedGroup ? styles.dropdownText : styles.dropdownPlaceholder}>
                                {selectedGroup ? selectedGroup.groupName : '그룹을 선택하세요'}
                            </Text>
                            <Text style={styles.dropdownArrow}>▾</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>냉장고</Text>
                    {fridgesLoading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : (
                        <TouchableOpacity
                            style={[styles.dropdown, !selectedGroup && styles.dropdownDisabled]}
                            onPress={() => selectedGroup && setFridgeModalVisible(true)}
                        >
                            <Text style={selectedFridge ? styles.dropdownText : styles.dropdownPlaceholder}>
                                {!selectedGroup
                                    ? '그룹을 먼저 선택하세요'
                                    : selectedFridge
                                        ? selectedFridge.fridgeName
                                        : '냉장고를 선택하세요'}
                            </Text>
                            <Text style={styles.dropdownArrow}>▾</Text>
                        </TouchableOpacity>
                    )}
                    {nfcFridgeId && selectedFridge && (
                        <Text style={styles.nfcHint}>NFC로 냉장고가 자동 선택되었습니다</Text>
                    )}
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>음식</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="음식 이름을 입력하세요"
                        placeholderTextColor={colors.placeholder}
                        value={foodName}
                        onChangeText={setFoodName}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>수량</Text>
                    <View style={styles.stepper}>
                        <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => setQuantity(q => Math.max(1, q - 1))}
                        >
                            <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{quantity}</Text>
                        <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => setQuantity(q => q + 1)}
                        >
                            <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>메모</Text>
                    <TextInput
                        style={[styles.input, styles.memoInput]}
                        placeholder="메모 (선택)"
                        placeholderTextColor={colors.placeholder}
                        value={memo}
                        onChangeText={setMemo}
                        multiline
                        textAlignVertical="top"
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting
                        ? <ActivityIndicator color={colors.white} />
                        : <Text style={styles.submitText}>출력하기</Text>
                    }
                </TouchableOpacity>
            </View>

            <Modal visible={groupModalVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    onPress={() => setGroupModalVisible(false)}
                >
                    <View style={styles.modalBox}>
                        {groups.length === 0 ? (
                            <Text style={styles.modalEmpty}>가입한 그룹이 없어요.</Text>
                        ) : (
                            <FlatList
                                data={groups}
                                keyExtractor={item => String(item.id)}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.modalItem}
                                        onPress={() => {
                                            setSelectedGroup(item);
                                            setGroupModalVisible(false);
                                        }}
                                    >
                                        <Text style={styles.modalItemText}>{item.groupName}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={fridgeModalVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    onPress={() => setFridgeModalVisible(false)}
                >
                    <View style={styles.modalBox}>
                        {fridges.length === 0 ? (
                            <Text style={styles.modalEmpty}>냉장고가 없어요.</Text>
                        ) : (
                            <FlatList
                                data={fridges}
                                keyExtractor={item => String(item.id)}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.modalItem}
                                        onPress={() => {
                                            setSelectedFridge(item);
                                            setFridgeModalVisible(false);
                                        }}
                                    >
                                        <Text style={styles.modalItemText}>{item.fridgeName}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backText: {
        fontSize: 32,
        color: colors.text,
        lineHeight: 36,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
    },
    form: {
        flex: 1,
    },
    formContent: {
        padding: 20,
        gap: 24,
    },
    field: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.label,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
    },
    memoInput: {
        height: 120,
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    dropdownDisabled: {
        backgroundColor: '#F5F5F5',
    },
    dropdownText: {
        fontSize: 15,
        color: colors.text,
    },
    dropdownPlaceholder: {
        fontSize: 15,
        color: colors.placeholder,
    },
    dropdownArrow: {
        fontSize: 14,
        color: colors.placeholder,
    },
    nfcHint: {
        fontSize: 12,
        color: colors.primary,
        marginTop: 2,
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    stepperBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperBtnText: {
        fontSize: 20,
        color: colors.text,
        lineHeight: 24,
    },
    stepperValue: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        minWidth: 24,
        textAlign: 'center',
    },
    footer: {
        padding: 20,
    },
    submitButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        padding: 40,
    },
    modalBox: {
        backgroundColor: colors.white,
        borderRadius: 12,
        overflow: 'hidden',
        maxHeight: 300,
    },
    modalItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalItemText: {
        fontSize: 15,
        color: colors.text,
    },
    modalEmpty: {
        padding: 20,
        fontSize: 14,
        color: colors.placeholder,
        textAlign: 'center',
    },
});
