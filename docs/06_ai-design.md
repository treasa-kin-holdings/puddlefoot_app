# TErraVanta AI Design & Tool Schemas (06_ai-design.md)

This document defines how the TerraVanta AI interacts with data and the specific tools available to it.

## 1. AI Data Boundaries (Non-Negotiable)
- **Access**: AI only has read/write access to the specific user's `plants` and `care_logs` tables.
- **Safety**: No PII (emails, names) is sent to the LLM. Only plant nicknames and care data.

## 2. Tool Interfaces (Gemini Function Calling)

### `get_plant_history`
Retrieves the care history for a specific plant to provide context for care advice.
- **Parameters**:
  ```json
  {
    "plant_id": "string"
  }
  ```

### `record_care_action`
Allows TerraVanta to automatically log an action the user confirmed in chat.
- **Parameters**:
  ```json
  {
    "plant_id": "string",
    "action_type": "WATER | FERTILIZE",
    "note": "string"
  }
  ```

### `search_plant_library`
Accesses the curated `plant_master_library` for evidence-based care facts.
- **Parameters**:
  ```json
  {
    "query": "string (common or scientific name)"
  }
  ```

## 3. TerraVanta Interaction Logic
- **Meticulousness**: TerraVanta cross-references historical `care_logs` before making a suggestion.
- **Consistency**: If data is missing (e.g., `last_watered_at` is null), TerraVanta must gracefully ask the user rather than guessing.
