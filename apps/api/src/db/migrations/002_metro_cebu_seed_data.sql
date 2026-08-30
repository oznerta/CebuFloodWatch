-- Metro Cebu Reference Barangays with Geometries & PSGC Codes
INSERT INTO public.barangays (id, name, psgc_code, center_geom, risk_level) VALUES
('a0000000-0000-4000-8000-000000000001', 'Mabolo', '072217045', ST_SetSRID(ST_Point(123.9167, 10.3250), 4326), 'severe'),
('a0000000-0000-4000-8000-000000000002', 'Kasambagan', '072217035', ST_SetSRID(ST_Point(123.9125, 10.3320), 4326), 'high'),
('a0000000-0000-4000-8000-000000000003', 'Mambaling', '072217048', ST_SetSRID(ST_Point(123.8742, 10.2915), 4326), 'severe'),
('a0000000-0000-4000-8000-000000000004', 'T. Padilla', '072217075', ST_SetSRID(ST_Point(123.9058, 10.3060), 4326), 'high'),
('a0000000-0000-4000-8000-000000000005', 'Guadalupe', '072217028', ST_SetSRID(ST_Point(123.8820, 10.3280), 4326), 'medium'),
('a0000000-0000-4000-8000-000000000006', 'Lahug', '072217040', ST_SetSRID(ST_Point(123.8980, 10.3390), 4326), 'medium')
ON CONFLICT (name) DO UPDATE SET
  psgc_code = EXCLUDED.psgc_code,
  center_geom = EXCLUDED.center_geom,
  risk_level = EXCLUDED.risk_level;

-- Official Evacuation Centers (Real Metro Cebu Locations)
INSERT INTO public.evacuation_centers (id, barangay_id, name, location_geom, address, max_capacity, current_occupancy, status, contact_person, contact_number) VALUES
('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Mabolo Elementary School Gym', ST_SetSRID(ST_Point(123.9180, 10.3265), 4326), 'M.J. Cuenco Ave, Mabolo, Cebu City', 350, 0, 'open', 'Barangay Disaster Desk', '+63 917 123 4567'),
('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'Kasambagan Sports Complex', ST_SetSRID(ST_Point(123.9140, 10.3340), 4326), 'Pres. Quirino St, Kasambagan, Cebu City', 250, 0, 'open', 'Kasambagan DRRM Office', '+63 918 234 5678'),
('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', 'Mambaling Multi-Purpose Evacuation Hall', ST_SetSRID(ST_Point(123.8760, 10.2930), 4326), 'N. Bacalso Ave, Mambaling, Cebu City', 500, 0, 'open', 'Mambaling Operation Center', '+63 920 345 6789')
ON CONFLICT DO NOTHING;
