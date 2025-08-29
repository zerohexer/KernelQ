# Google SSO Setup Guide for KernelQ

This guide walks you through setting up Google Single Sign-On (SSO) for your KernelQ kernel development platform.

## 🚀 Quick Start

1. **Set up Google OAuth credentials** (see detailed steps below)
2. **Configure environment variables**
3. **Test the integration**

## 📋 Prerequisites

- Google Cloud Console account
- KernelQ backend running
- Domain configured (kernelq.com or your custom domain)

## 🔧 Step 1: Google Cloud Console Setup

### 1.1 Create/Select Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID for reference

### 1.2 Enable Required APIs

1. Navigate to "APIs & Services" → "Library"
2. Enable the following APIs:
   - **Google+ API** (for user profile info)
   - **People API** (for user details)

### 1.3 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in App name: "KernelQ"
   - Add your email as developer contact
   - Add scopes: `../auth/userinfo.email`, `../auth/userinfo.profile`

4. For the OAuth Client ID:
   - **Application type**: Web application
   - **Name**: KernelQ OAuth Client

5. **Authorized JavaScript origins**:
   ```
   https://kernelq.com
   http://localhost:3000
   ```

6. **Authorized redirect URIs**:
   ```
   https://kernelq.com/api/auth/google/callback
   http://localhost:3001/api/auth/google/callback
   ```

7. Click "Create" and copy your:
   - **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-abc123def456`)

## 🔐 Step 2: Environment Configuration

### 2.1 Backend Configuration

1. In your backend directory, copy the example environment file:
   ```bash
   cd /home/zerohexer/WebstormProjects/KernelOne-main/backend
   cp .env.example .env
   ```

2. Edit `.env` with your Google OAuth credentials:
   ```bash
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your-actual-client-id-here
   GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
   GOOGLE_CALLBACK_URL=https://kernelq.com/api/auth/google/callback

   # Session Security
   SESSION_SECRET=your-secure-random-string-here

   # Frontend URL
   FRONTEND_URL=https://kernelq.com

   # Environment
   NODE_ENV=production
   ```

3. Generate a secure session secret:
   ```bash
   # On Linux/macOS
   openssl rand -base64 32
   
   # Or use Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

### 2.2 Frontend Configuration (Optional)

The frontend automatically detects the backend URL, but you can override it:

Create `/home/zerohexer/WebstormProjects/KernelOne-main/.env` (frontend):
```bash
REACT_APP_BACKEND_URL=https://kernelq.com/api
```

## 🧪 Step 3: Test the Integration

### 3.1 Start the Services

Use your existing start script with the new OAuth support:
```bash
cd /home/zerohexer/WebstormProjects/KernelOne-main
./start-kernelq.sh
```

### 3.2 Test Google SSO

1. Open `https://kernelq.com` in your browser
2. You should see both:
   - **Sign in with Google** button
   - Traditional email/password form
3. Click "Sign in with Google"
4. You'll be redirected to Google for authentication
5. After approval, you'll be redirected back to KernelQ logged in

### 3.3 Test User Flow

**New Users:**
- First-time Google users automatically get accounts created
- Username is generated from Google display name or email
- Default member status: "Standard Free User"

**Existing Users:**
- Users with matching email addresses are automatically logged in
- Their existing progress is preserved

## 🔍 Troubleshooting

### Common Issues

**1. "OAuth callback error"**
- Check that your redirect URIs in Google Console exactly match your callback URL
- Ensure your domain is accessible (test `curl https://kernelq.com/api/health`)

**2. "Access denied" error**
- Verify your Google OAuth consent screen is properly configured
- Check that required scopes are approved

**3. "Token generation failed"**
- Check your `SESSION_SECRET` is set in `.env`
- Verify JWT secret is properly configured

**4. CORS errors**
- Ensure `https://kernelq.com` is in your backend's CORS origins
- Check that both frontend and backend are accessible

### Debug Mode

Enable debug logging by adding to your backend `.env`:
```bash
DEBUG=oauth:*
NODE_ENV=development
```

### Testing Locally

For local development, use these settings in Google Console:

**Authorized JavaScript origins:**
```
http://localhost:3000
```

**Authorized redirect URIs:**
```
http://localhost:3001/api/auth/google/callback
```

Backend `.env` for local testing:
```bash
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## 🔒 Security Notes

1. **Never commit real credentials** to version control
2. **Use HTTPS in production** - Google OAuth requires secure origins
3. **Rotate secrets regularly** - especially the session secret
4. **Limit OAuth scopes** - only request necessary permissions (email, profile)
5. **Monitor usage** - check Google Cloud Console for unusual activity

## 📱 Features Included

✅ **One-click Google Sign-In**  
✅ **Automatic account creation for new users**  
✅ **Seamless login for existing users**  
✅ **JWT token-based authentication**  
✅ **Session management**  
✅ **Progress preservation**  
✅ **Mobile-friendly OAuth flow**  
✅ **Error handling and user feedback**  

## 🎯 Success Criteria

After completing this setup, users should be able to:

1. ✅ See "Sign in with Google" buttons on login/register screens
2. ✅ Click the button and be redirected to Google
3. ✅ Approve permissions and be redirected back to KernelQ
4. ✅ Be automatically logged into their account
5. ✅ See their existing progress (for returning users)
6. ✅ Have a new account created (for new users)

## 🆘 Support

If you encounter issues:

1. Check the browser's Developer Console for JavaScript errors
2. Check the backend logs for server errors
3. Verify all URLs and credentials are correct
4. Test the OAuth flow step by step

The integration is now complete and ready for your users!