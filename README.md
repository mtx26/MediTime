
<p align="center">
  <img src="frontend/public/icons/logo.png" alt="MediTime logo" width="120" />
</p>

<h1 align="center">MediTime</h1>

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
├── frontend/         # React 19 app (user interface)
├── backend/          # Flask API (auth, logic, Supabase access)
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

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate         # or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
python -m app.main

# Frontend
cd frontend
npm install
npm run dev
```

---

## 🛠️ Tech Stack

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google%20Cloud-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![UptimeRobot](https://img.shields.io/badge/UptimeRobot-45C4B0?style=for-the-badge&logo=uptime-kuma&logoColor=white)
![CapRover](https://img.shields.io/badge/CapRover-1E90FF?style=for-the-badge&logo=caprover&logoColor=white)
![Zoho](https://img.shields.io/badge/Zoho-DB2828?style=for-the-badge&logo=zoho&logoColor=white)

---

## 🔑 OAuth Providers

![Google](https://img.shields.io/badge/Google-4285F4?style=for-the-badge&logo=google&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)
![Facebook](https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white)
![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Microsoft](https://img.shields.io/badge/Microsoft-0078D4?style=for-the-badge&logo=microsoft&logoColor=white)

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

This project uses [CapRover](https://caprover.com/) for containerized hosting. The `captain-definition` file at the repository root describes how the application is built and deployed on the platform.

---

## 🤝 Contributing

Contributions are welcome! Please read the [CODE_OF_CONDUCT](./CODE_OF_CONDUCT.md) before submitting issues or pull requests.

---

## 📄 License

This project is **private**. See the [LICENSE](./LICENSE) file for more information.
