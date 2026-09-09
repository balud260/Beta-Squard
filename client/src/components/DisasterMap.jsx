import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shield, Hospital, GraduationCap, MapPin, CheckCircle2, Sparkles, Flame, Radio } from 'lucide-react';

// Custom Leaflet Markers
const disasterIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [28, 45],
  iconAnchor: [14, 45],
  popupAnchor: [1, -38],
  shadowSize: [41, 41]
});

const highRiskUnivIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const medRiskUnivIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const lowRiskUnivIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const defaultUnivIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
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

const siteIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map View Controller Helper to dynamically adjust Leaflet view without re-creating container
function MapViewController({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2 && bounds[0][0] && !isNaN(bounds[0][0])) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10, animate: true });
    } else if (center && center[0] && center[1] && !isNaN(center[0])) {
      map.setView(center, zoom || 9, { animate: true });
    }
  }, [map, center, zoom, bounds]);
  return null;
}

export default function DisasterMap({ disaster, relocationSites = [], hospitals = [], universities = [], isSimulationOverride = false }) {
  const lat = Number(disaster?.lat || disaster?.latitude || 28.6139);
  const lng = Number(disaster?.lng || disaster?.longitude || 77.2090);
  const center = [lat, lng];

  const radiusKm = Number(disaster?.affected_radius_km || disaster?.impact_radius || 15.0);
  const radiusMeters = radiusKm * 1000;

  // Compute bounding box around disaster epicenter and impact radius for proper Leaflet view fitting
  const latDelta = radiusKm / 111.0;
  const lngDelta = radiusKm / (111.0 * Math.max(0.1, Math.cos(lat * Math.PI / 180)));
  const bounds = [
    [lat - latDelta * 1.15, lng - lngDelta * 1.15],
    [lat + latDelta * 1.15, lng + lngDelta * 1.15]
  ];

  const isSimulation = isSimulationOverride || Boolean(disaster?.is_simulation);

  const getUniversityIcon = (u) => {
    if (u.risk_level === 'HIGH') return highRiskUnivIcon;
    if (u.risk_level === 'MEDIUM') return medRiskUnivIcon;
    if (u.risk_level === 'LOW' || u.risk_level === 'SAFE') return lowRiskUnivIcon;
    return defaultUnivIcon;
  };

  return (
    <div style={{ position: 'relative', height: '450px', width: '100%', maxWidth: '100%', minWidth: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>

      {/* Simulation Mode Overlay Badge */}
      {isSimulation && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          backgroundColor: 'rgba(15, 23, 42, 0.90)',
          backdropFilter: 'blur(8px)',
          color: '#FFFFFF',
          padding: '6px 14px',
          borderRadius: '10px',
          border: '1px solid rgba(239, 68, 68, 0.6)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          pointerEvents: 'none'
        }}>
          <div style={{ color: '#f87171', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.04em' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
            SIMULATION MAP
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '0.65rem', fontWeight: 600, marginTop: '2px' }}>
            NOT A LIVE EMERGENCY
          </div>
        </div>
      )}

      {/* Simulation Map Legend */}
      {isSimulation && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 1000,
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          color: '#FFFFFF',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          fontSize: '0.7rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          pointerEvents: 'none'
        }}>
          <div style={{ fontWeight: 800, color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            SIMULATION MAP LEGEND
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#ef4444' }}>●</span> Simulated Disaster
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#f87171' }}>○</span> Impact Zone ({radiusKm} KM)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#ef4444' }}>●</span> High Risk University
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#f97316' }}>●</span> Medium Risk University
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#22c55e' }}>●</span> Low Risk / Safe
          </div>
        </div>
      )}

      <MapContainer center={center} zoom={9} style={{ height: '100%', width: '100%', minWidth: 0 }}>
        <MapViewController center={center} zoom={9} bounds={bounds} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Disaster Epicenter Marker & Impact Circle */}
        {disaster && (
          <>
            <Marker position={center} icon={disasterIcon}>
              <Popup>
                <div style={{ padding: '0.2rem', maxWidth: '240px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: isSimulation ? 'var(--terracotta)' : 'var(--navy)', textTransform: 'uppercase', marginBottom: '2px' }}>
                    {isSimulation ? 'SIMULATED DISASTER' : 'LIVE OPERATIONAL INCIDENT'}
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--status-danger)', fontSize: '0.95rem', lineHeight: 1.3 }}>
                    🚨 {disaster.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#444', marginTop: '0.3rem', lineHeight: 1.4 }}>
                    Type: <strong>{disaster.type || disaster.disaster_type || 'Disaster'}</strong> • Severity: <strong style={{ color: 'var(--status-danger)' }}>{disaster.severity}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.2rem' }}>
                    Impact Radius: <strong>{radiusKm} KM</strong>
                  </div>
                  {disaster.location && (
                    <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '0.2rem' }}>
                      📍 {disaster.location}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>

            {/* Impact Circle */}
            <Circle
              center={center}
              radius={radiusMeters}
              pathOptions={{
                color: isSimulation ? '#c2410c' : '#ef4444',
                fillColor: isSimulation ? '#f97316' : '#ef4444',
                fillOpacity: 0.22,
                weight: 2,
                dashArray: isSimulation ? '6, 6' : undefined
              }}
            />
          </>
        )}

        {/* Relocation Sites */}
        {relocationSites.map((site) => (
          <Marker key={`site-${site.id}`} position={[site.lat || lat + 0.05, site.lng || lng + 0.04]} icon={siteIcon}>
            <Popup>
              <div style={{ padding: '0.2rem' }}>
                <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.2rem' }}>
                  {site.status === 'APPROVED' ? (
                    <span style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                      GOVERNMENT APPROVED
                    </span>
                  ) : (
                    <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-blue)', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                      AI RECOMMENDATION
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>🏠 {site.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.2rem' }}>
                  Capacity: {site.capacity?.toLocaleString()} • Dist: {site.hospital_distance_km || 3.5} km
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Regional Hospitals */}
        {hospitals.map((h) => (
          <Marker key={`hosp-${h.id}`} position={[h.lat || lat - 0.03, h.lng || lng - 0.02]} icon={hospitalIcon}>
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

        {/* Nearby Universities & Risk Classifications */}
        {universities.map((u) => {
          const uLat = Number(u.university_lat || u.lat || lat + 0.03);
          const uLng = Number(u.university_lng || u.lng || lng + 0.02);
          const uIcon = getUniversityIcon(u);
          const isHigh = u.risk_level === 'HIGH';
          const isMed = u.risk_level === 'MEDIUM';

          return (
            <Marker key={`univ-${u.id || u.university_id}`} position={[uLat, uLng]} icon={uIcon}>
              <Popup>
                <div style={{ padding: '0.25rem', maxWidth: '230px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    {u.risk_level ? (
                      <span style={{
                        backgroundColor: isHigh ? 'var(--status-danger-bg)' : isMed ? 'var(--status-warning-bg)' : 'var(--status-success-bg)',
                        color: isHigh ? 'var(--status-danger)' : isMed ? 'var(--status-warning)' : 'var(--status-success)',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {u.risk_level} RISK
                      </span>
                    ) : (
                      <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-blue)', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        {u.priority_label || 'RESPONSE HUB'}
                      </span>
                    )}

                    {u.distance_km !== undefined && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#666' }}>
                        {u.distance_km} km away
                      </span>
                    )}
                  </div>

                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--navy)', lineHeight: 1.3 }}>
                    🎓 {u.name || u.university_name}
                  </div>

                  {u.risk_reason && (
                    <div style={{ fontSize: '0.72rem', color: '#444', marginTop: '0.35rem', backgroundColor: '#f8fafc', padding: '0.35rem', borderRadius: '4px', borderLeft: '3px solid var(--navy)', lineHeight: 1.3 }}>
                      {u.risk_reason}
                    </div>
                  )}

                  <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Acknowledged: <strong>{u.acknowledged ? '✓ Yes' : '⏳ Pending'}</strong></span>
                    <span>Response: <strong style={{ color: u.response_status === 'ACTIVE' ? 'var(--status-success)' : 'var(--text-muted)' }}>{u.response_status || 'READY'}</strong></span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
