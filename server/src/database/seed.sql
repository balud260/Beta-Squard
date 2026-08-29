-- SolveLink AI Seed Data (Three Primary Authorities Model)

-- Clear existing data
DELETE FROM audit_logs;
DELETE FROM impact_metrics;
DELETE FROM notifications;
DELETE FROM volunteer_responses;
DELETE FROM disaster_requirements;
DELETE FROM relocation_sites;
DELETE FROM disasters;
DELETE FROM project_updates;
DELETE FROM projects;
DELETE FROM proposal_versions;
DELETE FROM proposals;
DELETE FROM student_solution_submissions;
DELETE FROM university_problem_acceptances;
DELETE FROM problem_matches;
DELETE FROM problem_analysis;
DELETE FROM problems;
DELETE FROM faculty;
DELETE FROM students;
DELETE FROM hospitals;
DELETE FROM departments;
DELETE FROM universities;
DELETE FROM organizations;
DELETE FROM users;

-- Reset autoincrement
DELETE FROM sqlite_sequence;

-- 1. Insert Organizations (Problem Owner Categories)
INSERT INTO organizations (id, name, type, location, lat, lng, contact_email) VALUES
(1, 'District General Hospital', 'HOSPITAL', 'Central District Avenue', 28.6139, 77.2090, 'admin@districthospital.org'),
(2, 'State Disaster Management Authority', 'GOVERNMENT', 'Capital Emergency HQ', 28.6100, 77.2300, 'sdma@state.gov.in'),
(3, 'HealthForAll Global NGO', 'NGO', 'Health Enclave Sector 12', 28.5900, 77.2100, 'info@healthforall.org'),
(4, 'Metro City Municipal Corporation', 'MUNICIPALITY', 'Metro City Sector 4', 28.6150, 77.2050, 'contact@metrocity.gov.in');

-- 2. Insert Universities (5 Top Institutions)
INSERT INTO universities (id, name, code, location, lat, lng, total_students, nss_capacity, ncc_capacity, research_focus, equipment_summary) VALUES
(1, 'National Institute of Technology (NIT) District X', 'NITDX', 'North Campus, District X', 28.6300, 77.2200, 4500, 350, 200, 'GIS Mapping, AI/ML, Structural Engineering', 'High-res Drones, GIS Servers, Water Testing Labs'),
(2, 'Apex Medical University & Hospital', 'AMUH', 'Central Medical Enclave', 28.6050, 77.2150, 2800, 400, 150, 'Emergency Medicine, Public Health, Disaster Trauma', 'Mobile ICU Van, Trauma Care Equipment, Field Medical Kits'),
(3, 'Metropolitan College of Engineering', 'MCE', 'East Tech Zone', 28.6400, 77.2500, 3200, 250, 100, 'Robotics, Drone Swarms, IoT Sensors', 'Thermal Imaging Drones, Portable Water Purifiers, Mesh Radio'),
(4, 'Global Science & Research Institute', 'GSRI', 'South Knowledge Park', 28.5800, 77.1900, 1900, 150, 80, 'Environmental Sensing, Waste Management, Hydrology', 'Water Spectrometer, Waste Composting Pilot Plant'),
(5, 'State Technological University', 'STU', 'West University Highway', 28.6200, 77.1700, 5100, 500, 300, 'Software Systems, Data Analytics, Civic Apps', 'Cloud Compute Cluster, Mobile App Testing Lab');

-- 3. Insert Departments
INSERT INTO departments (id, university_id, name, faculty_count, student_count) VALUES
(1, 1, 'Computer Science & AI', 35, 800),
(2, 1, 'Civil & Environmental Engineering', 28, 650),
(3, 1, 'Geoinformatics & Remote Sensing', 15, 300),
(4, 2, 'Emergency Medicine & Surgery', 45, 500),
(5, 2, 'Community Health & Nursing', 50, 750),
(6, 3, 'Robotics & Automation', 20, 450),
(7, 3, 'Electrical & IoT Engineering', 25, 550);

-- 4. Insert Hospitals (Operational Disaster Entities)
INSERT INTO hospitals (id, name, location, lat, lng, total_beds, available_beds, emergency_capacity, staff_count, status, phone) VALUES
(1, 'District General Hospital', 'Central District Avenue', 28.6139, 77.2090, 500, 42, 80, 210, 'OPERATIONAL', '+91 11 2345 6789'),
(2, 'Apex Emergency Care Center', 'North Sector Medical Zone', 28.6250, 77.2180, 300, 18, 50, 130, 'NEAR_CAPACITY', '+91 11 2345 9999'),
(3, 'St. Jude Medical Institute', 'South Riverside Enclave', 28.6010, 77.1950, 450, 65, 70, 180, 'OPERATIONAL', '+91 11 2345 4444');

