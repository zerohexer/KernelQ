/**
 * OAuth Callback Utilities for KernelQ
 * Handles Google OAuth callback and URL parameter processing
 */

export const OAuthCallbackHandler = {
    /**
     * Check if current page load is from OAuth callback
     * @returns {Object|null} OAuth data if callback detected, null otherwise
     */
    checkForOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check if this is an OAuth success callback
        if (urlParams.get('oauth_success') === 'true') {
            console.log('🔐 OAuth callback detected');
            
            const oauthData = {
                success: true,
                accessToken: urlParams.get('access_token'),
                refreshToken: urlParams.get('refresh_token'),
                userData: null,
                progressData: null,
                isNewUser: urlParams.get('is_new_user') === 'true'
            };
            
            // Parse user data
            try {
                const userDataParam = urlParams.get('user_data');
                if (userDataParam) {
                    oauthData.userData = JSON.parse(decodeURIComponent(userDataParam));
                }
            } catch (error) {
                console.warn('Failed to parse user_data:', error);
            }
            
            // Parse progress data
            try {
                const progressDataParam = urlParams.get('progress_data');
                if (progressDataParam) {
                    oauthData.progressData = JSON.parse(decodeURIComponent(progressDataParam));
                }
            } catch (error) {
                console.warn('Failed to parse progress_data:', error);
            }
            
            console.log('✅ OAuth callback data parsed:', {
                hasAccessToken: !!oauthData.accessToken,
                hasRefreshToken: !!oauthData.refreshToken,
                hasUserData: !!oauthData.userData,
                hasProgressData: !!oauthData.progressData,
                isNewUser: oauthData.isNewUser,
                userName: oauthData.userData?.username
            });
            
            // Clean up URL parameters
            this.cleanupURLParams();
            
            return oauthData;
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
     * Clean up OAuth-related URL parameters
     */
    cleanupURLParams() {
        const url = new URL(window.location);
        const paramsToRemove = [
            'oauth_success',
            'access_token',
            'refresh_token',
            'user_data',
            'progress_data',
            'is_new_user',
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