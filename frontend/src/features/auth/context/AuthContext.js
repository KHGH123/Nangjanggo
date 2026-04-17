import { createContext, useState, useEffect } from 'react';
import { getToken } from '@/features/auth/utils/authStorage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const checkToken = async () => {
            const token = await getToken();
            setIsLoggedIn(!!token);
            setIsReady(true);
        };
        checkToken();
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, isReady }}>
            {children}
        </AuthContext.Provider>
    );
}
