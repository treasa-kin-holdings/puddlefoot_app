# Puddlefoot Data Model (03_data-model.md)

This document defines the core entities and relationships for the Puddlefoot gardening companion.

## 1. Entities & Schema

### `profiles` (User Profiles)
Stores user-specific settings and Puddlefoot interaction preferences.
- `id`: uuid (PK, references auth.users)
- `display_name`: string
- `avatar_url`: string
- `location`: point (Lat/Long for weather context)
- `persona_affinity`: float (User's preference for Puddlefoot's meticulousness level)
- `created_at`: timestamp

### `plants` (User's Garden)
The central entity for each managed plant.
- `id`: uuid (PK)
- `user_id`: uuid (FK -> profiles.id)
- `nickname`: string (e.g., "Misty the Fern")
- `species_id`: string (Reference to a master plant library)
- `last_watered_at`: timestamp
- `last_fertilized_at`: timestamp
- `health_status`: enum (HEALTHY, THIRSTY, SICK, DORMANT)
- `location_type`: enum (INDOOR, OUTDOOR, GREENHOUSE)
- `created_at`: timestamp

### `care_logs` (History)
Audit trail of all gardening actions.
- `id`: uuid (PK)
- `plant_id`: uuid (FK -> plants.id)
- `action_type`: enum (WATER, FERTILIZE, PRUNE, REPOT, PHOTO)
- `note`: text (Optional user note or Puddlefoot observation)
- `image_url`: string (Optional photo associated with log)
- `created_at`: timestamp

### `plant_master_library` (Reference)
Curated data for plant species needs.
- `species_id`: string (PK)
- `common_name`: string
- `scientific_name`: string
- `watering_frequency_days`: integer
- `light_requirement`: enum (LOW, MEDIUM, HIGH, DIRECT)
- `toxicity_info`: text

## 2. Relationships
- **User to Plants**: 1:N (One user can have many plants)
- **Plant to Care Logs**: 1:N (One plant has many historical logs)

## 3. Indexing Strategy
- Index on `plants.user_id` for fast dashboard loading.
- Index on `care_logs.plant_id` (ordered by `created_at` DESC) for history views.
- Partial index on `plants.health_status` for emergency alerts.
