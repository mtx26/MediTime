
<p align="center">
  <img src="frontend/public/icons/logo.png" alt="MediTime logo" width="300" />
</p>

<p align="center">A modern web application for managing medication schedules.</p>

<p align="center">
  <a href="https://github.com/mtx26/medic/actions/workflows/backend-ci.yml"><img src="https://github.com/mtx26/medic/actions/workflows/backend-ci.yml/badge.svg" alt="Backend CI" /></a>
  <a href="https://github.com/mtx26/medic/actions/workflows/frontend-ci.yml"><img src="https://github.com/mtx26/medic/actions/workflows/frontend-ci.yml/badge.svg" alt="Frontend CI" /></a>
  <a href="https://stats.uptimerobot.com/grkagF4D8K"><img src="https://img.shields.io/uptimerobot/status/m800604412-b3dfcffa4d1ddbcda5043748?label=Backend%20Uptime" alt="Backend Uptime" /></a>
  <a href="https://stats.uptimerobot.com/grkagF4D8K"><img src="https://img.shields.io/uptimerobot/status/m800604510-1a3da771d8926ec5f29f31c3?label=Frontend%20Uptime" alt="Frontend Uptime" /></a>
  <img src="https://img.shields.io/github/last-commit/mtx26/medic" alt="Last Commit" />
  <img src="https://img.shields.io/badge/license-private-red" alt="License: Private" />
</p>

**MediTime** is a modern web application for managing medication schedules, built with **React&nbsp;19** and **Flask**. Data is stored in **Supabase** and authentication relies on Supabase JWT tokens.

---

## Server Health (Netdata)

