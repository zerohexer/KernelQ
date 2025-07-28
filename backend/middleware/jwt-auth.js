const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// JWT Configuration - Hardcoded for easy development
const JWT_SECRET = 'AZ2402-TFF';
const JWT_EXPIRES_IN = '1h';                    // Access token expires in 1 hour
const REFRESH_TOKEN_EXPIRES_IN = '7d';          // Refresh token expires in 7 days

// Rate limiting for auth endpoints - 5 attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,                     // 15 minutes
    max: 5,                                       // 5 attempts per window
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Handle proxy environments (Cloudflare, tunnels)
    keyGenerator: (req) => {
        // Use CF-Connecting-IP for Cloudflare, fallback to x-forwarded-for, then remote IP
        return req.headers['cf-connecting-ip'] || 
               req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress || 
               req.ip;
    }
});

// Generate JWT access token
function generateAccessToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            username: user.username,
            email: user.email,
            memberStatus: user.member_status
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

// Generate refresh token
function generateRefreshToken(user) {
    return jwt.sign(
        { userId: user.id },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );
}

// JWT Authentication Middleware (replaces x-user-id header auth)
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required - no token provided'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }
            return res.status(403).json({
                success: false,
                error: 'Invalid token'
            });
        }

        // Add user info to request object
        req.user = decoded;
        req.userId = decoded.userId;
        next();
    });
}

// User ID Parameter Protection (enhanced with JWT)
function protectUserData(req, res, next) {
    // Extract userId from URL path like /api/user/123/progress -> 123  
    // Same logic as original working code
    const urlParts = req.path.split('/');
    const requestedUserId = urlParts[3]; // /api/user/[userId]/...

    console.log(`🔒 JWT User ID Protection`);
    console.log(`📋 Full path: ${req.path}`);
    console.log(`📋 URL parts:`, urlParts);
    console.log(`📋 req.user:`, req.user);
    console.log(`📋 req.userId:`, req.userId);
    console.log(`📋 Authenticated User ID: ${req.userId}, Requested User ID: ${requestedUserId}`);

    // Check if req.userId exists (should be set by authenticateJWT)
    if (!req.userId) {
        console.log('❌ No userId found in request object');
        return res.status(500).json({
            success: false,
            error: 'Authentication error - no user ID found'
        });
    }

    // Ensure user can only access their own data
    if (req.userId.toString() !== requestedUserId.toString()) {
        console.log('❌ Access denied - user trying to access another user\'s data');
        return res.status(403).json({
            success: false,
            error: 'Access denied - you can only access your own data'
        });
    }

    console.log('✅ JWT Authorization passed - user can access their own data');
    next();
}

// Combined middleware for /api/user/ endpoints
function protectUserEndpoints(req, res, next) {
    // Apply JWT authentication first
    authenticateJWT(req, res, () => {
        // If we get here, JWT auth succeeded, now check user data protection
        protectUserData(req, res, next);
    });
}

module.exports = {
    JWT_SECRET,
    JWT_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN,
    authLimiter,
    generateAccessToken,
    generateRefreshToken,
    authenticateJWT,
    protectUserData,
    protectUserEndpoints
};
