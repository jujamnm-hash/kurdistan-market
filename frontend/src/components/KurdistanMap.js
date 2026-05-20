import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const onlineIcon = new L.DivIcon({
  html: `<div style="
    background: #10b981;
    width: 36px; height: 36px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;
  "><span style="transform:rotate(45deg);font-size:16px;">🛒</span></div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -38],
});

const userIcon = new L.DivIcon({
  html: `<div style="
    background: #3b82f6;
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 3px 10px rgba(0,0,0,0.4);
    display:flex;align-items:center;justify-content:center;
    font-size: 14px;
  ">📍</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
}

const KurdistanMap = ({ sellers, userLocation, selectedSeller, onSelectSeller }) => {
  // Default: Kurdistan region center
  const defaultCenter = [36.1901, 44.0091];

  const renderStars = (avg) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= Math.round(avg) ? '#f59e0b' : '#d1d5db' }}>★</span>
      );
    }
    return stars;
  };

  return (
    <MapContainer
      center={userLocation || defaultCenter}
      zoom={userLocation ? 13 : 8}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {userLocation && (
        <>
          <RecenterMap center={userLocation} />
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="map-popup">
                <h4>📍 شوێنی ئێستاتان</h4>
              </div>
            </Popup>
          </Marker>
          <Circle
            center={userLocation}
            radius={2000}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05, weight: 1, dashArray: '5,5' }}
          />
        </>
      )}

      {sellers.filter(s => s.isOnline && s.location?.lat).map(seller => (
        <Marker
          key={seller._id}
          position={[seller.location.lat, seller.location.lng]}
          icon={onlineIcon}
          eventHandlers={{ click: () => onSelectSeller(seller) }}
        >
          <Popup>
            <div className="map-popup">
              <h4>🛒 {seller.name}</h4>
              {seller.rating?.average > 0 && (
                <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                  {renderStars(seller.rating.average)}
                  <span style={{ fontSize: 12, color: '#6b7280' }}>({seller.rating.count})</span>
                </div>
              )}
              {seller.description && <p>{seller.description}</p>}
              {seller.location?.road && <p>📍 {seller.location.road}</p>}
              {seller.products?.length > 0 && (
                <p>🧺 {seller.products.slice(0, 3).map(p => p.name).join('، ')}{seller.products.length > 3 ? '...' : ''}</p>
              )}
              {seller.distanceText && (
                <p style={{ color: '#10b981', fontWeight: 700 }}>
                  📏 {seller.distanceText} — ⏱ {seller.travelTimeText}
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                <a
                  href={`tel:${seller.phone}`}
                  style={{
                    background: '#059669', color: 'white', border: 'none',
                    padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13, textAlign: 'center',
                    textDecoration: 'none', display: 'block'
                  }}
                >
                  📞 پەیوەندی
                </a>
                <button
                  onClick={() => onSelectSeller(seller)}
                  style={{
                    background: '#2d6a4f', color: 'white',
                    border: 'none', padding: '6px 10px', borderRadius: 8,
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 13
                  }}
                >
                  زیاتر ببینە
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default KurdistanMap;
