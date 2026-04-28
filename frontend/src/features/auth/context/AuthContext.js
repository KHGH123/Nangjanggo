import { createContext, useState, useEffect } from 'react';
import { getToken } from '@/features/auth/utils/authStorage';
import { getMe } from '@/features/auth/api/authApi';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [user, setUser] = useState(null);
    const [pendingRoute, setPendingRoute] = useState(null);

    useEffect(() => {
        const checkToken = async () => {
            const token = await getToken();
            if (token) {
                setIsLoggedIn(true);
                try {
                    const data = await getMe();
                    setUser(data);
                } catch {
                    setUser(null);
                }
            }
            setIsReady(true);
        };
        checkToken();
    }, []);

    useEffect(() => {
        if (!isLoggedIn) {
            setUser(null);
            return;
        }
        getToken().then(token => {
            if (!token) return;
            getMe().then(setUser).catch(() => setUser(null));
        });
    }, [isLoggedIn]);

    return (
        <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, isReady, user, setUser, pendingRoute, setPendingRoute }}>
            {children}
        </AuthContext.Provider>
    );
}
