import { useState, useEffect } from 'react';

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [userProgress, setUserProgress] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing authentication on mount
    useEffect(() => {
        const checkAuthStatus = () => {
            try {
                const storedUser = localStorage.getItem('kernelq_user');
                const storedProgress = localStorage.getItem('kernelq_progress');

                if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                    setIsAuthenticated(true);

                    if (storedProgress) {
                        setUserProgress(JSON.parse(storedProgress));
                    }
                }
            } catch (error) {
                console.error('Error loading stored auth data:', error);
                localStorage.removeItem('kernelq_user');
                localStorage.removeItem('kernelq_progress');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    const login = (userData, progressData = null) => {
        setUser(userData);
        setUserProgress(progressData);
        setIsAuthenticated(true);

        localStorage.setItem('kernelq_user', JSON.stringify(userData));
        if (progressData) {
            localStorage.setItem('kernelq_progress', JSON.stringify(progressData));
        }
    };

    const logout = () => {
        setUser(null);
        setUserProgress(null);
        setIsAuthenticated(false);

        localStorage.removeItem('kernelq_user');
        localStorage.removeItem('kernelq_progress');
    };

    const updateProgress = (newProgress) => {
        setUserProgress(newProgress);
        localStorage.setItem('kernelq_progress', JSON.stringify(newProgress));
    };

    const recordProblemCompletion = async (problemData) => {
        if (!isAuthenticated || !user) return;

        try {
            const response = await fetch(`/api/user/${user.id}/problems/solved`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(problemData)
            });

            if (response.ok) {
                console.log('✅ Problem completion recorded in database');
            }
        } catch (error) {
            console.warn('Failed to record problem completion:', error);
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
        recordProblemCompletion
    };
};

export default useAuth;