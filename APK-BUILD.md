# VizTravel — Expo Go + APK (same live API)

## Live services

| Service | URL |
|---------|-----|
| **API** | https://tourapplication-api.onrender.com |
| **Admin** | https://tourapplication-admin.onrender.com |

**Default:** Expo Go **and** APK both hit the **live Render API**.  
You do **not** need backend on your PC for normal testing.

---

## How API mode works

| Mode | When | API used |
|------|------|----------|
| **Expo Go (default)** | `npx expo start` | Production Render |
| **APK** | EAS `preview` / `production` | Production Render |
| **Local backend (optional)** | Set `EXPO_PUBLIC_USE_LOCAL_API=1` | `http://YOUR_PC_IP:5000` |

Config files:

- User: `ExploreApp-frontend/.env` + `constants/api.ts` + `app.config.js`
- Vendor: `ExploreApp-vendor/.env` + `constants/api.ts` + `app.config.js`
- EAS: `eas.json` always injects production URL for APK builds

---

## Test in Expo Go (user app)

```powershell
cd E:\Programming\Explore\ExploreApp-frontend
npx expo start -c
```

1. Scan QR with **Expo Go**
2. Phone must have **internet**
3. First request can take 20–40s (Render free tier wake-up) — wait, then retry signup/login

Vendor:

```powershell
cd E:\Programming\Explore\ExploreApp-vendor
npx expo start -c
```

---

## Build User APK

```powershell
cd E:\Programming\Explore\ExploreApp-frontend
eas login
eas whoami
# should be apk_build_green
eas build -p android --profile preview
```

Download APK from Expo dashboard when finished.

## Build Vendor APK

```powershell
cd E:\Programming\Explore\ExploreApp-vendor
eas build -p android --profile preview
```

---

## Optional: use local backend

1. Start API:

```powershell
cd E:\Programming\Explore\ExploreApp-backend
npm start
```

2. In app `.env`:

```env
EXPO_PUBLIC_FORCE_PROD_API=0
EXPO_PUBLIC_USE_LOCAL_API=1
EXPO_PUBLIC_API_PORT=5000
```

3. Restart Expo with cache clear: `npx expo start -c`  
4. Phone + PC same Wi‑Fi; Windows Firewall allow port 5000.

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

## Admin (Render Static)

```
VITE_API_BASE_URL=https://tourapplication-api.onrender.com
```

---

## Quick health check

```
https://tourapplication-api.onrender.com/health
https://tourapplication-api.onrender.com/api/tours
```
