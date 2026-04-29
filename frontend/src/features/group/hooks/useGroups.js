import { useState, useEffect } from 'react';
import { getMyGroups, createGroup, joinGroup } from '@/features/group/api/groupApi';

export function useGroups() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const data = await getMyGroups();
                setGroups(data);
            } catch (e) {
                setError(e);
            } finally {
                setLoading(false);
            }
        };
        fetchGroups();
    }, []);

    const addGroup = async (groupData) => {
        const saved = await createGroup(groupData);
        setGroups((prev) => [...prev, saved]);
    };

    const joinGroupByCode = async (groupData) => {
        await joinGroup(groupData);
        const data = await getMyGroups();
        setGroups(data);
    };

    return { groups, loading, error, addGroup, joinGroupByCode };
}
