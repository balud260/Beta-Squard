import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shield, Hospital, GraduationCap, MapPin, CheckCircle2, Sparkles } from 'lucide-react';

// Custom Leaflet Markers
const disasterIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const universityIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const siteIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function DisasterMap({ disaster, relocationSites = [], hospitals = [], universities = [] }) {
  const center = [disaster?.lat || 28.6139, disaster?.lng || 77.2090];

  return (
    <div style={{ height: '440px', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Disaster Epicenter Marker */}
        {disaster && (
          <>
            <Marker position={[disaster.lat, disaster.lng]} icon={disasterIcon}>
              <Popup>
                <div style={{ padding: '0.2rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--status-danger)', fontSize: '0.95rem' }}>
                    🚨 {disaster.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.2rem' }}>
                    Severity: <strong>{disaster.severity}</strong> • Affected: {disaster.affected_population?.toLocaleString()}
                  </div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[disaster.lat, disaster.lng]}
              radius={2800}
              pathOptions={{ color: 'red', fillColor: '#ef4444', fillOpacity: 0.25, weight: 2 }}
            />
          </>
        )}

        {/* Relocation Sites with AI / Government Approved Badges */}
        {relocationSites.map((site) => (
          <Marker key={`site-${site.id}`} position={[site.lat, site.lng]} icon={siteIcon}>
            <Popup>
              <div style={{ padding: '0.2rem' }}>
                <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.2rem' }}>
                  {site.status === 'APPROVED' ? (
                    <span style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                      GOVERNMENT APPROVED DECISION
                    </span>
                  ) : (
                    <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-blue)', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                      AI RECOMMENDATION
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>🏠 {site.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.2rem' }}>
                  Capacity: {site.capacity?.toLocaleString()} • Dist: {site.hospital_distance_km} km
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Hospitals with Available Beds & Expected Inflow */}
        {hospitals.map((h) => (
          <Marker key={`hosp-${h.id}`} position={[h.lat, h.lng]} icon={hospitalIcon}>
            <Popup>
              <div style={{ padding: '0.2rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#7c3aed' }}>🏥 {h.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.2rem' }}>
                  Available Beds: <strong>{h.available_beds}</strong> / {h.total_beds}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--status-warning)', marginTop: '0.15rem', fontWeight: 600 }}>
                  Expected Patient Inflow: +{h.expected_inflow || 120}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Nearby Universities with Priority Distance Labels */}
        {universities.map((u) => (
          <Marker key={`univ-${u.id}`} position={[u.lat, u.lng]} icon={universityIcon}>
            <Popup>
              <div style={{ padding: '0.2rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary-blue)', marginBottom: '0.2rem' }}>
                  {u.priority_label || 'RESPONSE HUB'} ({u.distance_km || 3.2} km)
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>🎓 {u.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.2rem' }}>
                  Volunteers: {u.nss_capacity + u.ncc_capacity} • Students: {u.total_students}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