-- 5. Insert Users (Strictly Three Primary Authorities + Integrated Student)
INSERT INTO users (id, name, email, password_hash, role, organization_id, university_id, hospital_id, phone, status) VALUES
(1, 'Commander Rajesh Sharma (Government)', 'government@solvelink.demo', '$2a$10$w09ZkE1h/0G9F6yXg.KkTe2O9R1t9.TjV2Y5K8mR7O.wZ0F9zX8bO', 'GOVERNMENT', 2, NULL, NULL, '+91 98765 00001', 'ACTIVE'),
(2, 'Dr. Sunita Deshmukh (Hospital Owner)', 'owner@solvelink.demo', '$2a$10$w09ZkE1h/0G9F6yXg.KkTe2O9R1t9.TjV2Y5K8mR7O.wZ0F9zX8bO', 'PROBLEM_OWNER', 1, NULL, NULL, '+91 98765 00002', 'ACTIVE'),
(3, 'Prof. Arvind Kulkarni (University)', 'university@solvelink.demo', '$2a$10$w09ZkE1h/0G9F6yXg.KkTe2O9R1t9.TjV2Y5K8mR7O.wZ0F9zX8bO', 'UNIVERSITY_ADMIN', NULL, 1, NULL, '+91 98765 00003', 'ACTIVE'),
(4, 'Aarav Mehta (Integrated Student)', 'student@solvelink.demo', '$2a$10$w09ZkE1h/0G9F6yXg.KkTe2O9R1t9.TjV2Y5K8mR7O.wZ0F9zX8bO', 'STUDENT', NULL, 1, NULL, '+91 98765 00004', 'ACTIVE'),
(5, 'Dr. Ananya Sen (NGO Problem Owner)', 'owner2@solvelink.demo', '$2a$10$w09ZkE1h/0G9F6yXg.KkTe2O9R1t9.TjV2Y5K8mR7O.wZ0F9zX8bO', 'PROBLEM_OWNER', 3, NULL, NULL, '+91 98765 00005', 'ACTIVE'),
(6, 'Priya Nair (Faculty)', 'faculty@solvelink.demo', '$2a$10$w09ZkE1h/0G9F6yXg.KkTe2O9R1t9.TjV2Y5K8mR7O.wZ0F9zX8bO', 'FACULTY', NULL, 1, NULL, '+91 98765 00006', 'ACTIVE');

-- 6. Insert Student Record
INSERT INTO students (id, user_id, university_id, department_id, roll_number, skills_json, nss_member, ncc_member, availability_status) VALUES
(1, 4, 1, 1, 'NIT-2024-CS89', '["Medical Support", "First Aid", "GIS Mapping", "Drone Operation", "React", "Node.js"]', 1, 1, 'AVAILABLE');

-- 7. Insert Faculty Record
INSERT INTO faculty (id, user_id, university_id, department_id, specialization, designation) VALUES
(1, 6, 1, 3, 'Geospatial Analytics & Disaster Mitigation', 'Associate Professor');

-- 8. Insert Problems from Multiple Problem Owners
INSERT INTO problems (id, title, description, category, subcategory, location, lat, lng, urgency, expected_impact, target_users, budget, timeline, owner_id, status) VALUES
(1, 'Reduce Outpatient Waiting Time & OPD Queue Triage', 'High patient crowding in OPD department causing emergency delays. Requires automated digital queue triage, AI appointment slotting, and SMS status dispatch.', 'HEALTHCARE', 'Hospital Operations', 'District General Hospital OPD', 28.6139, 77.2090, 'HIGH', '3,000 daily OPD patients benefit from 50% reduced waiting time.', 'Outpatients, Hospital Triage Nurses, OPD Doctors', 200000, '3 Months', 2, 'PUBLISHED'),
(2, 'Rural Tele-Healthcare & Emergency Alert Platform', 'Lack of immediate medical access in rural Sector 12 villages. Requires lightweight mobile diagnostic app, offline sync, emergency doctor dispatch system, and AI triage assistance.', 'HEALTHCARE', 'Rural Telemedicine', 'Rural Sector 12', 28.5900, 77.2100, 'HIGH', '15,000 rural families provided immediate tele-consultation & emergency dispatch.', 'Rural Patients, ASHA Workers, Emergency Doctors', 300000, '6 Months', 5, 'PUBLISHED'),
(3, 'Flood Early Warning & River Level Sensor Network', 'River water overflow risk in low-lying district basin. Requires LoRaWAN river level sensors, AI surge prediction, and automated broadcast alert dispatcher.', 'CIVIC_INFRASTRUCTURE', 'Disaster Mitigation', 'District X Riverside', 28.6300, 77.2200, 'CRITICAL', '45,000 residents warned 4 hours prior to flood surge.', 'Disaster Officers, Emergency First Responders', 400000, '5 Months', 1, 'PUBLISHED');

