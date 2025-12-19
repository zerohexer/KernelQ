/**
 * OAuth Callback Utilities for KernelQ
 * Handles Google OAuth callback with secure session exchange
 */

export const OAuthCallbackHandler = {
    /**
     * Check if current page load is from OAuth callback
     * If so, securely retrieve auth data from backend via httpOnly cookie
     * @returns {Promise<Object|null>} OAuth data if callback detected, null otherwise
     */
    async checkForOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);

        // Check if this is an OAuth success callback
        if (urlParams.get('oauth_success') === 'true') {
            console.log('🔐 OAuth callback detected, fetching session data securely...');

            // Clean up URL parameter immediately (removes oauth_success from URL)
            this.cleanupURLParams();

            try {
                // Fetch auth data from secure session endpoint
                // The backend reads from httpOnly cookie (not accessible via JS)
                const backendUrl = this.getBackendUrl();
                const response = await fetch(`${backendUrl}/auth/session`, {
                    method: 'GET',
                    credentials: 'include' // Important: send cookies with request
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('❌ Session exchange failed:', errorData.error || response.statusText);
                    return {
                        success: false,
                        error: errorData.error || 'Failed to complete sign-in. Please try again.'
                    };
                }

                const sessionData = await response.json();

                if (!sessionData.success) {
                    console.error('❌ Session exchange returned error:', sessionData.error);
                    return {
                        success: false,
                        error: sessionData.error || 'Failed to complete sign-in. Please try again.'
                    };
                }

                const oauthData = {
                    success: true,
                    accessToken: sessionData.accessToken,
                    refreshToken: sessionData.refreshToken,
                    userData: sessionData.userData,
                    progressData: sessionData.progressData,
                    isNewUser: sessionData.isNewUser
                };

                console.log('✅ OAuth session data retrieved securely:', {
                    hasAccessToken: !!oauthData.accessToken,
                    hasRefreshToken: !!oauthData.refreshToken,
                    hasUserData: !!oauthData.userData,
                    hasProgressData: !!oauthData.progressData,
                    isNewUser: oauthData.isNewUser,
                    userName: oauthData.userData?.username
                });

                return oauthData;

            } catch (error) {
                console.error('❌ Failed to fetch session data:', error);
                return {
                    success: false,
                    error: 'Network error during sign-in. Please try again.'
                };
            }
        }

        // Check if this is an OAuth error callback
        const errorParam = urlParams.get('error');
        if (errorParam) {
            console.error('❌ OAuth error detected:', errorParam);

            // Clean up URL parameters
            this.cleanupURLParams();

            return {
                success: false,
                error: this.getErrorMessage(errorParam)
            };
        }

        return null;
    },

    /**
     * Get backend URL based on environment
     * @returns {string}
     */
    getBackendUrl() {
        return process.env.REACT_APP_BACKEND_URL ||
               (window.location.origin.includes('kernelq.com') ?
                'https://kernelq.com/api' :
                'http://localhost:3001/api');
    },

    /**
     * Clean up OAuth-related URL parameters
     */
    cleanupURLParams() {
        const url = new URL(window.location);
        const paramsToRemove = [
            'oauth_success',
            'error'
        ];

        paramsToRemove.forEach(param => {
            url.searchParams.delete(param);
        });

        // Update URL without refreshing page
        window.history.replaceState({}, document.title, url.toString());
        console.log('🧹 OAuth URL parameters cleaned up');
    },

    /**
     * Get user-friendly error message
     * @param {string} errorCode
     * @returns {string}
     */
    getErrorMessage(errorCode) {
        const errorMessages = {
            'oauth_failed': 'Google Sign-In was cancelled or failed. Please try again.',
            'oauth_error': 'An error occurred during Google Sign-In. Please try again.',
            'no_user_data': 'Failed to retrieve user information from Google. Please try again.',
            'token_generation_failed': 'Failed to create authentication tokens. Please try again.',
            'access_denied': 'Access was denied. Please try again and approve the permissions.',
            'invalid_request': 'Invalid request. Please try again.'
        };

        return errorMessages[errorCode] || 'An unexpected error occurred during sign-in. Please try again.';
    },

    /**
     * Validate OAuth data completeness
     * @param {Object} oauthData
     * @returns {boolean}
     */
    validateOAuthData(oauthData) {
        if (!oauthData || !oauthData.success) {
            return false;
        }

        const requiredFields = ['accessToken', 'refreshToken', 'userData'];
        const missingFields = requiredFields.filter(field => !oauthData[field]);

        if (missingFields.length > 0) {
            console.error('❌ OAuth data validation failed. Missing fields:', missingFields);
            return false;
        }

        // Validate user data structure
        if (!oauthData.userData.id || !oauthData.userData.email || !oauthData.userData.username) {
            console.error('❌ OAuth user data validation failed. Missing required user fields.');
            return false;
        }

        console.log('✅ OAuth data validation passed');
        return true;
    },

    /**
     * Get Google OAuth URL for manual redirect (fallback)
     * @returns {string}
     */
    getGoogleOAuthUrl() {
        const backendUrl = process.env.REACT_APP_BACKEND_URL ||
                          (window.location.origin.includes('kernelq.com') ?
                           'https://kernelq.com/api' :
                           'http://localhost:3001');

        return `${backendUrl}/auth/google`;
    }
};
