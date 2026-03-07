# 🛡️ Vault 360 - Smart Inventory & Sales Analytics

Vault 360 is a full-stack inventory management system designed for real-time tracking, secure data handling, and professional sales reporting. This project features a robust React frontend and a Firebase-powered backend, optimized for both performance and security.

## 🚀 Key Features

* **Real-time Dashboard**: Visualizes total revenue and asset valuation directly from Firestore.
* **Sales Telemetry**: Interactive charts showing revenue trends for the most recent transactions.
* **Inventory Control**: Full CRUD functionality to manage products, including stock alerts.
* **Automated Invoicing**: Generates professional PDF receipts for customers using `jsPDF`.
* **Live Deployment**: Hosted and continuously deployed via Vercel.

## 🛠️ Tech Stack

* **Frontend**: React.js, Tailwind CSS
* **Backend**: Node.js, Express
* **Database**: Google Firebase (Firestore)
* **Security**: Dotenv, Git Ignore Policies

## 🔐 Security & Optimization

During development, I implemented several industry-standard security practices:

* **Credential Masking**: Configured `.gitignore` to prevent sensitive files like `serviceAccountKey.json` and `.env` from being exposed on GitHub.
* **Environment Variables**: Centralized backend configuration to keep API keys separate from source code.

## 📦 Getting Started

1. **Clone the Repo**: `git clone https://github.com/varshadinesg-alt/vault_360.git`
2. **Install Deps**: Run `npm install` in both `/Backend` and `/frontend`.
3. **Setup Environment**: Create a `.env` in the backend folder with your Firebase credentials.
