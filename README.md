# ✦ Discord Activity Telemetry Bot ✦

> Professional, Clean-Architecture Discord Activity & Telemetry Bot.
> Tracks **Voice Channel Time** (VC), **Message Counts**, and renders interactive **Symbol-Font Leaderboards** with strictly no emojis.
> Built for seamless deployment on **Render** backed by **MongoDB Atlas**.

---

## ◈ Features

- ✦ **Voice Channel (VC) Tracker**: Tracks exact voice session durations (days, hours, minutes, seconds). Prevents AFK exploitation and flushes live sessions on shutdown.
- ✦ **Message Counter**: High-speed real-time message tracking via MongoDB `$inc` operations.
- ✦ **Aesthetic Symbol Font (Strictly No Emojis)**: Minimalist cyber/geometric typography (`◈`, `✦`, `❯`, `⬡`, `■`, `│`, `─`) for a pro, sleek look.
- ✦ **Interactive Leaderboard (`/leaderboard`)**: Real-time rankings with tab buttons for **Voice Time**, **Messages**, and **Overview**.
- ✦ **Personal Telemetry (`/stats`)**: Detailed profile card showing rankings, voice status, join dates, and activity ratio bars.
- ✦ **Render Auto-Deployment Ready**: Embedded health-check server (`PORT 3000`/Render dynamic port) keeps the service alive and allows Render to auto-deploy on every GitHub push.
- ✦ **MongoDB Atlas Persistence**: Cloud-native persistence with compound indexes for instant sorting.

---

## ◈ Project Structure

```
├── .env.example                # Template for environment credentials
├── .gitignore                  # Keeps node_modules and .env safe
├── package.json                # Project dependencies and deployment scripts
├── render.yaml                 # Render Infrastructure-as-Code Blueprint
├── README.md                   # Complete documentation
└── src/
    ├── index.js                # App entrypoint & graceful shutdown handlers
    ├── config/
    │   ├── env.js              # Environment validation
    │   └── symbols.js          # Aesthetic symbol font & typography palette
    ├── database/
    │   ├── connection.js       # MongoDB Mongoose connection manager
    │   └── models/
    │       └── UserActivity.js # Schema with compound indexes
    ├── services/
    │   ├── activityService.js  # VC duration calculator & message recorder
    │   └── leaderboardService.js # High-performance leaderboard & symbol embeds
    ├── commands/
    │   ├── stats.js            # /stats [target]
    │   ├── leaderboard.js      # /leaderboard [type]
    │   ├── ping.js             # /ping
    │   └── help.js             # /help
    ├── events/
    │   ├── ready.js            # Bot ready & slash command registration
    │   ├── messageCreate.js    # Message counter
    │   ├── voiceStateUpdate.js # Voice channel session tracker
    │   └── interactionCreate.js # Slash command & button interaction router
    └── server/
        └── healthServer.js     # Express HTTP server for Render health checks
```

---

## ◈ Step 1: Discord Developer Portal Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application**, give it a name, and go to the **Bot** tab.
3. Click **Reset Token** and copy your **Bot Token** (save this for later).
4. Under **Privileged Gateway Intents**, turn **ON**:
   - `PRESENCE INTENT`
   - `SERVER MEMBERS INTENT`
   - `MESSAGE CONTENT INTENT`
5. Go to **OAuth2** -> **URL Generator**:
   - Check `bot` and `applications.commands`.
   - Under Bot Permissions, check:
     - `Send Messages`
     - `Embed Links`
     - `Read Message History`
     - `View Channels`
     - `Connect` (Voice)
     - `Speak` (Voice)
6. Copy the generated URL and invite the bot to your Discord server.
7. Copy your **Application (Client) ID** from the **General Information** tab.

---

## ◈ Step 2: MongoDB Atlas Setup (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register for a free account.
2. Create a free **M0 Shared Cluster**.
3. Under **Security** -> **Database Access**, create a user (e.g., username `botuser` and a strong password).
4. Under **Security** -> **Network Access**, click **Add IP Address** -> select **Allow Access From Anywhere** (`0.0.0.0/0`) so Render can connect.
5. Click **Connect** on your cluster -> select **Drivers (Node.js)** -> copy your connection URI string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/discord_activity_db?retryWrites=true&w=majority
   ```
   *(Replace `<username>` and `<password>` with your database credentials).*

---

## ◈ Step 3: Push Code to GitHub

Open a terminal or command prompt in this project folder:

```bash
# 1. Initialize git
git init

# 2. Stage all files (.gitignore automatically protects .env)
git add .

# 3. Commit
git commit -m "feat: initial commit - clean architecture discord activity bot"

# 4. Link to your GitHub repository (replace with your repo URL)
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 5. Push to GitHub
git push -u origin main
```

---

## ◈ Step 4: Deploy on Render (Auto-Deploy)

1. Go to [Render.com](https://render.com) and log in.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your repository (`<your-repo-name>`).
4. Configure the Web Service settings:
   - **Name**: `discord-activity-bot`
   - **Region**: Any (e.g. Frankfurt, Oregon, Singapore)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Scroll down to **Environment Variables** and add the following keys:
   - `DISCORD_TOKEN` = `your_bot_token_from_discord`
   - `CLIENT_ID` = `your_application_id_from_discord`
   - `MONGODB_URI` = `mongodb+srv://...`
   - `NODE_ENV` = `production`
6. Click **Create Web Service**.
7. Render will automatically build, install packages, start the bot, and open the health-check port.
8. **Auto-Deploy**: Any subsequent `git push origin main` will trigger an automated build and zero-downtime deployment on Render!

---

## ◈ Slash Commands Reference

| Command | Description |
|---|---|
| `/stats [target]` | Inspect detailed voice time, message count, and server rank with symbol layout. |
| `/leaderboard [type]` | Interactive top 10 activity rankings with instant tab buttons. |
| `/ping` | Display WebSocket latency, roundtrip response time, uptime, and MongoDB status. |
| `/help` | Minimal command reference card. |

---

## ◈ Typography Customization

All symbol fonts and geometric formatting are centralized in `src/config/symbols.js`. You can adjust borders, bullets, and badge designs without modifying any business logic.
