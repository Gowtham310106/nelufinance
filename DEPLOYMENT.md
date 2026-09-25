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
   - `MONGODB_URI`: your MongoDB Atlas connection string (`mongodb+srv://<user>:<password>@<cluster>.mongodb.net/vetrinel?retryWrites=true&w=majority`)
   - `JWT_SECRET`: a long random string (at least 32 characters), e.g. the output of `openssl rand -hex 32`
   - `ENABLE_DEMO_SEED` (optional): set to `true` only on a demo deployment to allow the "Load demo data" button

   > Both `MONGODB_URI` and `JWT_SECRET` are **required** in production — the API refuses to start without them. Never commit real values to the repository.
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
