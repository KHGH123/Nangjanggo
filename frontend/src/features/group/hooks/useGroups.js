import { useState } from 'react';

export function useGroups() {
    // TODO: 더미 데이터 제거 후 아래로 교체
    // import { useState, useEffect } from 'react';
    // import { getMyGroups } from '@/features/group/api/groupApi';
    // const [groups, setGroups] = useState([]);
    // const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null);
    // useEffect(() => {
    //     const fetchGroups = async () => {
    //         try { const data = await getMyGroups(); setGroups(data); }
    //         catch (e) { setError(e); }
    //         finally { setLoading(false); }
    //     };
    //     fetchGroups();
    // }, []);

    const [groups, setGroups] = useState([{ id: 1, groupName: '남제관', memberCount: 20 }]);

    const addGroup = (group) => {
        setGroups((prev) => [...prev, group]);
    };

    return { groups, loading: false, error: null, addGroup };
}
