# SP2025_11_AltEat
# 🍽️ AltEat — Ingredient Substitution & Recipe Assistant

> A bilingual (EN/TH) web application that helps users discover creative ingredient substitutions, explore recipes, and get AI-powered cooking guidance through a chatbot interface.

---

## 📖 Overview

AltEat is built as a chatbot-based food substitution system integrated with the **FoodIngSub Model** — a large language model trained on Thai ingredient and recipe datasets. It supports flexible cooking by recommending alternative ingredients based on availability, dietary preferences, and local context.

This project was developed as part of the research project **"Utilizing Deep Learning for Recipe Ideation with Local Ingredient Substitutions"** (Grant No. FF-026/2568).

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 AI Chatbot | Natural language ingredient substitution and recipe guidance |
| 🔍 Recipe Search | Filter and discover recipes by ingredient, cooking method, or cuisine |
| 🧄 Ingredient Explorer | Browse ingredients by taste, texture, color, and shape |
| ❤️ Favorites | Save and manage favorite recipes (requires account) |
| 👤 User Profiles | Personalized cuisine preferences, skill level, and avoided ingredients |
| 🌐 Bilingual UI | Full English and Thai language support |
| 🎯 Personalized Recommendations | Homepage recipe feed based on user preferences |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           AltEat Frontend               │
│        React + TypeScript + Vite        │
│           Tailwind CSS v4               │
└───────────────┬─────────────────────────┘
                │
        ┌───────▼────────┐
        │  Supabase       │  ← Auth, Database, Storage
        │  (PostgreSQL)   │
        └───────┬────────┘
                │
        ┌───────▼────────┐
        │  n8n Workflow   │  ← Intent classification & orchestration
        │  (AI Agent)     │
        └───────┬────────┘
                │
        ┌───────▼──────────────┐
        │  FoodIngSub Backend  │  ← FastAPI + OpenAI
        │  (Python / FastAPI)  │
        └──────────────────────┘
```

---

## 🗂️ Project Structure

```
SP2025_11_AltEat/
├── AltEat/                    # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── pages/             # Route-level page components
│   │   ├── component/         # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── context/           # React context providers
│   │   ├── lib/               # Supabase client & utility functions
│   │   ├── data/              # Static filter data
│   │   ├── locales/           # i18n translation files (EN / TH)
│   │   └── i18n/              # i18next configuration
│   ├── tests/                 # Playwright end-to-end tests
│   └── src/__tests__/         # Vitest unit tests
│
├── FoodIngSubModel/           # Backend (Python / FastAPI)
│   ├── backend_api.py         # FastAPI endpoints
│   ├── services/
│   │   ├── ingredient_service.py
│   │   ├── recipe_service.py
│   │   ├── openai_service.py
│   │   └── dataset_service.py
│   ├── models.py              # Pydantic / dataclass models
│   ├── config.py              # Centralized configuration
│   └── dataset/              # Local ingredient JSON dataset
│
└── n8n workflow/             # n8n AI agent workflow (JSON export)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20
- Python 3.12+
- A [Supabase](https://supabase.com) project
- An OpenAI API key
- [n8n](https://n8n.io) instance (for chatbot workflow)

---

### Frontend Setup

```bash
cd AltEat
npm install
```

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the development server:

```bash
npm run dev
```

---

### Backend Setup

```bash
cd FoodIngSubModel
pip install -r requirements.txt
```

Create a `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the backend server:

```bash
uvicorn backend_api:app --port 8080 --reload
```

---

## 🔌 Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/substitute` | Find ingredient substitutes |
| POST | `/context` | Discover ingredients by taste, texture, color, or method |
| POST | `/suggest` | Suggest recipes from available ingredients |
| POST | `/similar` | Find recipes similar to a given dish |
| POST | `/specific` | Find recipes that must include certain ingredients |
| POST | `/lookup` | Get full recipe details and cooking steps |
| POST | `/rewrite` | Rewrite a recipe by swapping one ingredient |
| POST | `/recipe_custom` | Rebuild a recipe using substitute ingredients |
| GET  | `/health` | Health check |

All POST endpoints accept:

```json
{
  "classification": "substitute",
  "entities": { "ingredient": "butter", "recipe": "banana bread" },
  "confidence": 0.98
}
```

---

## 🧪 Testing

### Frontend Unit Tests (Vitest)

```bash
cd AltEat
npm run test         # watch mode
npm run test:run     # single run
```

### Frontend End-to-End Tests (Playwright)

```bash
npm run test:e2e
```

> Playwright tests require a running dev server and valid auth credentials configured in `playwright/.auth/user.json`.

### Backend Tests (pytest)

```bash
cd FoodIngSubModel
pytest test_backend_api.py -v
```

Run tests for a specific endpoint:

```bash
pytest test_backend_api.py::TestSubstituteEndpoint -v
```

With coverage:

```bash
pytest test_backend_api.py --cov=backend_api --cov-report=html
```

---

## 🌐 Internationalization

The app supports **English** and **Thai** via [i18next](https://www.i18next.com/).

Translation files are located in `AltEat/src/locales/`:

```
locales/
├── en/   (common, navbar, home, recipe, ingredient, chatbot, profile, auth, about, favorite, filter)
└── th/   (same namespaces)
```

Language preference is persisted in `localStorage` and detected automatically from the browser.

---

## 🔄 n8n Chatbot Workflow

The chatbot is powered by an n8n workflow that:

1. Receives user messages via webhook
2. Classifies intent using GPT (substitute / suggest / lookup / rewrite / context / similar / specific / recipe_custom)
3. Routes to the appropriate FastAPI backend endpoint
4. Formats the response into natural language
5. Returns the result to the frontend

Import the workflow from `n8n workflow/My workflow ver 2.2.json` into your n8n instance.

**Webhook URL format:**
```
https://your-n8n-instance/webhook/{webhook-id}/chat
```

Update `N8N_WEBHOOK_URL` in `ChatbotPage.tsx` to point to your instance.

---

## 🗄️ Database Schema (Supabase)

Key tables:

| Table | Description |
|---|---|
| `recipes` | Recipe data with ingredients, directions, cuisine path |
| `ingredients` | Ingredient data with flavor, texture, color, shape attributes |
| `profiles` | User profile with cuisine preferences, skill level, avoided ingredients |
| `favorite` | User–recipe favorites (many-to-many) |
| `chat_sessions` | Chatbot conversation sessions |
| `chat_messages` | Individual chat messages per session |
| `chat_feedback` | User helpfulness feedback on bot responses |

Key RPC functions:
- `search_recipes_by_ingredients(search_terms, result_limit)` — ingredient-based recipe search
- `search_context_ingredients(terms)` — context-based ingredient search
- `get_random_recipes(n)` — random recipe sample for recommendations

---

## 🚢 Deployment

The frontend is deployed on **Vercel**. The `vercel.json` file handles SPA routing:

```json
{
  "rewrites": [{ "source": "/:path*", "destination": "/index.html" }]
}
```

The backend can be deployed on any Python hosting platform (Railway, Render, etc.).

---

## 👥 Team

| Name |  
|---|
| Ms. Pataraporn Penpargkul | 
| Mr. Wasuntha Phanpanich | 
| Ms. Phanthira Phansen | 

**Institution:** MU ICT, Mahidol University

---

## 📄 License

This project was developed for academic research purposes under Grant No. FF-026/2568.