# Speedial - Professional Power Dialer

A modern, professional power dialer web application designed for high-volume sales teams. Speedial maximizes talk time by intelligently managing multiple simultaneous calls with automatic voicemail detection and instant call switching.

## Key Features

### 🚀 Power Dialing (3x Simultaneous)
- Dials 3 contacts simultaneously every 5 seconds
- Maximizes contact rate and minimizes idle time
- Smart queue management

### 🤖 AMD (Answering Machine Detection)
- Automatic voicemail detection in 2-3 seconds
- Auto-drops voicemails instantly (1.5 seconds)
- Never waste time leaving messages

### 📞 Multi-Call Switching
- **Game Changer**: When multiple prospects answer, switch between them instantly
- Previous calls automatically go on hold
- See all waiting prospects in a clear alert panel
- No more being stuck on voicemail while live prospects wait

### 📊 Real-Time Analytics Dashboard
- **Total Dials**: Track progress to daily goal (50/day)
- **Connects**: Live connect rate percentage
- **Talk Time**: Total and average per call
- **Voicemails**: Auto-dropped count
- **No Answers**: Percentage of total dials

### 🎯 Smart Call Management
- Visual status indicators (Queued, Dialing, Connected, Voicemail, No Answer)
- Real-time call duration timer
- Quick disposition buttons (Interested, Callback, Not Interested, Do Not Call)
- Professional contact cards with full details

## Design Philosophy

Inspired by industry leaders like Orum.com, Speedial features:
- Clean, modern SaaS interface
- White/light gray color scheme with blue accents
- Professional card-based layout
- Responsive, production-ready UI
- Smooth transitions and hover states

## Tech Stack

### Frontend
- **React 18** with hooks (useState, useEffect, useRef)
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Vite** for blazing-fast development

### Backend (Future Integration)
- **Twilio Voice SDK** for real calling
- **Node.js/Express** backend
- **Supabase** for database
- **Socket.io** for real-time updates
- Deployment: Railway.app

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Navigate to the project directory:
```bash
cd speedial
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Usage

### Starting a Dialing Campaign

1. The app pre-loads 4 sample contacts
2. Click **"Start Dialing"** in the queue panel
3. The dialer will begin calling 3 contacts simultaneously
4. Watch as calls are automatically processed:
   - **Voicemail**: Auto-dropped in 1.5 seconds (yellow indicator)
   - **Human Answer**: Connects to active call panel (green checkmark)
   - **No Answer**: Marked and removed (gray X)

### Managing Active Calls

When a prospect answers:
- Their contact card appears in the active call panel
- Real-time timer begins
- Use call controls: Mute, Pause, Hang Up
- Disposition the call with quick buttons

### Multi-Call Switching

When multiple prospects answer:
1. First answer becomes the active call
2. Additional answers appear in the blue "Waiting Calls" panel
3. Click any waiting prospect to switch instantly
4. Previous call goes on hold automatically
5. This ensures you're always talking to live prospects, never stuck on voicemail

### Call Dispositions

End each call with a disposition:
- **Interested** (Green): Hot lead
- **Callback** (Blue): Schedule follow-up
- **Not Interested** (Gray): Not a fit
- **Do Not Call** (Red): Remove from lists

## Pre-loaded Contacts

The app includes 4 sample contacts:

1. **Parmarth Singh** - Decision Maker, New Jersey - +16095061692
2. **Kanwal Singh** - Manager, New York - +19293068886
3. **Kulwinder Singh** - VP Sales, New York - +13472644578
4. **Jaswinder Kaur** - Director, New York - +19293512145

## Simulated Call Outcomes

For demonstration purposes, calls are simulated with:
- **35%** chance of voicemail (auto-dropped)
- **30%** chance of human answer (connected)
- **35%** chance of no answer

AMD (Answering Machine Detection) simulates 2-3 second detection time.

## Key Differentiator

**Problem with competitors**: When voicemail is detected, you're locked into that call, wasting precious time while live prospects wait.

**Speedial solution**: Multi-call switching lets you instantly jump to any live prospect, maximizing talk time with real humans. Voicemails are auto-dropped in 1.5 seconds.

## Future Backend Integration

### Twilio Configuration
```javascript
// Configure your Twilio credentials in environment variables
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=your_twilio_phone_number
```

Store credentials in `.env` file (never commit to git):
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
```

### Deployment
- Platform: Railway.app
- URL: speedial-beta.railway.app

## Color Scheme

```css
Primary Blue: #2563eb
Success Green: #16a34a
Warning Yellow: #eab308
Danger Red: #dc2626
Background: #f9fafb (gray-50)
Cards: White (#ffffff) with gray-200 borders
```

## Project Structure

```
speedial/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Tailwind imports & custom styles
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── postcss.config.js    # PostCSS configuration
```

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact your development team.

---

**Built for enterprise sales teams who demand efficiency and results.**
