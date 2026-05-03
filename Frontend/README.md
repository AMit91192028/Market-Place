# MarketPlace Frontend

A modern React + Vite + Redux Toolkit frontend application for a microservices-based online marketplace. Fully integrated with Auth and Product backend services.

## 🚀 Tech Stack

- **React 18.2** - UI library
- **Vite 5.0** - Build tool & dev server
- **Redux Toolkit 1.9.7** - State management with Redux Thunks
- **React Router DOM 6.20** - Client-side routing
- **Axios 1.6** - HTTP client with interceptors
- **React Hook Form 7.50** - Form handling
- **Zod 3.22** - Schema validation
- **Pure CSS Modules** - Scoped styling

## 📁 Project Structure

```
src/
├── features/
│   ├── auth/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── AddAddressPage.jsx
│   │   └── hooks/
│   │       └── useAuth.js
│   └── product/
│       ├── pages/
│       │   ├── ProductListingPage.jsx
│       │   ├── ProductDetailPage.jsx
│       │   ├── CreateProductPage.jsx
│       │   └── SellerProductsPage.jsx
├── services/
│   └── api/
│       ├── authApi.js          (Redux Thunks for auth)
│       └── productApi.js       (Redux Thunks for products)
├── store/
│   ├── slices/
│   │   ├── authSlice.js        (Auth state)
│   │   └── productSlice.js     (Product state)
│   └── store.js                (Redux store config)
├── components/
│   └── layout/
│       └── Navbar.jsx
├── App.jsx                     (Main router)
└── main.jsx                    (Entry point)
```

## 🔧 Installation & Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with backend URL
VITE_API_BASE_URL=http://localhost:8000

# Start dev server
npm run dev
```

Then navigate to http://localhost:5173

## 📡 API Integration

### Auth Service
- `registerUser` - POST /auth/register
- `loginUser` - POST /auth/login
- `getCurrentUser` - GET /auth/me
- `getUserAddresses` - GET /auth/user/me/addresses
- `addUserAddress` - POST /auth/users/me/addresses
- `deleteUserAddress` - DELETE /auth/users/me/addresses/:id
- `logoutUser` - GET /auth/logout

### Product Service
- `getProducts` - GET /api/products (with filters: q, minprice, maxprice, skip, limit)
- `getProductById` - GET /api/products/:id
- `getSellerProducts` - GET /api/products/seller
- `createProduct` - POST /api/products (multipart/form-data)
- `updateProduct` - PATCH /api/products/:id
- `deleteProduct` - DELETE /api/products/:id

## 🎯 Redux State Management

Uses Redux Thunks for async operations:

```javascript
// In components
const dispatch = useDispatch()
const { products, isLoading, error } = useSelector(state => state.product)

useEffect(() => {
  dispatch(getProducts({ q: 'laptop' }))
}, [dispatch])

// Handling thunk results
await dispatch(loginUser(credentials)).unwrap()
```

## 🔐 Authentication

- Uses `useAuth()` hook to access user state
- `useInitializeAuth()` restores session on app load
- httpOnly cookies for refresh tokens (backend's responsibility)
- Access token stored in sessionStorage during the active browser session

## 🚢 Build & Deploy

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

Set production environment in `.env.production`:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

## 📝 Pages & Features

- **Login/Register** - User authentication
- **Profile** - User info + address management
- **Product Listing** - Browse with filters
- **Product Detail** - View product, delete if owner
- **Create Product** - Sellers create products
- **Seller Products** - Manage inventory

All fully styled and responsive (basic CSS included).

## 🛠️ Development

Add new pages:
1. Create in `src/features/{feature}/pages/`
2. Create thunks in `src/services/api/`
3. Add Redux slice logic
4. Add route to `App.jsx`

## 📄 License

MIT
