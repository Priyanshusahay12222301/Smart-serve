# SMART SERVE - Super Admin Backend

Backend API for the Super Admin system of Smart Serve SaaS Platform.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your MongoDB URI and other config
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Start Production Server
```bash
npm start
```

## 📝 Environment Variables

Create a `.env` file with:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-serve
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
SUPER_ADMIN_EMAIL=admin@smartserve.com
SUPER_ADMIN_PASSWORD=SuperAdmin@123
```

## 🔐 Default Super Admin Credentials

After first startup, login with:
- **Email**: `admin@smartserve.com`
- **Password**: `SuperAdmin@123`

⚠️ **Change these in production!**

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### Super Admin (Protected)
- `POST /api/super-admin/smartserve/create` - Create restaurant
- `GET /api/super-admin/smartserve/all` - Get all restaurants
- `GET /api/super-admin/smartserve/:id` - Get restaurant details
- `PUT /api/super-admin/smartserve/:id` - Update restaurant
- `DELETE /api/super-admin/smartserve/:id` - Deactivate restaurant
- `POST /api/super-admin/user/create-admin` - Create Smart Admin
- `GET /api/super-admin/stats` - System statistics

### Health Check
- `GET /api/health` - Server status

## 🗄️ Database Models

- **User**: Authentication and user management
- **SmartServe**: Restaurant/tenant management
- **MenuItem**: Menu items for each restaurant
- **Order**: Customer orders
- **Branding**: Custom branding for each restaurant

## 🛡️ Security

- JWT authentication
- Password hashing with bcryptjs
- Role-based access control (RBAC)
- Tenant isolation via `smartServeId`

## 📦 Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT for authentication
- Bcrypt for password hashing
