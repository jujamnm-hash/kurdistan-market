import React, { useEffect, useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import socket from './socket';
import KurdistanMap from './components/KurdistanMap';
import SearchPanel from './components/SearchPanel';
import SellerPanel from './components/SellerPanel';
import SellerDetail from './components/SellerDetail';
import AuthModal from './components/AuthModal';
import Navbar from './components/Navbar';

const AppContent = () => {
  const { user, role, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [onlineSellers, setOnlineSellers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [locating, setLocating] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showManualLocation, setShowManualLocation] = useState(false);

  // Connect socket & listen for online sellers
  useEffect(() => {
    socket.connect();
    socket.emit('sellers:getAll');

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('sellers:update', (sellers) => {
      setOnlineSellers(sellers);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('sellers:update');
      socket.disconnect();
    };
  }, []);

  // Get user location
  const getUserLocation = useCallback(() => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setShowManualLocation(true);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    getUserLocation();
  }, []);

  // Seller goes online
  const handleGoOnline = useCallback(() => {
    if (!user || role !== 'seller') return;
    if (!userLocation) {
      alert('تکایە پێشتر ئیجازەی شوێن بدە');
      getUserLocation();
      return;
    }
    const token = localStorage.getItem('token');
    socket.emit('seller:online', {
      sellerId: user._id,
      token,
      location: { lat: userLocation[0], lng: userLocation[1], address: '' }
    });
    setIsOnline(true);

    // Keep updating location every 30 seconds
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        socket.emit('seller:updateLocation', { sellerId: user._id, location: loc });
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      });
    }, 30000);

    socket._locationInterval = interval;
  }, [user, role, userLocation, getUserLocation]);

  // Seller goes offline
  const handleGoOffline = useCallback(() => {
    if (socket._locationInterval) {
      clearInterval(socket._locationInterval);
    }
    socket.disconnect();
    socket.connect();
    socket.emit('sellers:getAll');
    setIsOnline(false);
  }, []);

  // Display sellers: search results override online sellers
  const displaySellers = searchResults !== null
    ? searchResults.map(s => ({
        ...s,
        distanceText: s.distanceText,
        travelTimeText: s.travelTimeText
      }))
    : onlineSellers;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <Navbar
        user={user}
        role={role}
        onlineSellersCount={onlineSellers.length}
        onAuthClick={() => setShowAuth(true)}
        onLogout={() => { handleGoOffline(); logout(); }}
      />

      {/* Main */}
      <div className="map-container">
        <div className="map-wrapper">
          <KurdistanMap
            sellers={displaySellers}
            userLocation={userLocation}
            selectedSeller={selectedSeller}
            onSelectSeller={setSelectedSeller}
          />
        </div>

        {/* Connection warning */}
        {!socketConnected && (
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            background: '#fef3c7', color: '#92400e', padding: '8px 18px',
            borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '1px solid #fde68a'
          }}>
            ⚠️ پەیوەندی بە سێرڤەرەوە نییە...
          </div>
        )}

        {/* Sidebar */}
        {showSidebar && (
          <div className="sidebar">
            <div className="sidebar-handle" />
            {/* Seller Panel */}
            {user && role === 'seller' && (
              <SellerPanel
                isOnline={isOnline}
                onGoOnline={handleGoOnline}
                onGoOffline={handleGoOffline}
              />
            )}

            {/* Search (traveler or not logged in) */}
            {(!user || role === 'traveler') && (
              <SearchPanel
                userLocation={userLocation}
                onResults={(results) => {
                  setSearchResults(results);
                  if (results.length > 0) setSelectedSeller(null);
                }}
                onSelectSeller={setSelectedSeller}
              />
            )}

            {/* Seller Detail */}
            {selectedSeller && (
              <SellerDetail
                seller={selectedSeller}
                userLocation={userLocation}
                onClose={() => setSelectedSeller(null)}
              />
            )}
          </div>
        )}

        {/* FAB buttons */}
        <div className="fab">
          <button
            className="fab-btn primary"
            onClick={() => setShowSidebar(!showSidebar)}
            title={showSidebar ? 'شاردنەوەی پانێل' : 'پیشاندانی پانێل'}
          >
            {showSidebar ? '◀' : '▶'}
          </button>
          <button
            className="fab-btn secondary"
            onClick={getUserLocation}
            title="شوێنم بدۆزەرەوە"
            disabled={locating}
          >
            {locating ? '⏳' : '📍'}
          </button>
        </div>

        {/* Info bar at bottom */}
        {!user && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(45,106,79,0.95)', color: 'white',
            padding: '10px 20px', textAlign: 'center',
            fontSize: 14, zIndex: 998, backdropFilter: 'blur(4px)'
          }}>
            🌿 بۆ فرۆشیارەکان: تۆمار بکە و کالاکانت بنووسە تا گەشتیارەکان ببینن |
            🚗 بۆ گەشتیارەکان: بگەڕێ بۆ کالایەک بدۆزیتەوە
            <button
              className="nav-btn active"
              style={{ marginRight: 12, padding: '5px 14px', fontSize: 13 }}
              onClick={() => setShowAuth(true)}
            >
              دەستپێبکە
            </button>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Manual Location Modal */}
      {showManualLocation && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowManualLocation(false)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <button className="modal-close" onClick={() => setShowManualLocation(false)}>✕</button>
            <h3>📍 شوێنی دەستی دیاری بکە</h3>
            <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 16 }}>
              GPS کار نەکرد. ناو و دەرەوەی شاری خۆت بنووسە:
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { name: 'هەولێر (مەرکەز)', lat: 36.1901, lng: 44.0091 },
                { name: 'سلێمانی', lat: 35.5574, lng: 45.4348 },
                { name: 'دهۆک', lat: 36.8669, lng: 42.9903 },
                { name: 'کەرکوک', lat: 35.4681, lng: 44.3922 },
                { name: 'زاخۆ', lat: 37.1445, lng: 42.6833 },
                { name: 'ڕانیە', lat: 36.2647, lng: 44.8878 },
              ].map(city => (
                <button
                  key={city.name}
                  className="btn"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '10px 16px', textAlign: 'right', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}
                  onClick={() => {
                    setUserLocation([city.lat, city.lng]);
                    setShowManualLocation(false);
                  }}
                >
                  🏙️ {city.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
