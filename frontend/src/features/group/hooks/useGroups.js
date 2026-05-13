import { useState, useEffect, useCallback } from 'react';
import { getMyGroups, createGroup, joinGroup } from '@/features/group/api/groupApi';

export function useGroups() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchGroups = useCallback(async () => {
        try {
            const data = await getMyGroups();
            setGroups(data);
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const addGroup = async (groupData) => {
        const groupId = await createGroup(groupData);
        const data = await getMyGroups();
        setGroups(data);
        return groupId;
    };

    const joinGroupByCode = async (groupData) => {
        await joinGroup(groupData);
        const data = await getMyGroups();
        setGroups(data);
    };

    return { groups, loading, error, addGroup, joinGroupByCode, refreshGroups: fetchGroups };
}
