# Puddlefoot API Contracts (04_api-contracts.md)

This document specifies the RESTful API endpoints for the Puddlefoot system.

## 1. Authentication
- **Mechanism**: NextAuth.js (JWT or Sessions)
- **Required Header**: `Authorization: Bearer <token>` for all protected routes.

## 2. Core Endpoints

### `GET /api/v1/plants`
List all plants for the authenticated user.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "uuid",
      "nickname": "Misty",
      "health_status": "HEALTHY",
      "last_watered_at": "ISO-8601"
    }
  ]
  ```

### `POST /api/v1/plants`
Add a new plant to the user's garden.
- **Request Body**:
  ```json
  {
    "nickname": "string",
    "species_id": "string",
    "location_type": "INDOOR"
  }
  ```
- **Response (201 Created)**: The created plant object.

### `POST /api/v1/identify`
AI-driven plant identification via image.
- **Request Body**: `multipart/form-data` (image file)
- **Response (200 OK)**:
  ```json
  {
    "suggested_species": "Monstera Deliciosa",
    "confidence": 0.98,
    "puddlefoot_intro": "Indeed, this appears to be a most healthy Monstera!"
  }
  ```

### `POST /api/v1/diagnose/{plant_id}`
AI diagnosis for a specific plant health issue.
- **Request Body**: `multipart/form-data` (image file)
- **Response (200 OK)**:
  ```json
  {
    "diagnosis": "Overwatering",
    "remedy": "Allow the top 2 inches of soil to dry out...",
    "puddlefoot_note": "I suggest a bit more restraint with the watering can, my friend."
  }
  ```

## 3. Error Handling
- **400 Bad Request**: Validation failure (e.g., missing nickname).
- **401 Unauthorized**: Missing or invalid session.
- **403 Forbidden**: Attempting to access a plant owned by another user.
- **404 Not Found**: Plant or resource does not exist.
- **500 Internal Server Error**: Unexpected failure (logged with Sentry/Supabase).
