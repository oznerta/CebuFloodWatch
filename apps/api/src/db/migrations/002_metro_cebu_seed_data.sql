-- Seed Metro Cebu Barangays with realistic central coordinates
INSERT INTO public.barangays (id, name, psgc_code, center_geom, risk_level) VALUES
('b0000000-0000-0000-0000-000000000001', 'Mabolo', '072217045', ST_SetSRID(ST_Point(123.9167, 10.3250), 4326), 'severe'),
('b0000000-0000-0000-0000-000000000002', 'Kasambagan', '072217035', ST_SetSRID(ST_Point(123.9125, 10.3320), 4326), 'high'),
('b0000000-0000-0000-0000-000000000003', 'Mambaling', '072217048', ST_SetSRID(ST_Point(123.8742, 10.2915), 4326), 'severe'),
('b0000000-0000-0000-0000-000000000004', 'T. Padilla', '072217075', ST_SetSRID(ST_Point(123.9058, 10.3060), 4326), 'high'),
('b0000000-0000-0000-0000-000000000005', 'Guadalupe', '072217028', ST_SetSRID(ST_Point(123.8820, 10.3280), 4326), 'medium'),
('b0000000-0000-0000-0000-000000000006', 'Lahug', '072217040', ST_SetSRID(ST_Point(123.8980, 10.3390), 4326), 'medium')
ON CONFLICT (name) DO NOTHING;

-- Seed Default Admin & Focal Users
INSERT INTO public.users (id, firebase_uid, email, full_name, role, barangay_id) VALUES
('u0000000-0000-0000-0000-000000000001', 'mock_admin_uid', 'cdrrmo.admin@cebu.gov.ph', 'City DRRMO Administrator', 'admin', NULL),
('u0000000-0000-0000-0000-000000000002', 'mock_focal_mabolo', 'focal.mabolo@cebu.gov.ph', 'Mabolo Barangay Focal', 'barangay_focal', 'b0000000-0000-0000-0000-000000000001'),
('u0000000-0000-0000-0000-000000000003', 'mock_responder_1', 'responder.alpha@cebu.gov.ph', 'First Responder Unit Alpha', 'first_responder', NULL)
ON CONFLICT (email) DO NOTHING;

-- Seed Evacuation Centers
INSERT INTO public.evacuation_centers (id, barangay_id, name, location_geom, address, max_capacity, current_occupancy, status, contact_person, contact_number) VALUES
('s0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Mabolo Elementary School Gym', ST_SetSRID(ST_Point(123.9180, 10.3265), 4326), 'M.J. Cuenco Ave, Mabolo, Cebu City', 350, 85, 'open', 'Kapitan Ramos', '+63 917 123 4567'),
('s0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Kasambagan Sports Complex', ST_SetSRID(ST_Point(123.9140, 10.3340), 4326), 'Pres. Quirino St, Kasambagan, Cebu City', 250, 240, 'full', 'Kagawad Tan', '+63 918 234 5678'),
('s0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Mambaling Multi-Purpose Evacuation Hall', ST_SetSRID(ST_Point(123.8760, 10.2930), 4326), 'N. Bacalso Ave, Mambaling, Cebu City', 500, 120, 'open', 'Officer Del Rosario', '+63 920 345 6789')
ON CONFLICT DO NOTHING;

-- Seed Critical Road Segments
INSERT INTO public.road_segments (id, barangay_id, name, line_geom, is_blocked, block_reason) VALUES
('r0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'M.J. Cuenco Ave (Mabolo Bridge Section)', ST_SetSRID(ST_GeomFromText('LINESTRING(123.9150 10.3240, 123.9185 10.3270)'), 4326), TRUE, 'Suba River overflow, waist-deep flood water'),
('r0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'N. Bacalso Ave (Mambaling Underpass)', ST_SetSRID(ST_GeomFromText('LINESTRING(123.8730 10.2900, 123.8770 10.2940)'), 4326), TRUE, 'Drainage backflow, impassable to light vehicles'),
('r0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 'Guadalupe Main Road (Capitol Area)', ST_SetSRID(ST_GeomFromText('LINESTRING(123.8800 10.3250, 123.8850 10.3300)'), 4326), FALSE, NULL)
ON CONFLICT DO NOTHING;

-- Seed Sample Active Alerts
INSERT INTO public.alerts (id, author_id, barangay_id, severity, title_en, title_tl, body_en, body_tl, is_ai_drafted, status, published_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'critical', 'Critical Flood Warning: Mabolo River Overflow', 'Kritikal na Babala: Pag-apaw ng Ilog sa Mabolo', 'Water levels around M.J. Cuenco bridge have breached critical thresholds. Immediate evacuation advised.', 'Lumagpas na sa kritikal na lebel ang tubig sa tulay ng M.J. Cuenco. Pinapayuhan ang agarang paglikas.', TRUE, 'published', NOW())
ON CONFLICT DO NOTHING;
