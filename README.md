# 👻 GhostSubs

**AI-Powered Subscription Spending Analyzer**

Discover hidden recurring charges, identify unused subscriptions, and take control of your spending.

---

## ✨ Features

- 🤖 AI-Enhanced Analysis - Smart merchant recognition
- 📊 Pattern Detection - Monthly, yearly, quarterly subscriptions
- 🚨 Unused Alerts - Flags inactive subscriptions
- 💰 Savings Calculator - Shows potential savings
- 🔒 Privacy-First - No data storage
- ✨ Beautiful UI - Modern, elegant design
- 📱 Responsive - Works on all devices

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository

```bash
git clone https://github.com/Ilf-Ali-Momin/ghostsubs.git
cd ghostsubs
```

2. Install backend dependencies

```bash
cd backend
npm install
```

3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

4. Configure environment (optional)

```bash
cd ../backend
cp .env.example .env
# Add your Anthropic API key if you want AI features
```

5. Run the application

Terminal 1 (Backend):

```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):

```bash
cd frontend
npm run dev
```

6. Open `http://localhost:3000` in your browser

---

## 📊 CSV Format

Your bank statement CSV should have:

```csv
Date,Description,Amount
2024-01-15,NETFLIX,-15.99
2024-02-15,SPOTIFY,-9.99
```

- **Date:** YYYY-MM-DD or DD/MM/YYYY
- **Amount:** Negative for expenses
- **Description:** Merchant name

---

## 🛠 Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Framer Motion  
**Backend:** Node.js, Express, CSV Parser  
**AI:** Anthropic Claude API (optional)

---

## 🔐 Privacy

- ✅ No database - nothing stored
- ✅ Memory-only processing
- ✅ Files auto-deleted after analysis
- ✅ No authentication required

---

## 📝 License

MIT License

---

**Built with ❤️ using React and Node.js**
