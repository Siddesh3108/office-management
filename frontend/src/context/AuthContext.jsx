import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const username = localStorage.getItem('username');
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser({ username, role });
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);
        
        // This makes the ONE and ONLY API call
        const res = await api.post('/token', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, role } = res.data;

        localStorage.setItem('token', access_token);
        localStorage.setItem('role', role);
        localStorage.setItem('username', username);
        
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        setUser({ username, role });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);