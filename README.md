# StudySpace

StudySpace is a full-stack study room and collaboration app built with a Vite + React frontend and an Express + MongoDB backend. It includes room browsing, bookings, notifications, feedback, admin tools, ambient sound support, and collaboration features.

## Tech Stack

- Frontend: React 19, TanStack Router, TanStack Query, Vite, Tailwind CSS 4
- Backend: Node.js, Express 5, MongoDB, Mongoose
- Auth and integrations: JWT, Google OAuth, Cloudinary

## Project Structure

- `src/` - frontend app, routes, UI components, and shared utilities
- `backend/` - API server, models, routes, middleware, and seed scripts
- `public/` - static assets
- `vercel.json` and `wrangler.jsonc` - deployment configuration

## Prerequisites

- Node.js 18 or newer
- MongoDB connection string
- Google OAuth client credentials if you use Google sign-in
- Cloudinary credentials if you use storage uploads

## Environment Variables

Create a `.env` file in `backend/` with the variables used by the API:

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - secret used to sign auth tokens
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `FRONTEND_URL` - allowed frontend origin for CORS
- `PORT` - backend port, defaults to `5000`

For the frontend, set `VITE_API_URL` to the backend URL. The app falls back to `http://localhost:5001` if it is not set, so point it to whatever port your API is actually running on.

## Getting Started

Install dependencies for the frontend from the repository root:

```bash
bun install
```

Install backend dependencies:

```bash
cd backend
npm install
```

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend from the repository root in a separate terminal:

```bash
bun run dev
```

## Available Scripts

Frontend scripts from the repository root:

- `bun run dev` - start the Vite development server
- `bun run build` - create a production build
- `bun run preview` - preview the production build
- `bun run lint` - run ESLint
- `bun run format` - format the codebase with Prettier

Backend scripts from `backend/`:

- `npm run dev` - start the API with Nodemon
- `npm start` - start the API with Node.js

## Notes

- The backend seeds ambient sound data automatically if the `SoundTrack` collection is empty.
- The backend allows a fixed set of CORS origins plus any value provided through `FRONTEND_URL`.
- If you deploy the frontend separately, make sure the API URL is updated for the deployed backend.

## License

No license file is currently included in this repository.