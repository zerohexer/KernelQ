const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { getDatabase } = require('../database');
const { generateAccessToken, generateRefreshToken } = require('./jwt-auth');
const OAUTH_CONFIG = require('../config/oauth');

/**
 * Google OAuth Strategy for KernelQ
 * Handles Google SSO authentication and user creation/login
 */

// Initialize Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: OAUTH_CONFIG.CLIENT_ID,
    clientSecret: OAUTH_CONFIG.CLIENT_SECRET,
    callbackURL: OAUTH_CONFIG.CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('🔐 Google OAuth callback received');
        console.log('👤 Google Profile:', {
            id: profile.id,
            displayName: profile.displayName,
            email: profile.emails?.[0]?.value,
            picture: profile.photos?.[0]?.value
        });

        const db = getDatabase();
        const googleEmail = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const displayName = profile.displayName;
        const profilePicture = profile.photos?.[0]?.value;

        if (!googleEmail) {
            return done(new Error('No email provided by Google'), null);
        }

        // Check if user already exists by email
        let existingUser = db.statements.getUserByEmail.get(googleEmail);
        
        if (existingUser) {
            console.log('✅ Existing user found, logging in:', existingUser.username);
            
            // Update last login
            db.statements.updateLastLogin.run(existingUser.id);
            
            // Get user progress
            const progress = await db.getUserProgress(existingUser.id);
            
            return done(null, {
                user: existingUser,
                progress: progress,
                isNewUser: false
            });
        } else {
            console.log('🆕 New Google user, creating account');
            
            // Generate username from email or display name
            const baseUsername = displayName?.replace(/\s+/g, '').toLowerCase() || 
                               googleEmail.split('@')[0].toLowerCase();
            
            // Ensure username is unique
            let username = baseUsername;
            let counter = 1;
            while (db.statements.getUserByUsername.get(username)) {
                username = `${baseUsername}${counter}`;
                counter++;
            }
            
            // Create new user with Google info
            // Note: We'll use a random password hash since they'll always login via Google
            const dummyPasswordHash = 'GOOGLE_SSO_USER_' + Date.now();
            
            const createResult = await db.createUser(
                username,
                googleEmail,
                dummyPasswordHash,
                'Standard Free User'
            );
            
            if (createResult.success) {
                const newUser = db.statements.getUserById.get(createResult.userId);
                const progress = await db.getUserProgress(createResult.userId);
                
                console.log('✅ New Google user created:', {
                    id: createResult.userId,
                    username: username,
                    email: googleEmail
                });
                
                return done(null, {
                    user: newUser,
                    progress: progress,
                    isNewUser: true
                });
            } else {
                return done(new Error('Failed to create user: ' + createResult.error), null);
            }
        }
    } catch (error) {
        console.error('❌ Google OAuth error:', error);
        return done(error, null);
    }
}));

// Serialize user for session
passport.serializeUser((userData, done) => {
    console.log('🔒 Serializing user for session:', userData.user?.id);
    done(null, userData);
});

// Deserialize user from session
passport.deserializeUser((userData, done) => {
    console.log('🔓 Deserializing user from session:', userData.user?.id);
    done(null, userData);
});

// Middleware to initialize Passport
const initializeGoogleOAuth = (app) => {
    // Configure session middleware (required for Passport)
    const session = require('express-session');
    
    app.use(session({
        secret: OAUTH_CONFIG.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: OAUTH_CONFIG.SECURE_COOKIES,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    }));
    
    // Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session());
    
    console.log('✅ Google OAuth middleware initialized');
};

// Route handlers for Google OAuth
const googleAuthRoutes = {
    // Start Google OAuth flow
    initiateAuth: (req, res, next) => {
        console.log('🚀 Starting Google OAuth flow');
        passport.authenticate('google', {
            scope: OAUTH_CONFIG.SCOPES
        })(req, res, next);
    },
    
    // Handle Google OAuth callback
    handleCallback: (req, res, next) => {
        console.log('📨 Handling Google OAuth callback');
        passport.authenticate('google', {
            failureRedirect: OAUTH_CONFIG.FAILURE_REDIRECT + '?error=oauth_failed'
        }, (err, userData) => {
            if (err) {
                console.error('❌ OAuth callback error:', err);
                return res.redirect(OAUTH_CONFIG.FAILURE_REDIRECT + '?error=oauth_error');
            }
            
            if (!userData) {
                console.log('❌ OAuth callback: no user data');
                return res.redirect(OAUTH_CONFIG.FAILURE_REDIRECT + '?error=no_user_data');
            }
            
            try {
                console.log('✅ OAuth successful, generating JWT tokens');
                
                // Generate JWT tokens
                const accessToken = generateAccessToken(userData.user);
                const refreshToken = generateRefreshToken(userData.user);
                
                // Create success redirect URL with tokens as query params
                // Note: In production, consider using secure httpOnly cookies instead
                const successUrl = new URL(OAUTH_CONFIG.SUCCESS_REDIRECT);
                successUrl.searchParams.append('oauth_success', 'true');
                successUrl.searchParams.append('access_token', accessToken);
                successUrl.searchParams.append('refresh_token', refreshToken);
                successUrl.searchParams.append('user_data', encodeURIComponent(JSON.stringify(userData.user)));
                successUrl.searchParams.append('progress_data', encodeURIComponent(JSON.stringify(userData.progress)));
                successUrl.searchParams.append('is_new_user', userData.isNewUser.toString());
                
                console.log('🔄 Redirecting to frontend with auth data');
                res.redirect(successUrl.toString());
                
            } catch (tokenError) {
                console.error('❌ JWT token generation error:', tokenError);
                res.redirect(OAUTH_CONFIG.FAILURE_REDIRECT + '?error=token_generation_failed');
            }
        })(req, res, next);
    }
};

module.exports = {
    initializeGoogleOAuth,
    googleAuthRoutes,
    passport
};