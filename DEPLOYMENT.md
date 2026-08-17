# Vercel Deployment Guide for Vetrinel

Vetrinel can be deployed to **Vercel** for both Frontend (Next.js) and Backend (Express Serverless API).

---

## 1. Deploying the Backend API to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New... -> Project"**.
2. Select your GitHub repository: `Gowtham310106/nelufinance`.
3. In **Project Settings**:
   - **Root Directory**: Click *Edit* and select **`backend`**.
   - **Framework Preset**: Select **Other** (Vercel automatically detects `vercel.json` and `api/index.ts`).
4. In **Environment Variables**, add:
   - `MONGODB_URI`: `mongodb+srv://gowtham310106_db_user:deYHMuJgifSEdk1i@nelufinance.gxdk4fu.mongodb.net/vetrinel?retryWrites=true&w=majority`
   - `JWT_SECRET`: `vetrinel_super_secure_jwt_secret_key_2026_tamilnadu_rice_trading_system`
   - `NODE_ENV`: `production`
5. Click **Deploy**.
6. Once deployed, copy your backend URL (e.g., `https://nelufinance-backend.vercel.app`).

---

## 2. Deploying the Frontend App to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New... -> Project"**.
2. Select the same GitHub repository: `Gowtham310106/nelufinance`.
3. In **Project Settings**:
   - **Root Directory**: Click *Edit* and select **`frontend`**.
   - **Framework Preset**: **Next.js** (auto-detected).
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: `https://<YOUR-BACKEND-VERCEL-URL>/api` (e.g. `https://nelufinance-backend.vercel.app/api`)
5. Click **Deploy**.
6. Your Vetrinel application will be live at `https://nelufinance.vercel.app`!

---

## 3. Local Development

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```