-- 9. Insert AI Problem Analysis for Problems
INSERT INTO problem_analysis (id, problem_id, category, subcategory, required_skills_json, required_technologies_json, required_departments_json, difficulty, urgency, social_impact, estimated_resources, solution_areas_json) VALUES
(1, 1, 'HEALTHCARE', 'Hospital Operations', '["Queue Optimization", "Mobile App Development", "AI Slot Scheduling"]', '["Node.js", "React Native", "WhatsApp API"]', '["Computer Science & AI", "Emergency Medicine & Surgery"]', 'MODERATE', 'HIGH', 'CRITICAL', 'Kiosk Hardware (x4), Queue Server, SMS Gateway', '["Digital queue tokens", "Predictive doctor slotting", "WhatsApp triage"]'),
(2, 2, 'HEALTHCARE', 'Rural Telemedicine', '["Tele-Consultation", "Mobile App (Offline Sync)", "AI Triage", "Medical Support"]', '["React", "Node.js", "SQLite", "TensorFlow Lite"]', '["Computer Science & AI", "Emergency Medicine & Surgery", "Community Health"]', 'HIGH', 'HIGH', 'CRITICAL', 'Mobile Test Kits, Telemedicine Server, ASHA Training', '["Offline medical record sync", "AI symptom checker", "Doctor dispatch"]'),
(3, 3, 'CIVIC_INFRASTRUCTURE', 'Disaster Mitigation', '["GIS Mapping", "Drone Operation", "IoT Sensors", "Hydro-Modeling"]', '["LoRaWAN", "OpenStreetMap", "Python GIS"]', '["Geoinformatics & Remote Sensing", "Civil Engineering"]', 'HIGH', 'CRITICAL', 'CRITICAL', 'Ultrasonic River Sensors, Mesh Radios, GIS Server', '["Automated early warning", "Surge level predictor"]');

-- 10. Insert Problem Matches
INSERT INTO problem_matches (id, problem_id, university_id, match_score, reasons_json) VALUES
(1, 1, 1, 94, '["✓ Strong Computer Science & Medical Depts", "✓ Queue Optimization & AI focus", "✓ 35 qualified CS students"]'),
(2, 1, 2, 96, '["✓ Apex Medical University & Hospital", "✓ OPD Operations & Emergency Medicine expertise"]'),
(3, 2, 2, 96, '["✓ Top Emergency Medicine & Nursing Depts", "✓ Mobile ICU Van & Field Kits available", "✓ 400 NSS Medical Volunteers"]'),
(4, 3, 1, 95, '["✓ Geoinformatics & Remote Sensing Dept", "✓ High-res Drones & GIS Servers", "✓ Civil Eng Hydro-modeling"]');

-- 11. Insert University Problem Acceptances
INSERT INTO university_problem_acceptances (id, university_id, problem_id, status, assigned_department_id, assigned_mentor_id) VALUES
(1, 1, 1, 'ACCEPTED', 1, 1),
(2, 1, 3, 'ACCEPTED', 3, 1),
(3, 2, 2, 'ACCEPTED', 4, NULL);

-- 12. Insert Proposals
INSERT INTO proposals (id, problem_id, university_id, submitted_by, summary, approach, team_structure, cost, timeline, feasibility_score, impact_score, risk_level, status, version) VALUES
(1, 1, 1, 3, 'SmartOPD-AI: Queue Optimization & Triage Kiosk System', 'Deploy touch-screen kiosks and QR token dispatch connected to predictive slotting engine.', '1 Faculty Lead, 4 CSE Students, 2 Medical Interns', 180000, '3 Months', 95, 96, 'LOW', 'SUBMITTED', 2),
(2, 2, 2, 3, 'Apex TeleMed: Community Health Sync & Emergency Dispatch', 'Offline-first mobile app for ASHA workers with AI symptom triaging and mobile ICU van routing.', '2 Medical Faculty, 6 Nursing Students, 2 CS Students', 280000, '5 Months', 95, 98, 'LOW', 'SUBMITTED', 1);

