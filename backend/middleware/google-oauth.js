const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { getDatabase } = require('../database');
const { generateAccessToken, generateRefreshToken } = require('./jwt-auth');
const OAUTH_CONFIG = require('../config/oauth');

/**
 * Google OAuth Strategy for KernelQ
 * Handles Google SSO authentication and user creation/login
 */

// OAuth callback handler function (shared between strategies)
const oauthCallbackHandler = async (accessToken, refreshToken, profile, done) => {
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
};

// Function to create dynamic Google strategy based on request
const createGoogleStrategy = (req) => {
    const host = req.get('host');
    const origin = req.get('origin');
    const referer = req.get('referer');
    let callbackURL;
    
    console.log('🔧 Dynamic strategy detection:');
    console.log('   Request Host:', host);
    console.log('   Request Origin:', origin);
    console.log('   Request Referer:', referer);
    console.log('   GOOGLE_CALLBACK_URL env:', process.env.GOOGLE_CALLBACK_URL);
    
    // Check if the request came from localhost (host, origin, or referer)
    const isLocalhost = (host && host.includes('localhost')) ||
                       (origin && origin.includes('localhost')) || 
                       (referer && referer.includes('localhost'));
    
    console.log('   Is localhost request?', isLocalhost);
    
    if (isLocalhost) {
        callbackURL = 'http://localhost:3001/api/auth/google/callback';
        console.log('   ✅ Using localhost callback');
    } else {
        // Use environment variable or default to kernelq.com
        callbackURL = process.env.GOOGLE_CALLBACK_URL || 'https://kernelq.com/api/auth/google/callback';
        console.log('   ✅ Using production/env callback');
    }
    
    console.log('🔧 Final callback URL:', callbackURL);
    
    return new GoogleStrategy({
        clientID: OAUTH_CONFIG.CLIENT_ID,
        clientSecret: OAUTH_CONFIG.CLIENT_SECRET,
        callbackURL: callbackURL
    }, oauthCallbackHandler);
};

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

// Helper function to detect frontend URL from request
const getFrontendUrlFromRequest = (req) => {
    // Get FRONTEND_URL from environment (set by shell script)
    const envFrontendUrl = process.env.FRONTEND_URL || OAUTH_CONFIG.SUCCESS_REDIRECT;
    
    // Check the Host header to detect if request came from localhost
    const host = req.get('host');
    let frontendUrl = envFrontendUrl; // default to environment
    
    if (host && host.includes('localhost')) {
        // If request came to localhost backend, redirect to localhost frontend
        frontendUrl = 'http://localhost:3000';
    } else {
        // For all other domains, use FRONTEND_URL from environment
        frontendUrl = envFrontendUrl;
    }
    
    console.log('🔄 OAuth redirect detection:');
    console.log('   Environment FRONTEND_URL:', envFrontendUrl);
    console.log('   Request Host:', host);
    console.log('   Final Frontend URL:', frontendUrl);
    
    return frontendUrl;
};

// Route handlers for Google OAuth
const googleAuthRoutes = {
    // Start Google OAuth flow
    initiateAuth: (req, res, next) => {
        console.log('🚀 Starting Google OAuth flow');
        
        // Create dynamic strategy based on request
        const strategy = createGoogleStrategy(req);
        const strategyName = `google-${req.get('host') || 'default'}`;
        
        // Register the dynamic strategy
        passport.use(strategyName, strategy);
        
        passport.authenticate(strategyName, {
            scope: OAUTH_CONFIG.SCOPES
        })(req, res, next);
    },
    
    // Handle Google OAuth callback
    handleCallback: (req, res, next) => {
        console.log('📨 Handling Google OAuth callback');
        const frontendUrl = getFrontendUrlFromRequest(req);
        
        // Create the same dynamic strategy for callback (in case it doesn't exist)
        const strategy = createGoogleStrategy(req);
        const strategyName = `google-${req.get('host') || 'default'}`;
        
        // Ensure the strategy is registered for callback
        passport.use(strategyName, strategy);
        
        passport.authenticate(strategyName, {
            failureRedirect: frontendUrl + '?error=oauth_failed'
        }, (err, userData) => {
            if (err) {
                console.error('❌ OAuth callback error:', err);
                return res.redirect(frontendUrl + '?error=oauth_error');
            }
            
            if (!userData) {
                console.log('❌ OAuth callback: no user data');
                return res.redirect(frontendUrl + '?error=no_user_data');
            }
            
            try {
                console.log('✅ OAuth successful, generating JWT tokens');

                // Generate JWT tokens
                const accessToken = generateAccessToken(userData.user);
                const refreshToken = generateRefreshToken(userData.user);

                // Prepare auth data for secure cookie storage
                const authData = {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    user_data: userData.user,
                    progress_data: userData.progress,
                    is_new_user: userData.isNewUser
                };

                // Set httpOnly cookie with auth data (secure, not accessible via JavaScript)
                // This prevents tokens from being exposed in URLs, browser history, or referer headers
                const isProduction = process.env.NODE_ENV === 'production';
                res.cookie('kernelq_oauth_session', JSON.stringify(authData), {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: isProduction ? 'strict' : 'lax',
                    maxAge: 5 * 60 * 1000, // 5 minutes - short-lived for security
                    path: '/'
                });

                // Redirect with only a success flag - no sensitive data in URL
                const successUrl = new URL(frontendUrl);
                successUrl.searchParams.append('oauth_success', 'true');

                console.log('🔄 Redirecting to frontend (tokens in httpOnly cookie)');
                res.redirect(successUrl.toString());
                
            } catch (tokenError) {
                console.error('❌ JWT token generation error:', tokenError);
                res.redirect(frontendUrl + '?error=token_generation_failed');
            }
        })(req, res, next);
    }
};

module.exports = {
    initializeGoogleOAuth,
    googleAuthRoutes,
    passport
};