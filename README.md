# TradeTracker by VON 📈

> **Institutional-Grade Trading Journal, Risk Engine & Edge Analytics**  
> Designed for professional Forex, Indices, Commodities, and Crypto traders to systematically master risk, track discipline, and eliminate psychological leaks.

---

## 🌟 Key Features

### 1. 📊 Precision Trade Logging & Live Calculator
- **Asset Coverage**: Built-in support for Forex Majors/Minors, Indices (US30, NAS100, SPX500, GER40), Commodities (XAUUSD Gold, US Oil), and Crypto (BTCUSD, ETHUSD).
- **Auto Session Detection**: Automatically tags London, New York, Tokyo, or Asian overlap sessions based on timestamp.
- **Real-Time Calculation**: Live Net P&L, R-Multiple, Risk-to-Reward (R:R), and pip difference computed dynamically as you type.
- **⭐ 5-Star Setup Quality & Discipline Rating**: Grade every trade setup from **1★** (*Impulsive / Chased / Tilt*) to **5★** (*Textbook A+ Institutional Edge*) to separate execution quality from outcome luck.
- **Institutional Pre-Trade Checklist**: Enforces discipline checks before entry (Stop-Loss locked, risk capped at ≤1-2%, multi-timeframe confluence confirmed).

### 2. 🎯 Monthly Goals & Pacing Engine
- **Target Tracking**: Set and adjust monthly profit targets and win-rate benchmarks directly in the sidebar or goals dashboard.
- **Interactive Pacing Bars**: Visual progress bars tracking current profit and win rate against month targets with milestone indicators (25%, 50%, 75%, 100%, and 125% stretch goals).
- **Run-Rate Calculator**: Computes required daily profit run-rate across remaining trading days.

### 3. 🛡️ Institutional Position Sizer & Risk Calculator
- **Account Sizing**: Calculate exact lot sizes based on your account balance, desired risk percentage (or fixed dollar risk), and stop-loss distance in pips/points.
- **Capital Preservation**: Real-time margin requirement, effective leverage, and pip-value feedback.

### 4. 🔬 Quantitative Analytics & Edge Attribution
- **Core Metrics**: Win Rate, Profit Factor, Expectancy, Net P&L, Average R-Multiple, Max Drawdown, and Kelly Criterion.
- **Multi-Factor Breakdown**: Analyze performance by Strategy, Market Session, Asset Class, Day of the Week, Psychology/Emotion, and **5-Star Trade Quality**.
- **Monte Carlo Simulation**: Run 1,000 iterations to calculate statistical Probability of Max Drawdown and Risk of Ruin.

### 5. 📅 Daily P&L Calendar
- Visual heatmap of daily trading performance.
- Green/Red daily profit badges, daily trade counts, win/loss day tallies, and monthly aggregates.

### 6. 🤖 AI Trade Coach (Powered by Google Gemini)
- Automated diagnostic coach analyzing real journal history to uncover behavioral leaks, revenge trading tendencies, session-specific drawdowns, and strategy edge drift.

### 7. 💾 Data Portability & Backup
- Complete **CSV Export & Import** with support for custom tags, ratings, and commissions.
- Full **JSON Backup & Restore** for offline peace of mind.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Backend**: [Express](https://expressjs.com/) with TypeScript (`tsx` in dev, `esbuild` for production bundle)
- **AI Engine**: [`@google/genai`](https://www.npmjs.com/package/@google/genai) (Google Gemini SDK)
- **Icons & Motion**: [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18+ or 20+ recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/tradetracker.git
   cd tradetracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   # Required for AI Coach features (Google Gemini API)
   GEMINI_API_KEY="your_google_gemini_api_key_here"
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

---

## 📦 Production Build

To build the full-stack application for production deployment:

```bash
npm run build
```

This compiles both the Vite client assets and bundles the Express server into `dist/server.cjs`.

To run the production server:

```bash
npm start
```

---

## 📁 Project Structure

```
├── server.ts                    # Express backend & Gemini AI proxy routes
├── index.html                   # HTML entry point
├── package.json                 # Dependencies and build scripts
├── vite.config.ts               # Vite configuration
└── src/
    ├── main.tsx                 # React application bootstrap
    ├── App.tsx                  # Main router and state coordinator
    ├── types.ts                 # TypeScript types (Trade, Goals, Settings, Metrics)
    ├── components/              # Modular UI components
    │   ├── Sidebar.tsx          # Navigation and live goals summary
    │   ├── TopBar.tsx           # Quick trade launcher and account status
    │   ├── StarRating.tsx       # 5-Star setup rating component
    │   ├── TradeCalendar.tsx    # Monthly trade calendar grid & daily P&L matrix
    │   ├── ProgressBar.tsx      # Accessible progress & pacing bar
    │   ├── GoalsSidebarSection.tsx # Sidebar goals tracker
    │   ├── TradeDetailModal.tsx # Trade inspector and post-mortem review
    │   └── pages/               # Feature views
    │       ├── Dashboard.tsx    # Executive summary & quick stats
    │       ├── AddTrade.tsx     # Form with live P&L and 5-star rating
    │       ├── Calculator.tsx   # Institutional position sizing engine
    │       ├── History.tsx      # Trade log table, cards & calendar view with filters
    │       ├── Calendar.tsx     # Monthly calendar & daily P&L matrix
    │       ├── Analytics.tsx    # Quantitative metrics & Monte Carlo
    │       ├── Goals.tsx        # Monthly goals & milestone tracking
    │       ├── AiCoach.tsx      # Gemini-powered trading psychologist
    │       └── SettingsPage.tsx # Account configuration & data export
    └── lib/                     # Utilities & calculation engines
        ├── constants.ts         # Asset classes, default goals, and pairs
        ├── trade.ts             # Pip value, P&L, and session detection
        ├── stats.ts             # Expectancy, Kelly, and drawdown stats
        ├── goals.ts             # Monthly goal pacing and milestone math
        ├── csv.ts               # CSV parser and exporter
        └── demo.ts              # Sample institutional trade dataset
```

---

## 🔒 Security & Privacy

- All API keys (including `GEMINI_API_KEY`) remain strictly on the server side in `server.ts` and are never exposed to the client.
- Trade logs and preferences are safely stored locally in your browser storage with one-click export to CSV/JSON.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
