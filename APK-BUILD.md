# VizTravel — Production URLs & APK build

## Live services

| Service | URL |
|---------|-----|
| **API** | https://tourapplication-api.onrender.com |
| **Admin** | https://tourapplication-admin.onrender.com |

## Apps wired to production API

- **User app** (`ExploreApp-frontend`) → API above (release / EAS)
- **Vendor app** (`ExploreApp-vendor`) → API above (release / EAS)
- **Admin** (`ExploreApp-admin`) → `VITE_API_BASE_URL` = API above

---

## Backend (Render) env checklist

```
MONGODB_URI=...
JWT_SECRET_KEY=...
CORS_ORIGIN=https://tourapplication-admin.onrender.com
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NODE_ENV=production
```

---

## Admin (Render Static Site) env

```
VITE_API_BASE_URL=https://tourapplication-api.onrender.com
```

Root: `ExploreApp-admin`  
Build: `npm install && npm run build`  
Publish: `dist`  
**Redeploy after setting env.**

---

## Build User APK (Android)

```powershell
cd E:\Programming\Explore\ExploreApp-frontend
npm install
npx eas login
npx eas build -p android --profile preview
```

- Profile `preview` = **APK** (easy install)
- Profile `production` = also APK in this repo config

Download APK from Expo dashboard when build finishes.

---

## Build Vendor APK (Android)

```powershell
cd E:\Programming\Explore\ExploreApp-vendor
npm install
npx eas init
npx eas login
npx eas build -p android --profile preview
```

First time vendor may need:

```powershell
npx eas init
```

Copy `projectId` into `app.config.js` → `extra.eas.projectId` if prompted.

---

## Local dev (optional)

Expo Go still uses LAN backend if Metro is running.  
To force production API in dev:

```env
EXPO_PUBLIC_FORCE_PROD_API=1
EXPO_PUBLIC_API_BASE_URL=https://tourapplication-api.onrender.com
```

---

## Test API

```
https://tourapplication-api.onrender.com/health
https://tourapplication-api.onrender.com/api/tours
```
