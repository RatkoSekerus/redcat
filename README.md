<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env.local` file in the root directory with your environment variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   VITE_TELEGRAM_CHAT_ID=your_telegram_chat_id_here
   ```
   See `.env.example` for a template.
3. Run the app:
   `npm run dev`
