# Smart Serve Admin Backend

Backend API for restaurant owners to manage their menu, orders, and restaurant settings.

## Features

- 🔐 JWT Authentication for Smart Admins
- 🍔 Complete Menu Management (CRUD)
- 📦 Order Management with status workflow
- 📊 Dashboard statistics
- 🎯 Multi-tenant architecture with data isolation

## Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Bcrypt for password hashing

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your MongoDB URI

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login Smart Admin
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### Menu Management
- `GET /api/menu` - Get all menu items
- `GET /api/menu/categories` - Get all categories
- `GET /api/menu/category/:category` - Get items by category
- `GET /api/menu/:id` - Get single menu item
- `POST /api/menu` - Create menu item
- `POST /api/menu/upload-image` - Upload menu item image
- `PUT /api/menu/:id` - Update menu item
- `PATCH /api/menu/:id/toggle` - Toggle item availability
- `DELETE /api/menu/:id` - Delete menu item

### Image Upload

The API supports image uploads for menu items with two options:

1. **File Upload**: Upload image files directly (PNG, JPG, max 5MB)
   - Stored locally in `/uploads` folder by default
   - Can be configured to use Cloudinary for cloud storage

2. **URL**: Provide an external image URL

**Cloudinary Setup (Optional):**
Add these to your `.env` file:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

When Cloudinary is configured, images will be:
- Automatically uploaded to your Cloudinary account
- Optimized (max 800x800px, auto quality)
- Organized in `smartserve/menu-items` folder
- Local files automatically deleted after upload
- `PUT /api/menu/:id` - Update menu item
- `PATCH /api/menu/:id/toggle` - Toggle availability
- `DELETE /api/menu/:id` - Delete menu item

### Order Management
- `GET /api/orders` - Get all orders (with status filter)
- `GET /api/orders/stats` - Get order statistics
- `GET /api/orders/recent` - Get recent orders
- `GET /api/orders/:id` - Get single order
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Cancel order

## Demo Credentials

Email: admin@restaurant.com
Password: admin123

## Environment Variables

```
PORT=5002
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
DEMO_SMART_ADMIN_EMAIL=admin@restaurant.com
DEMO_SMART_ADMIN_PASSWORD=admin123
DEMO_RESTAURANT_NAME=Delicious Bites
```

## Order Status Workflow

PENDING → PREPARING → READY → COMPLETED

Orders can also be CANCELLED at any stage.