-- 13. Insert Projects
INSERT INTO projects (id, problem_id, proposal_id, university_id, title, status, progress_pct, lead_mentor_id) VALUES
(1, 1, 1, 1, 'SmartOPD-AI Deployment Phase', 'DEVELOPMENT', 45, 1);

-- 14. Insert Project Updates
INSERT INTO project_updates (id, project_id, title, content, version, feedback, created_by) VALUES
(1, 1, 'OPD Triage Kiosk Hardware Assembled', 'Completed testing of 4 touch kiosks with QR thermal printers.', 'v1.0', 'Excellent progress!', 3);

-- 15. Insert Active Flood Disaster
INSERT INTO disasters (id, title, type, location, lat, lng, severity, affected_population, vulnerable_population, hazard_info, status) VALUES
(1, 'Major Flood Incident - District X', 'Flood', 'Riverside Basin & Sector 3-7, District X', 28.6139, 77.2090, 'CRITICAL', 45000, 8500, 'River water level 2.4m above critical mark. Heavy rainfall continuing over next 24h. 4 major arterial roads inundated.', 'RESPONSE_ACTIVE');

-- 16. Insert Relocation Sites
INSERT INTO relocation_sites (id, disaster_id, name, location, lat, lng, capacity, current_occupancy, hospital_distance_km, road_status, risk_level, score, status) VALUES
(1, 1, 'Relocation Site Alpha (District Sports Complex)', 'North High Ground Sector 2', 28.6350, 77.2180, 5000, 1200, 3.2, 'OPEN', 'LOW', 94, 'APPROVED'),
(2, 1, 'Relocation Site Beta (STU Indoor Stadium)', 'West Highway Campus', 28.6220, 77.1750, 8000, 450, 5.8, 'OPEN', 'LOW', 89, 'PROPOSING');

-- 17. Insert Disaster Volunteer Requirements
INSERT INTO disaster_requirements (id, disaster_id, role_type, required_count, fulfilled_count, urgency) VALUES
(1, 1, 'Medical Support', 20, 0, 'CRITICAL'),
(2, 1, 'Relief Operations', 50, 0, 'HIGH'),
(3, 1, 'Technical / GIS', 10, 0, 'MEDIUM');

-- 18. Insert Notifications
INSERT INTO notifications (id, user_id, role_target, title, message, type, is_read, metadata_json) VALUES
(1, 2, 'PROBLEM_OWNER', '🎓 University Accepted Your Problem', 'National Institute of Technology (NIT) District X accepted your challenge: Reduce Outpatient Waiting Time.', 'ACCEPTANCE', 0, '{"problem_id": 1, "university_id": 1}'),
(2, NULL, 'STUDENT', '🚨 EMERGENCY DISASTER ALERT: Medical Volunteers Needed', 'Critical Flood Incident in District X requires 20 Medical Support & First Aid volunteers at Site Alpha.', 'EMERGENCY', 0, '{"disaster_id": 1, "role_required": "Medical Support"}');

-- 19. Insert Impact Metrics
INSERT INTO impact_metrics (id, project_id, metric_name, before_value, after_value, unit, improvement_pct) VALUES
(1, 1, 'OPD Average Patient Wait Time', '110 minutes', '28 minutes', 'minutes', 74.5),
(2, 1, 'Daily Patient Satisfaction Score', '2.8 / 5', '4.6 / 5', 'rating', 64.2);

-- 20. Insert Student Solution Submissions
INSERT INTO student_solution_submissions (id, problem_id, student_id, university_id, title, description, technology, approach, expected_impact, estimated_timeline, status) VALUES
(1, 1, 1, 1, 'Smart OPD QR Token Kiosk', 'QR-code digital token kiosk dispatching SMS alerts when queue position is 3 spots away.', 'React, Node.js, Twilio SMS', 'Install kiosks at District Hospital main entrance.', '50% reduced crowding', '2 Months', 'REVIEWED');

-- 21. Insert Audit Logs
INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details) VALUES
(1, 1, 'DISASTER_CREATED', 'DISASTER', 1, 'Commander Rajesh Sharma logged Major Flood Incident - District X'),
(2, 2, 'PROBLEM_SUBMITTED', 'PROBLEM', 1, 'Dr. Sunita Deshmukh (District Hospital) submitted OPD Waiting Time challenge');
