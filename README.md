# What's the 661

**Built in Bakersfield.** A cinematic docu-series spotlighting the people and places that built this city.

🌐 **Website**: https://whatsthe661.com

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion
- **Backend**: Vercel Serverless Functions
- **Email**: Resend (swappable provider architecture)

---

## Getting Started

### Prerequisites

- Node.js 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/bakersfield-spotlight.git
cd bakersfield-spotlight

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables below)

# Start the development server
npm run dev
```

The site will be available at `http://localhost:8080`

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `SITE_URL` | Production URL (e.g., `https://whatsthe661.com`) | No (has default) |
| `SITE_NAME` | Site name for emails | No (has default) |
| `RESEND_API_KEY` | API key from [Resend](https://resend.com) | **Yes** (for email) |
| `EMAIL_TO_SHOW_RUNNER` | Email to receive nomination notifications | No (has default) |
| `EMAIL_FROM` | Verified sender email in Resend | No (has default) |

### Setting up Resend

1. Create an account at [resend.com](https://resend.com)
2. Add and verify your domain (`whatsthe661.com`)
3. Generate an API key and add it to `.env.local`

---

## Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── _lib/
│   │   ├── config.ts       # Server-side config (env vars)
│   │   └── email.ts        # Email sending utility (Resend)
│   └── nominate.ts         # POST /api/nominate endpoint
│
├── public/                 # Static assets
│   ├── favicon.ico
│   └── og-image.jpg        # Social media preview image
│
├── src/
│   ├── components/         # React components
│   │   ├── Footer.tsx
│   │   ├── FormInput.tsx
│   │   ├── HeroBackground.tsx
│   │   ├── HeroContent.tsx
│   │   ├── NominationForm.tsx
│   │   ├── SuccessState.tsx
│   │   └── ui/             # shadcn/ui components
│   │
│   ├── lib/
│   │   ├── api.ts          # Frontend API client
│   │   └── utils.ts        # Utility functions
│   │
│   ├── pages/
│   │   ├── Index.tsx       # Main landing page
│   │   └── NotFound.tsx    # 404 page
│   │
│   ├── types/
│   │   └── nomination.ts   # Shared TypeScript interfaces
│   │
│   └── index.css           # Global styles + Tailwind
│
├── index.html              # HTML template with meta tags
└── vite.config.ts          # Vite configuration
```

---

## Key Features

### Nomination Flow

1. User clicks "Nominate a Business"
2. Multi-step form collects nomination details
3. On submit, `POST /api/nominate` is called
4. Server validates data and sends emails:
   - Notification email to show runner
   - Confirmation email to nominator
5. User sees success state with social links

### Email Provider Architecture

The email system is designed for easy provider swapping:

```typescript
// api/_lib/email.ts
interface EmailProvider {
  send(params: SendEmailParams): Promise<EmailResult>;
}

// To add a new provider:
// 1. Implement the EmailProvider interface
// 2. Update getEmailProvider() in email.ts
```

Currently implemented:
- **ResendProvider**: Production email via Resend API
- **ConsoleProvider**: Development fallback (logs to console)

---

## Deployment

This project is designed for Vercel deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables on Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

- `RESEND_API_KEY` (required)
- `EMAIL_TO_SHOW_RUNNER` (optional, has default)
- `EMAIL_FROM` (optional, has default)

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit a PR

---

## License

© 2024 Vetra. All rights reserved.

---

## Contact

📧 contact@whatsthe661.com
