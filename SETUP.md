# Noble Care Application Setup Guide

## 🎉 **Setup Complete!**

Both the frontend and backend servers are now running in the background and will continue running until you stop them.

## 📍 **Current Status**

### ✅ **Backend Server (Node.js/Express)**
- **Status**: Running in background
- **URL**: http://localhost:5000
- **API Base**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

### ✅ **Frontend Server (React/Vite)**
- **Status**: Running in background  
- **URL**: http://localhost:5173
- **Framework**: React + TypeScript + Vite

## 🚀 **Access Your Application**

1. **Open your browser** and go to: **http://localhost:5173**
2. **Backend API** is available at: **http://localhost:5000/api**

## 📋 **Available API Endpoints**

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user

### Profile Management
- `GET /api/profile` - Get user profile
- `PUT /api/profile/update` - Update profile
- `GET /api/profile/progress` - Get onboarding progress

### Requirements
- `GET /api/requirements/matrix` - Get job requirements
- `POST /api/requirements/evaluate` - Evaluate candidate

## 🔧 **Environment Configuration**

### Frontend (.env file needed)
Create a `.env` file in the `Homecare` folder:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Noble Care
VITE_APP_VERSION=1.0.0
```

### Backend (.env file needed)
Create a `.env` file in the `noblecare-backend` folder:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/noblecare
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## 🗄️ **Database Setup**

### Option 1: Local MongoDB
1. Install MongoDB on your system
2. Start MongoDB service
3. The backend will automatically connect to `mongodb://localhost:27017/noblecare`

### Option 2: MongoDB Atlas (Cloud)
1. Create a free MongoDB Atlas account
2. Get your connection string
3. Update `MONGODB_URI` in the backend `.env` file

## 🛠️ **Development Commands**

### Backend (noblecare-backend folder)
```bash
# Start development server
npm run dev

# Start production server
npm start

# Install dependencies
npm install
```

### Frontend (Homecare folder)
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Install dependencies
npm install
```

## 🔍 **Testing the Application**

1. **Frontend**: Visit http://localhost:5173
2. **Backend Health**: Visit http://localhost:5000/api/health
3. **API Documentation**: Check the README files in each folder

## 🐛 **Troubleshooting**

### If servers stop running:
1. **Backend**: Navigate to `noblecare-backend` folder and run `npm run dev`
2. **Frontend**: Navigate to `Homecare` folder and run `npm run dev`

### If you get connection errors:
1. Check if MongoDB is running (for backend)
2. Verify environment files are set up correctly
3. Check if ports 5000 and 5173 are available

### If you get module errors:
1. Run `npm install` in both folders
2. Clear node_modules and reinstall if needed

## 📁 **Project Structure**

```
Homecare/
├── Homecare/                 # Frontend (React/TypeScript)
│   ├── src/
│   ├── package.json
│   └── ...
└── noblecare-backend/        # Backend (Node.js/Express)
    ├── models/
    ├── routes/
    ├── middleware/
    ├── server.js
    └── ...
```

## 🎯 **Next Steps**

1. **Set up environment files** (.env) in both folders
2. **Configure MongoDB** (local or cloud)
3. **Test the application** by visiting the frontend URL
4. **Create your first user** through the signup process
5. **Explore the onboarding flow**

## 📞 **Support**

If you encounter any issues:
1. Check the console logs in both terminal windows
2. Verify all dependencies are installed
3. Ensure MongoDB is running (for backend functionality)
4. Check that environment variables are properly configured

---

**🎉 Your Noble Care application is now ready to use!**
