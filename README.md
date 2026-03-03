# 🛡️ Vault 360 - Smart Inventory & Sales Analytics

A full-stack Inventory Management System built to provide real-time business telemetry and automated sales reporting.



## 🚀 Live Demo
**https://vault-360.vercel.app/**

## 🌟 Key Features
* **Real-time Analytics**: Visual revenue tracking using Recharts to monitor growth trends.
* **Smart Inventory**: Automated "Low Stock" flagging and inventory reconciliation.
* **Secure Authentication**: Protected Admin Dashboard using Firebase Auth.
* **Automated Reporting**: Instant PDF invoice generation for every transaction.

## 🛠️ Tech Stack
* **Frontend**: React.js, Tailwind CSS, Recharts
* **Backend**: Firebase (Firestore & Authentication)
* **Deployment**: Vercel CI/CD
* **Version Control**: Git/GitHub

## 🛡️ Security & Best Practices
During development, I implemented industry-standard security measures:
* Used **Environment Variables** (`.env`) to protect sensitive Firebase API keys.
* Configured `.gitignore` to prevent private service accounts from being exposed.
* Whitelisted production domains in Firebase to prevent unauthorized access.

## ⚙️ Setup
1. Clone the repo: `git clone https://github.com/varshadinesg-alt/vault-360.git`
2. Install dependencies: `npm install`
3. Create a `.env` file with your Firebase credentials.
4. Start the app: `npm start`
