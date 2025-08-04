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
            console.log('❌ No refresh token available');
            return false;
        }

        try {
            console.log('🔄 Attempting to refresh access token...');
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
                console.log('✅ Access token refreshed successfully');
                return true;
            } else {
                console.log('❌ Token refresh failed - server responded with error');
                return false;
            }
        } catch (error) {
            console.error('❌ Token refresh failed:', error);
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
                const storedRefreshToken = localStorage.getItem('kernelq_refresh_token');

                console.log('🔍 Auth check on page load:');
                console.log('  - User data:', !!storedUser);
                console.log('  - Access token:', !!storedAccessToken);
                console.log('  - Refresh token:', !!storedRefreshToken);
                console.log('  - Access token expired:', storedAccessToken ? isTokenExpired(storedAccessToken) : 'N/A');
                console.log('  - Refresh token expired:', storedRefreshToken ? isTokenExpired(storedRefreshToken) : 'N/A');

                if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    
                    // If we have both user data and tokens
                    if (storedAccessToken || storedRefreshToken) {
                        // Check if access token is expired (basic check)
                        if (!storedAccessToken || isTokenExpired(storedAccessToken)) {
                            console.log('🔒 Access token expired or missing, attempting refresh...');
                            
                            if (storedRefreshToken && !isTokenExpired(storedRefreshToken)) {
                                const refreshed = await refreshAccessToken();
                                if (!refreshed) {
                                    console.log('❌ Token refresh failed, user needs to login again');
                                    clearAuthData();
                                    setIsLoading(false);
                                    return;
                                }
                            } else {
                                console.log('❌ No valid refresh token, user needs to login again');
                                clearAuthData();
                                setIsLoading(false);
                                return;
                            }
                        }
                        
                        // If we get here, we have valid tokens
                        setUser(userData);
                        setIsAuthenticated(true);

                        if (storedProgress) {
                            setUserProgress(JSON.parse(storedProgress));
                        }
                    } else {
                        // User data exists but no tokens - clear everything
                        console.log('⚠️ User data found but no tokens, clearing auth data');
                        clearAuthData();
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
        console.log('🔐 Login function called with:', {
            userData: !!userData,
            progressData: !!progressData,
            accessToken: !!accessToken,
            refreshToken: !!refreshToken,
            accessTokenLength: accessToken?.length,
            refreshTokenLength: refreshToken?.length
        });

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
            console.log('💾 Storing access token:', accessToken.substring(0, 50) + '...');
            localStorage.setItem('kernelq_access_token', accessToken);
        } else {
            console.log('⚠️ No access token provided to login function');
        }
        
        if (refreshToken) {
            console.log('💾 Storing refresh token:', refreshToken.substring(0, 50) + '...');
            localStorage.setItem('kernelq_refresh_token', refreshToken);
        } else {
            console.log('⚠️ No refresh token provided to login function');
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

    // Debug function to check token status (for browser console)
    const debugTokens = () => {
        const user = localStorage.getItem('kernelq_user');
        const accessToken = localStorage.getItem('kernelq_access_token');
        const refreshToken = localStorage.getItem('kernelq_refresh_token');
        
        console.log('🐛 JWT Debug Info:');
        console.log('  User data:', user ? JSON.parse(user) : null);
        console.log('  Access token exists:', !!accessToken);
        console.log('  Refresh token exists:', !!refreshToken);
        console.log('  Access token expired:', accessToken ? isTokenExpired(accessToken) : 'N/A');
        console.log('  Refresh token expired:', refreshToken ? isTokenExpired(refreshToken) : 'N/A');
        
        if (accessToken) {
            try {
                const payload = JSON.parse(atob(accessToken.split('.')[1]));
                console.log('  Access token payload:', payload);
                console.log('  Access token expires at:', new Date(payload.exp * 1000).toLocaleString());
            } catch (e) {
                console.log('  Access token payload: Invalid');
            }
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
        getSolvedProblems,
        makeAuthenticatedRequest,
        debugTokens  // For debugging in browser console
    };
};

export default useAuth;