![CPU](http://161.97.64.142:19999/api/v1/badge.svg?chart=system.cpu&after=-300&dimensions=system&label=CPU%20system&units=%25)
![RAM](http://161.97.64.142:19999/api/v1/badge.svg?chart=system.ram&after=-300&dimensions=used&label=RAM%20used&units=MiB)
![Load](http://161.97.64.142:19999/api/v1/badge.svg?chart=system.load&after=-300&dimensions=load1&label=Load%201m)
![Uptime](http://161.97.64.142:19999/api/v1/badge.svg?chart=system.uptime&after=-300&dimensions=uptime&label=Uptime&units=s)

![Disk writes](http://161.97.64.142:19999/api/v1/badge.svg?chart=disk.sda&after=-300&dimensions=writes&label=Disk%20writes&units=ops%2Fs)
![Disk reads](http://161.97.64.142:19999/api/v1/badge.svg?chart=disk.sda&after=-300&dimensions=reads&label=Disk%20reads&units=ops%2Fs)

![Net RX](http://161.97.64.142:19999/api/v1/badge.svg?chart=net.eth0&after=-300&dimensions=received&label=Net%20RX&units=Kb%2Fs)
![Net TX](http://161.97.64.142:19999/api/v1/badge.svg?chart=net.eth0&after=-300&dimensions=sent&label=Net%20TX&units=Kb%2Fs)


## 🚀 Key Features

* 🔐 Supabase Authentication (Google, GitHub, Twitter, Facebook, Discord, Microsoft, Email)
* 📅 Create and manage personal or shared calendars
* 💊 Medication tracking: time, dose, frequency, alternation
* 🔗 Share calendars via public links or with other authenticated users
* 🔔 Notifications, invitations, access management
* 🧾 Detailed logging (frontend and backend)
* 🔄 Real-time data updates via Supabase Realtime
* 🌍 Multilingual interface powered by i18next
* ⏰ Automatic stock checks via daily cron tasks
* ☁️ Cloudinary uploads and email notifications (Zoho Mail)
* 📱 Responsive interface, mobile-optimized

---

## 📁 Project Structure

```
MediTime/
├── apps/
│   ├── web/          # React 19 app (Vite frontend)
│   └── backend/      # Flask API + scheduler
├── packages/         # Shared monorepo packages
├── scripts/          # Shared build and i18n scripts
├── dumps/            # Database dumps
├── .github/          # GitHub Actions workflows (CI/CD)
├── captain-definition # CapRover deployment config
├── launch.bat        # Local launch script (Windows)
└── README.md         # This file
```

---

## 📦 Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Python](https://www.python.org/) 3.11+

---

## ⚙️ Quick Setup

### 🚀 Automatic Launch (Recommended)
```bash
# Windows - launches backend API, scheduler, and frontend
.\launch.bat
```

### 🛠️ Manual Setup

#### Backend API
```bash
cd apps/backend
python -m venv .venv
.venv\Scripts\activate         # or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt

# Windows development
python -m app.main

# macOS/Linux or production
gunicorn -w 9 --threads 2 -b 0.0.0.0:5000 --timeout 120 --reload app.main:app
```

#### Scheduler (separate process)
```bash
cd apps/backend
.venv\Scripts\activate
python scheduler.py
```

#### Frontend
```bash
npm install
npm run dev --workspace=apps/web
```

---

## 🏗️ Architecture

MediTime uses a **dual-process architecture** for better scalability and separation of concerns:

1. **API Flask** (`app/main.py`) - HTTP requests via Gunicorn
   - 9 workers `(2 × CPU + 1)` for I/O-bound workloads
   - 2 threads per worker = 18 concurrent requests
   - Optimized for VPS: 4 CPU cores / 8 GB RAM

2. **Scheduler** (`scheduler.py`) - Independent cron process
   - Standalone Python script (no Flask dependency)
   - APScheduler with BlockingScheduler
   - Daily tasks: stock decrease at midnight

**Shared modules** (`app/core/`): DB connection, Firebase Admin, Vertex AI

**Production deployment** (Render/Heroku):
```
web: gunicorn -w 9 --threads 2 -b 0.0.0.0:5000 --timeout 120 app.main:app
scheduler: python scheduler.py
```

---

## 🛠️ Tech Stack

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google%20Cloud-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![UptimeRobot](https://img.shields.io/badge/UptimeRobot-45C4B0?style=for-the-badge&logo=uptimekuma&logoColor=white)
![CapRover](https://img.shields.io/badge/CapRover-1E90FF?style=for-the-badge&logo=caprover&logoColor=white)
![Zoho](https://img.shields.io/badge/Zoho-DB2828?style=for-the-badge&logo=zoho&logoColor=white)
![GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-000000?style=for-the-badge&logo=github-copilot&logoColor=white)

---

## 🔑 OAuth Providers

![Google](https://img.shields.io/badge/Google-4285F4?style=for-the-badge&logo=google&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![X](https://img.shields.io/badge/X-%23000000?style=for-the-badge&logo=x&logoColor=white)
![Facebook](https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white)
![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Microsoft](https://img.shields.io/badge/microsoft%20azure-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white)

---

## 🌐 External Services & Integrations

* **Supabase** – primary database and authentication provider.
* **Google Cloud Translate** – automatic generation of translation files.
* **Google Cloud Console** – service configuration and management.
* **Cloudinary** – storage of uploaded images.
* **Zoho Mail** – SMTP provider for outgoing notifications.
* **UptimeRobot** – monitoring backend and frontend availability.
* **schedule** – cron-style background tasks for stock management.
* **CapRover** – self-hosted PaaS for deployment.
* **Base de données des médicaments** – official Belgian medicines database for human use.

The frontend currently supports the following languages: English, French, Spanish, German, Italian, Japanese, Chinese, Portuguese and Russian.

---

## ☁️ Deployment

### Frontend – Vercel

The frontend (`apps/web`) is deployed on [Vercel](https://vercel.com/). The `vercel.json` at the repository root contains all the necessary build configuration. The only settings you need to configure **manually in the Vercel dashboard** are:

| Setting | Value |
|---|---|
| **Root Directory** | *(leave empty – repository root)* |
| **Framework Preset** | Other |
| **Build Command** | `npm run build --workspace=apps/web` |
| **Output Directory** | `apps/web/dist` |
| **Install Command** | `npm install --legacy-peer-deps` |
| **Node.js Version** | **22.x** (set in *Settings → General → Node.js Version*) |

All environment variables (`VITE_*`) must also be added in *Settings → Environment Variables*.

> **Important – monorepo notes:**
> - The repository uses **npm workspaces**. There must be only **one** `package-lock.json` at the repository root. Never commit a separate `package-lock.json` inside `apps/web/`.
> - The `package-lock.json` is generated on Linux so it includes the correct platform-specific native binaries (e.g. `@rollup/rollup-linux-x64-gnu`). If you regenerate it on Windows, delete it and let Vercel (or a Linux/macOS environment) recreate it.
> - The `.nvmrc` file pins Node **22** and the `engines` field in `package.json` requires `>=22.12.0`. Vercel detects both and uses Node 22 automatically.

### Backend – Portainer / CapRover

See [PORTAINER.md](./PORTAINER.md) for backend deployment instructions. The `captain-definition` file at the repository root describes how the application is built and deployed on CapRover.

---

## 🤝 Contributing

Contributions are welcome! Please read the [CODE_OF_CONDUCT](./CODE_OF_CONDUCT.md) before submitting issues or pull requests.

---

## 📄 License

This project is **private**. See the [LICENSE](./LICENSE) file for more information.
