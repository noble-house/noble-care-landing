# Environment Setup for Railway Backend

## Quick Setup

1. Create a `.env` file in the root of your frontend project (Homecare folder)
2. Add the following content:

```env
# API Configuration
VITE_API_URL=https://web-production-9da45.up.railway.app/api

# App Configuration
VITE_APP_NAME=Noble Care
VITE_APP_VERSION=1.0.0
```

## What's Already Updated

✅ **AuthContext.tsx** - Uses `VITE_API_URL` environment variable
✅ **Prescreen.tsx** - Uses `VITE_API_URL` environment variable  
✅ **env.example** - Updated with Railway URL
✅ **Removed server.js** - Cleaned up frontend directory

## API Endpoints Expected

The frontend expects these endpoints from your Railway backend:

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/me` - Get current user profile

### Profile Management
- `PUT /api/profile/update` - Update user profile
- `PUT /api/profile/auto-save/prescreen` - Auto-save prescreen data

### Onboarding
- `GET /api/onboarding/steps` - Get onboarding steps
- `POST /api/onboarding/submit` - Submit onboarding data

## Testing the Connection

1. Start your frontend: `npm run dev`
2. Try to register/login
3. Check browser console for any API errors
4. Verify the Railway backend is responding at: https://web-production-9da45.up.railway.app/api/health

## Next Steps

1. Create the `.env` file with the Railway URL
2. Test the authentication flow
3. Verify all API endpoints are working
4. Deploy frontend updates to Vercel
