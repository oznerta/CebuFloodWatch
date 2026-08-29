-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Barangays
CREATE TABLE IF NOT EXISTS public.barangays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    psgc_code VARCHAR(20) NOT NULL UNIQUE,
    boundary_geom GEOMETRY(MultiPolygon, 4326),
    center_geom GEOMETRY(Point, 4326) NOT NULL,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'severe')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_barangays_boundary_geom ON public.barangays USING GIST(boundary_geom);
CREATE INDEX IF NOT EXISTS idx_barangays_center_geom ON public.barangays USING GIST(center_geom);

-- 2. Users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'citizen' CHECK (role IN ('admin', 'barangay_focal', 'first_responder', 'citizen')),
    barangay_id UUID REFERENCES public.barangays(id) ON DELETE SET NULL,
    phone_number VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_barangay_id ON public.users(barangay_id);

-- 3. Incident Clusters (AI Deduplication grouping)
CREATE TABLE IF NOT EXISTS public.incident_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
    centroid_geom GEOMETRY(Point, 4326) NOT NULL,
    summary_en TEXT NOT NULL,
    summary_tl TEXT NOT NULL,
    confidence_score REAL NOT NULL DEFAULT 1.0,
    report_count INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incident_clusters_centroid ON public.incident_clusters USING GIST(centroid_geom);

-- 4. Citizen Reports
CREATE TABLE IF NOT EXISTS public.citizen_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
    incident_cluster_id UUID REFERENCES public.incident_clusters(id) ON DELETE SET NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    flood_depth_level VARCHAR(20) NOT NULL CHECK (flood_depth_level IN ('ankle', 'knee', 'waist', 'chest', 'above_head')),
    description TEXT,
    photo_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'resolved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_location_geom ON public.citizen_reports USING GIST(location_geom);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_barangay_id ON public.citizen_reports(barangay_id);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_status ON public.citizen_reports(status);

-- 5. Evacuation Centers
CREATE TABLE IF NOT EXISTS public.evacuation_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    address TEXT NOT NULL,
    max_capacity INTEGER NOT NULL DEFAULT 100,
    current_occupancy INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'closed')),
    supply_notes TEXT,
    contact_person VARCHAR(100),
    contact_number VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evacuation_centers_location_geom ON public.evacuation_centers USING GIST(location_geom);
CREATE INDEX IF NOT EXISTS idx_evacuation_centers_status ON public.evacuation_centers(status);

-- 6. Road Segments
CREATE TABLE IF NOT EXISTS public.road_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barangay_id UUID REFERENCES public.barangays(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    line_geom GEOMETRY(LineString, 4326) NOT NULL,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    block_reason TEXT,
    blocked_at TIMESTAMPTZ,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_road_segments_line_geom ON public.road_segments USING GIST(line_geom);
CREATE INDEX IF NOT EXISTS idx_road_segments_is_blocked ON public.road_segments(is_blocked);

-- 7. Evacuation Corridors
CREATE TABLE IF NOT EXISTS public.evacuation_corridors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
    destination_shelter_id UUID NOT NULL REFERENCES public.evacuation_centers(id) ON DELETE CASCADE,
    route_name VARCHAR(150) NOT NULL,
    route_geom GEOMETRY(LineString, 4326) NOT NULL,
    corridor_steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_penalized BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evacuation_corridors_route_geom ON public.evacuation_corridors USING GIST(route_geom);

-- 8. Emergency Alerts
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    barangay_id UUID REFERENCES public.barangays(id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('advisory', 'watch', 'warning', 'critical')),
    title_en VARCHAR(200) NOT NULL,
    title_tl VARCHAR(200) NOT NULL,
    body_en TEXT NOT NULL,
    body_tl TEXT NOT NULL,
    raw_prompt_input TEXT,
    is_ai_drafted BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published', 'archived')),
    fcm_message_id VARCHAR(100),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alerts_barangay_id ON public.alerts(barangay_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);

-- 9. Emergency Contacts
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    contact_name VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON public.emergency_contacts(user_id);

-- 10. Safety Broadcasts
CREATE TABLE IF NOT EXISTS public.safety_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL CHECK (status IN ('safe', 'needs_assistance')),
    location_geom GEOMETRY(Point, 4326),
    message TEXT,
    broadcasted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_safety_broadcasts_user ON public.safety_broadcasts(user_id);
