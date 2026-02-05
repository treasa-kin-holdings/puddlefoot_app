# Puddlefoot Architectural Overview (02_architecture.md)

This document provides a high-level overview of the Puddlefoot system architecture, supporting **Gate B — API & Data Model Approval**.

## 1. System Components
Puddlefoot is built as a modern, AI-integrated web application.

- **Frontend**: Next.js 15 (App Router), TypeScript, Vanilla CSS (Design Tokens).
- **Backend/API**: Next.js API Routes (Serverless), providing RESTful endpoints for the frontend and AI integrations.
- **Database**: Supabase (PostgreSQL) for structured data storage (Profiles, Plants, Care Logs).
- **Authentication**: NextAuth.js with Supabase adapter and Google OAuth.
- **AI Engine**: Gemini 1.5 Pro via Google AI SDK for multimodal plant identification and diagnostic reasoning.
- **Infrastructure**: Vercel for hosting, Supabase for backend services (Auth, DB, Storage).

## 2. Technical Stack
| Category | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 |
| **Language** | TypeScript |
| **Styling** | Vanilla CSS (Glassmorphism) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | NextAuth.js |
| **AI** | Gemini 1.5 Pro |
| **Testing** | Vitest |

## 3. Data Flow
1. **User Interaction**: User interacts with the Next.js frontend.
2. **API Requests**: Frontend communicates with Next.js API Routes or directly with Supabase via client-side SDK (where appropriate/secure).
3. **AI Reasoning**: API Routes invoke Gemini 1.5 Pro for plant ID or diagnostics, passing filtered, non-PII data.
4. **Persistence**: All user-specific gardening data is saved to Supabase with strict Row Level Security (RLS) policies.

## 4. Security & Privacy
- **RLS**: Row Level Security ensures users can only access their own garden records.
- **Minimization**: Only necessary data (plant metrics, nicknames) is shared with AI services.
- **Sanitization**: All user inputs are validated via `zod` before processing.
