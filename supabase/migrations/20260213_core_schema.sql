-- Core Schema for TerraVanta

-- 1. Profiles (User Data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  location POINT, -- (x, y) -> (Lat, Long) for weather
  persona_affinity FLOAT DEFAULT 0.5, -- 0.0 to 1.0 (Strict to Whimsical)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Plant Master Library (Reference)
CREATE TABLE IF NOT EXISTS plant_master_library (
  species_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name TEXT NOT NULL,
  scientific_name TEXT,
  watering_frequency_days INTEGER,
  light_requirement TEXT, -- LOW, MEDIUM, HIGH, DIRECT
  toxicity_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Plants (User's Garden)
CREATE TYPE plant_health_status AS ENUM ('healthy', 'thirsty', 'sick', 'dormant');
CREATE TYPE plant_location_type AS ENUM ('indoor', 'outdoor', 'greenhouse');

CREATE TABLE IF NOT EXISTS plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  species_id UUID REFERENCES plant_master_library(species_id), -- Optional link
  species_name TEXT, -- Fallback if not linked
  last_watered_at TIMESTAMPTZ,
  last_fertilized_at TIMESTAMPTZ,
  health_status plant_health_status DEFAULT 'healthy',
  location_type plant_location_type DEFAULT 'indoor',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Care Logs (Action History)
CREATE TYPE care_action_type AS ENUM ('water', 'fertilize', 'prune', 'repot', 'photo', 'note');

CREATE TABLE IF NOT EXISTS care_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Denormalized for easy querying
  action_type care_action_type NOT NULL,
  note TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_plants_user_id ON plants(user_id);
CREATE INDEX idx_care_logs_plant_id ON care_logs(plant_id);
CREATE INDEX idx_care_logs_user_id ON care_logs(user_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_master_library ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Plants: Users can full access their own plants
CREATE POLICY "Users can fully manage own plants" ON plants FOR ALL USING (auth.uid() = user_id);

-- Care Logs: Users can full access their own logs
CREATE POLICY "Users can fully manage own logs" ON care_logs FOR ALL USING (auth.uid() = user_id);

-- Library: Public read, Admin write (assuming admin implementation later)
CREATE POLICY "Public read access to library" ON plant_master_library FOR SELECT TO authenticated USING (true);
