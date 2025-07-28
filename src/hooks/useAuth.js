import { useState, useEffect } from 'react';

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [userProgress, setUserProgress] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // JWT Helper Functions
    const isTokenExpired = (token) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    };

    const getAuthHeaders = () => {
        const accessToken = localStorage.getItem('kernelq_access_token');
        return accessToken ? {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        } : {
            'Content-Type': 'application/json'
        };
    };

    const refreshAccessToken = async () => {
        const refreshToken = localStorage.getItem('kernelq_refresh_token');
        if (!refreshToken) {
            logout();
            return false;
        }

        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshToken}`
                }
            });

            if (response.ok) {
                const { accessToken: newAccessToken } = await response.json();
                localStorage.setItem('kernelq_access_token', newAccessToken);
                return true;
            } else {
                logout();
                return false;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
            return false;
        }
    };

    // Check for existing authentication on mount
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const storedUser = localStorage.getItem('kernelq_user');
                const storedProgress = localStorage.getItem('kernelq_progress');
                const storedAccessToken = localStorage.getItem('kernelq_access_token');

                if (storedUser && storedAccessToken) {
                    const userData = JSON.parse(storedUser);
                    
                    // Check if token is expired (basic check)
                    if (isTokenExpired(storedAccessToken)) {
                        console.log('🔒 Access token expired, attempting refresh...');
                        const refreshed = await refreshAccessToken();
                        if (!refreshed) {
                            setIsLoading(false);
                            return;
                        }
                    }
                    
                    setUser(userData);
                    setIsAuthenticated(true);

                    if (storedProgress) {
                        setUserProgress(JSON.parse(storedProgress));
                    }
                }
            } catch (error) {
                console.error('Error loading stored auth data:', error);
                clearAuthData();
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    const login = (userData, progressData = null, accessToken = null, refreshToken = null) => {
        setUser(userData);
        setUserProgress(progressData);
        setIsAuthenticated(true);

        // Store user data and progress
        localStorage.setItem('kernelq_user', JSON.stringify(userData));
        if (progressData) {
            localStorage.setItem('kernelq_progress', JSON.stringify(progressData));
        }
        
        // Store JWT tokens
        if (accessToken) {
            localStorage.setItem('kernelq_access_token', accessToken);
        }
        if (refreshToken) {
            localStorage.setItem('kernelq_refresh_token', refreshToken);
        }
    };

    const logout = () => {
        setUser(null);
        setUserProgress(null);
        setIsAuthenticated(false);

        clearAuthData();
    };

    const clearAuthData = () => {
        localStorage.removeItem('kernelq_user');
        localStorage.removeItem('kernelq_progress');
        localStorage.removeItem('kernelq_access_token');
        localStorage.removeItem('kernelq_refresh_token');
    };

    const makeAuthenticatedRequest = async (url, options = {}) => {
        let headers = getAuthHeaders();
        
        try {
            let response = await fetch(url, {
                ...options,
                headers: { ...headers, ...options.headers }
            });

            // If token expired, try to refresh and retry
            if (response.status === 401) {
                const responseData = await response.json();
                if (responseData.code === 'TOKEN_EXPIRED') {
                    console.log('🔒 Token expired, refreshing...');
                    const refreshed = await refreshAccessToken();
                    
                    if (refreshed) {
                        headers = getAuthHeaders();
                        response = await fetch(url, {
                            ...options,
                            headers: { ...headers, ...options.headers }
                        });
                    }
                }
            }

            return response;
        } catch (error) {
            console.error('Authenticated request failed:', error);
            throw error;
        }
    };

    const updateProgress = (newProgress) => {
        setUserProgress(newProgress);
        localStorage.setItem('kernelq_progress', JSON.stringify(newProgress));
    };

    const recordProblemCompletion = async (problemData) => {
        if (!isAuthenticated || !user) return;

        try {
            const response = await makeAuthenticatedRequest(`/api/user/${user.id}/problems/solved`, {
                method: 'POST',
                body: JSON.stringify(problemData)
            });

            if (response.ok) {
                console.log('✅ Problem completion recorded in database');
            }
        } catch (error) {
            console.warn('Failed to record problem completion:', error);
        }
    };

    const getSolvedProblems = async (phase = null) => {
        console.log('🔗 getSolvedProblems called:', { isAuthenticated, userId: user?.id, phase });
        
        if (!isAuthenticated || !user) {
            console.log('❌ Cannot fetch solved problems: not authenticated or no user');
            return [];
        }

        try {
            const url = phase ? 
                `/api/user/${user.id}/problems/solved?phase=${phase}` : 
                `/api/user/${user.id}/problems/solved`;
            
            console.log('🌐 Fetching from URL:', url);
            const response = await makeAuthenticatedRequest(url);
            console.log('📡 Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 API response data:', data);
                console.log('📊 Loaded solved problems from database:', data.problems?.length || 0);
                return data.problems || [];
            } else {
                console.warn('❌ Failed to fetch solved problems:', response.status);
                return [];
            }
        } catch (error) {
            console.warn('❌ Error fetching solved problems:', error);
            return [];
        }
    };

    return {
        user,
        userProgress,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateProgress,
        recordProblemCompletion,
        getSolvedProblems
    };
};

export default useAuth;