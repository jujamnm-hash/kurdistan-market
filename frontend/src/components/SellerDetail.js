import React, { useState } from 'react';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const SellerDetail = ({ seller, userLocation, onClose }) => {
  const { role, user, updateUser } = useAuth();
  const [ratingVal, setRatingVal] = useState(0);
  const [ratingMsg, setRatingMsg] = useState('');
  const isSaved = user?.savedSellers?.includes(seller._id);
  const [saved, setSaved] = useState(isSaved);

  const handleRate = async () => {
    if (ratingVal < 1 || ratingVal > 5) return;
    try {
      await API.post(`/sellers/${seller._id}/rate`, { rating: ratingVal });
      setRatingMsg('سپاس بۆ هەڵسەنگاندنەکەت! ✅');
    } catch (err) {
      setRatingMsg(err.response?.data?.error || 'هەڵەیەک ڕوویدا');
    }
  };

  const handleSave = async () => {
    if (!user || role !== 'traveler') return;
    try {
      if (saved) {
        const res = await API.delete(`/travelers/save-seller/${seller._id}`);
        updateUser(res.data.traveler);
        setSaved(false);
      } else {
        const res = await API.post(`/travelers/save-seller/${seller._id}`);
        updateUser(res.data.traveler);
        setSaved(true);
      }
    } catch { /* ignore */ }
  };

  const openDirections = () => {
    if (seller.location?.lat && seller.location?.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${seller.location.lat},${seller.location.lng}`;
      window.open(url, '_blank');
    }
  };

  const renderStars = (avg) => Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < Math.round(avg) ? '#f59e0b' : '#d1d5db', fontSize: 18 }}>★</span>
  ));

  return (
    <div className="detail-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3>{seller.name}</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {role === 'traveler' && (
            <button
              onClick={handleSave}
              title={saved ? 'لابردن لە پاشەکەوتکراوەکان' : 'پاشەکەوتکردن'}
              style={{ background: saved ? '#fef2f2' : 'var(--bg)', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 18 }}
            >
              {saved ? '❤️' : '🤍'}
            </button>
          )}
          <button onClick={onClose} style={{ background: 'var(--bg)', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>✕</button>
        </div>
      </div>

      <span className={`status-badge ${seller.isOnline ? 'online' : 'offline'}`} style={{ marginBottom: 12, display: 'inline-flex' }}>
        <span className={`status-dot ${seller.isOnline ? 'online' : 'offline'}`}></span>
        {seller.isOnline ? '🟢 ئێستا لەخەتە' : '⚫ ئێستا لەخەت نیت'}
      </span>

      {seller.rating?.average > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
          <div className="stars">{renderStars(seller.rating.average)}</div>
          <span style={{ color: 'var(--text-light)', fontSize: 13 }}>{seller.rating.average} ({seller.rating.count} هەڵسەنگاندن)</span>
        </div>
      )}

      {seller.description && (
        <p style={{ color: 'var(--text-light)', fontSize: 14, margin: '8px 0' }}>{seller.description}</p>
      )}

      {(seller.distanceText || seller.travelTimeText) && (
        <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 14px', margin: '12px 0', display: 'flex', gap: 16 }}>
          {seller.distanceText && (
            <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>📏 {seller.distanceText}</span>
          )}
          {seller.travelTimeText && (
            <span style={{ color: 'var(--primary-dark)', fontWeight: 700, fontSize: 14 }}>⏱ {seller.travelTimeText}</span>
          )}
        </div>
      )}

      {seller.location?.road && (
        <p style={{ fontSize: 14, marginBottom: 8 }}>📍 {seller.location.road}</p>
      )}

      {/* Products */}
      {seller.products?.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🧺 کالاکان</div>
          <div className="products-list">
            {seller.products.map((p, i) => (
              <div key={i} className="product-item">
                <div className="product-item-info">
                  <span className="product-item-name">{p.name}</span>
                  <span className="product-item-price">{p.price?.toLocaleString()} د.ع / {p.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact + Directions */}
      <div style={{ display: 'grid', gridTemplateColumns: seller.location?.lat ? '1fr 1fr' : '1fr', gap: 10, marginTop: 16 }}>
        <a
          href={`tel:${seller.phone}`}
          className="btn btn-primary btn-full"
          style={{ textDecoration: 'none', textAlign: 'center', background: '#059669' }}
        >
          📞 پەیوەندی
        </a>
        {seller.location?.lat && (
          <button className="btn btn-primary btn-full" onClick={openDirections}>
            🗺 ئاڕاستە
          </button>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <a
          href={`https://wa.me/${seller.phone?.replace(/^0/, '964')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#25D366', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}
        >
          💬 واتساپ
        </a>
      </div>

      {/* Rating */}
      {role === 'traveler' && (
        <div style={{ marginTop: 16, background: 'var(--bg)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>⭐ هەڵسەنگاندن بکە</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setRatingVal(n)}
                style={{
                  background: n <= ratingVal ? '#f59e0b' : 'white',
                  border: '2px solid #f59e0b',
                  color: n <= ratingVal ? 'white' : '#f59e0b',
                  width: 36, height: 36,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >★</button>
            ))}
          </div>
          {ratingMsg
            ? <div className="alert alert-success">{ratingMsg}</div>
            : <button className="btn btn-secondary btn-full" onClick={handleRate} disabled={ratingVal === 0}>
                ناردنی هەڵسەنگاندن
              </button>
          }
        </div>
      )}
    </div>
  );
};

export default SellerDetail;
