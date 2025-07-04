// README.md
  # ChatGPT Client
  
  A modern ChatGPT-like client built with Next.js that connects to the OpenAI API. Deploy instantly on Vercel!
  
  ## Features
  
  - 🚀 Modern, responsive UI built with Tailwind CSS
  - 💬 Real-time chat interface with typing indicators
  - 🔐 Secure client-side API key storage
  - 📱 Mobile-friendly design
  - ✨ Markdown support for formatted responses
  - 🎨 Syntax highlighting for code blocks
  - 🔄 Auto-resizing text input
  - 💾 Persistent conversation storage across devices
  - 🏷️ AI-generated conversation titles
  - 🤖 Model selection (GPT-4o, GPT-3.5-turbo, etc.)
  - ☁️ Free cloud sync with Supabase
  
  ## Quick Deploy
  
  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/chatgpt-client)
  
  ## Local Development
  
  1. Clone the repository
  2. Install dependencies:
     ```bash
     npm install
     ```
  
  3. Run the development server:
     ```bash
     npm run dev
     ```
  
  4. Open [http://localhost:3000](http://localhost:3000) in your browser
  
  ## Setup
  
  1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
  2. Enter your API key when prompted in the app
  3. Start chatting!
  
  ## Storage Setup (Free with Supabase)
  
  This app uses Supabase (PostgreSQL) for persistent conversation storage across devices:
  
  1. **Create a free Supabase account** at [supabase.com](https://supabase.com)
  2. **Create a new project** in your Supabase dashboard
  3. **Run the SQL setup** in your Supabase SQL editor:
     ```sql
     -- Copy and paste the contents of supabase-setup.sql
     ```
  4. **Get your credentials** from Settings > API in your Supabase dashboard
  5. **Add environment variables** to your Vercel project:
     - `NEXT_PUBLIC_SUPABASE_URL` (your project URL)
     - `SUPABASE_SERVICE_ROLE_KEY` (your service role key - **NOT the anon key!**)
  6. **Deploy to Vercel** - the app will automatically use Supabase storage
  
  **Free Tier Benefits:**
  - 500MB database storage
  - 50,000 monthly active users
  - 2GB bandwidth
  - Perfect for personal chat apps!
  
  ## Environment Variables
  
  For server-side API key storage (optional), create a `.env.local` file:
  
  ```
  OPENAI_API_KEY=your-api-key-here
  ```
  
  ## Tech Stack
  
  - **Next.js 14** - React framework with App Router
  - **Tailwind CSS** - Utility-first CSS framework
  - **OpenAI API** - GPT-3.5-turbo integration
  - **React Markdown** - Markdown rendering with syntax highlighting
  
  ## License
  
  MIT