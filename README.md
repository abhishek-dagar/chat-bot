# AI Chat Application

A modern, AI chat application built with Next.js, TypeScript, and Tailwind CSS. This application features a responsive chat interface with message streaming capabilities and a clean, user-friendly design.

## Features

- Chat interface with message streaming
- Responsive design for both desktop and mobile
- Message sections for better conversation organization
- Smooth animations and transitions
- Haptic feedback for mobile devices
- Keyboard shortcuts for better UX
- Auto-scrolling to latest messages
- Dynamic textarea resizing

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Prisma (for database management)
- Lucide Icons
- ESLint for code linting
- PostCSS for CSS processing

## Prerequisites

- Node.js (v18 or higher)
- Yarn or npm
- MongoDB (for database)

## Setup Instructions

1. Clone the repository:
```bash
git clone [repository-url]
cd chat-bot
```

2. Install dependencies:
```bash
yarn install
# or
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL="your_database_url"
NEXT_PUBLIC_API_URL="your_api_url"
```

4. Initialize the database:
```bash
npx prisma migrate dev
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
yarn dev
# or
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
src/
├── components/         # React components
│   └── chat-interface.tsx  # Main chat interface component
├── lib/               # Utility functions and helpers
├── prisma/           # Database schema and migrations
├── public/           # Static assets
```

## Key Features Implementation

### Chat Interface
The chat interface (`chat-interface.tsx`) implements several key features:

1. **Message Streaming**
   - Simulates real-time text streaming with configurable word delay
   - Smooth animations for incoming messages

2. **Responsive Design**
   - Adapts to both desktop and mobile screens
   - Dynamic viewport height management
   - Mobile-optimized input handling

3. **Message Organization**
   - Messages are organized into sections
   - New sections are created for new conversations
   - Smooth scrolling to latest messages

4. **User Experience**
   - Keyboard shortcuts (Enter to Send, Shift + Enter to next line)
   - Dynamic textarea resizing
   - Auto-focus on desktop
   - Mobile keyboard handling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
