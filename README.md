# News Aggregator - MERN Stack Application

A simple MERN (MongoDB, Express, React, Node.js) stack application with basic authentication and API functionality.

## Project Structure

- **Backend**: Express.js server with MongoDB (using mongoose)
- **Frontend**: React.js app created with Vite

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (local instance or MongoDB Atlas account)
- GNews API key (get one at https://gnews.io/)

## Installation

### Clone the repository

```bash
git clone <repository-url>
cd news-aggregator
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory with the following content:

```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
GNEWS_API_KEY=your_gnews_api_key_here
```

Replace the placeholders with your actual MongoDB credentials and GNews API key.

### Frontend Setup

```bash
cd ../frontend
npm install
```

## Running the Application

### Start the Backend Server

```bash
cd backend
npm run dev
```

The server will start on http://localhost:5000

### Start the Frontend Development Server

```bash
cd frontend
npm run dev
```

The development server will start on http://localhost:5173

## Features

- Express.js backend with MongoDB connection
- React frontend with React Router
- Basic authentication flow (Login/Register pages)
- API communication between frontend and backend
- News fetching from GNews API
- Articles stored in MongoDB

## API Endpoints

- `GET /api/test`: Test endpoint that returns a success message
- `GET /api/fetch-news`: Fetch news from GNews API and save to MongoDB
- `GET /api/articles`: Get all articles from the database 