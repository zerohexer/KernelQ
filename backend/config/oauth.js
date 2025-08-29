/**
 * Google OAuth Configuration for KernelQ
 * 
 * Setup Instructions:
 * 1. Go to Google Cloud Console (https://console.cloud.google.com/)
 * 2. Create a new project or select existing project
 * 3. Enable Google+ API and Google OAuth2 API
 * 4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
 * 5. Set Application type to "Web application"
 * 6. Add authorized origins:
 *    - http://localhost:3000 (development frontend)
 *    - http://localhost:3001 (development backend)
 *    - Your production domains
 * 7. Add authorized redirect URIs:
 *    - http://localhost:3001/api/auth/google/callback (development)
 *    - https://your-domain.com/api/auth/google/callback (production)
 * 8. Copy Client ID and Client Secret
 * 9. Set environment variables or update this config
 */

const GOOGLE_OAUTH_CONFIG = {
    // Google OAuth Client Configuration
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id-here',
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret-here',
    
    // Callback URLs
    CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
    
    // Frontend redirect URLs (after successful OAuth)
    SUCCESS_REDIRECT: process.env.FRONTEND_URL || 'http://localhost:3000',
    FAILURE_REDIRECT: process.env.FRONTEND_URL || 'http://localhost:3000',
    
    // OAuth Scopes - what info we want from Google
    SCOPES: [
        'profile',     // Basic profile info (name, picture)
        'email'        // Email address
    ],
    
    // Session configuration
    SESSION_SECRET: process.env.SESSION_SECRET || 'kernelq-oauth-session-secret-change-in-production',
    
    // Development vs Production settings
    DOMAIN: process.env.NODE_ENV === 'production' ? 'your-domain.com' : 'localhost',
    SECURE_COOKIES: process.env.NODE_ENV === 'production',
};

// Validation - warn if using default values
if (GOOGLE_OAUTH_CONFIG.CLIENT_ID === 'your-google-client-id-here') {
    console.warn('⚠️  Using default Google Client ID - please set GOOGLE_CLIENT_ID environment variable');
}

if (GOOGLE_OAUTH_CONFIG.CLIENT_SECRET === 'your-google-client-secret-here') {
    console.warn('⚠️  Using default Google Client Secret - please set GOOGLE_CLIENT_SECRET environment variable');
}

if (GOOGLE_OAUTH_CONFIG.SESSION_SECRET === 'kernelq-oauth-session-secret-change-in-production') {
    console.warn('⚠️  Using default session secret - please set SESSION_SECRET environment variable');
}

module.exports = GOOGLE_OAUTH_CONFIG;