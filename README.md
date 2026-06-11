# E-Commerce Assignment Platform

A modern, full-stack e-commerce application built with a React frontend and a Node.js/Express backend. The platform features robust authentication with OTP verification, user profile management, a dynamic dashboard, and a complete shopping experience with cart and wishlist capabilities.

## 🚀 Technologies

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & Shadcn UI components
- **State Management**: React Context & TanStack React Query
- **Routing**: React Router DOM v7

### Backend
- **Framework**: Node.js & Express.js
- **Database**: PostgreSQL (pg)
- **Caching & Rate Limiting**: Redis
- **Message Broker**: RabbitMQ
- **Authentication**: JWT (JSON Web Tokens) with refresh token rotation
- **API Documentation**: Swagger UI

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (serving the frontend container)

## 📁 Project Structure

```
ecommerce/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Custom Express middleware (auth, etc.)
│   │   ├── models/           # Database queries and schema definitions
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic and external integrations
│   │   ├── utils/            # Helper functions (JWT, Logger)
│   │   └── app.js            # Express application setup
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios client and error handlers
│   │   ├── components/       # Reusable UI components (layout, shadcn)
│   │   ├── context/          # React Context definitions
│   │   ├── features/         # Feature-based modules (auth, dashboard)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page-level components
│   │   ├── providers/        # Context providers
│   │   ├── types/            # TypeScript type definitions
│   │   └── App.tsx           # Application root component
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml        # Multi-container orchestration
```

## 🛠️ Getting Started

### Prerequisites
Make sure you have the following installed on your local development machine:
- [Docker](https://www.docker.com/products/docker-desktop) and Docker Compose

### Installation & Running Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/hareshwar-ht/eCommerceAssignment.git
   cd eCommerceAssignment
   ```

2. **Environment Variables**
   Ensure that the `.env` files in both the `frontend/` and `backend/` directories are properly configured. (The default configurations provided in the repo are set up for Docker out-of-the-box).

3. **Build and start the containers**
   ```bash
   docker-compose up --build -d
   ```
   This command will build and start all required services:
   - `ecommerce_backend` (Node.js API) on port `8000`
   - `ecommerce_frontend` (Nginx + React) on port `3000`
   - `ecommerce_postgres` (PostgreSQL Database)
   - `ecommerce_redis` (Redis Cache)
   - `ecommerce_rabbitmq` (Message Broker)

4. **Access the application**
   - **Frontend App**: Open your browser and navigate to `http://localhost:3000`
   - **Backend API Docs**: Swagger UI is available at `http://localhost:8000/api-docs`
   - **Backend Healthcheck**: `http://localhost:8000/health`

## 🔐 Authentication & Security
- **OTP Verification**: The platform supports secure account creation via mobile OTP.
- **JWT**: Secure access routes using short-lived access tokens and httpOnly refresh tokens.
- **Rate Limiting**: Protects against brute-force attacks on auth endpoints.
- **Helmet & CORS**: Configured securely for development and production environments.

## 🧪 Testing

The frontend is configured with Vitest and React Testing Library. To run the test suite:

```bash
cd frontend
npm install
npm run test
```

## 📝 License
This project is proprietary.
