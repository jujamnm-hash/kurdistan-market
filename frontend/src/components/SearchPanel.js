import React, { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const calcDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const PRODUCT_CATEGORIES = [
  { label: 'هەموو', value: '' },
  { label: '🍎 مەوە', value: 'مەوە' },
  { label: '🥦 سەوزە', value: 'سەوزە' },
  { label: '🌾 گەنم', value: 'گەنم' },
  { label: '🐄 شیر', value: 'شیر' },
  { label: '🍯 هەنگوین', value: 'هەنگوین' },
  { label: '🥚 هێلکە', value: 'هێلکە' },
  { label: '🧀 پەنیر', value: 'پەنیر' },
];

const SearchPanel = ({ userLocation, onResults, onSelectSeller }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (searchQuery) => {
    const q = searchQuery !== undefined ? searchQuery : query;
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const snapshot = await getDocs(collection(db, 'sellers'));
      const allSellers = snapshot.docs.map(d => ({ _id: d.id, ...d.data() }));

      const searchLower = q.trim().toLowerCase();
      const matching = allSellers.filter(s =>
        s.products?.some(p => p.name.toLowerCase().includes(searchLower))
      );

      const lat = userLocation ? userLocation[0] : 36.1901;
      const lng = userLocation ? userLocation[1] : 44.0091;

      const withDistance = matching.map(s => {
        if (s.location?.lat && s.location?.lng) {
          const dist = calcDistance(lat, lng, s.location.lat, s.location.lng);
          return {
            ...s,
            distanceText: dist < 1 ? `${Math.round(dist * 1000)} مەتر` : `${dist.toFixed(1)} کم`,
            travelTimeText: `${Math.round(dist / 60 * 60)} خولەک`
          };
        }
        return s;
      });

      withDistance.sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return 0;
      });

      setResults(withDistance);
      onResults(withDistance);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
  };

  const renderStars = (avg) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < Math.round(avg) ? '#f59e0b' : '#d1d5db' }}>★</span>
    ));
  };

  return (
    <div>
      <div className="search-box">
        <h3>🔍 بەدوای کالا بگەڕێ</h3>

        {/* Quick categories */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {PRODUCT_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => { setQuery(cat.value); handleSearch(cat.value); }}
              style={{
                padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontFamily: 'inherit',
                background: query === cat.value ? 'var(--primary)' : 'var(--bg)',
                color: query === cat.value ? 'white' : 'var(--text)',
                fontWeight: query === cat.value ? 700 : 400,
                transition: 'all 0.2s'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="search-input-wrap">
            <input
              className="form-input"
              placeholder="بۆ نمونە: سێو، گەنم، بزن..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" style={{ padding: '10px 16px' }} disabled={loading}>
              {loading ? '⏳' : '🔍'}
            </button>
          </div>
        </form>
        {!userLocation && (
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 8 }}>
            ⚠️ تکایە ئیجازەی شوێن بدە بۆ نتیجەی وردتر
          </div>
        )}
      </div>

      {searched && results.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 32 }}>🔭</div>
          <p style={{ color: 'var(--text-light)', marginTop: 8, fontSize: 14 }}>
            هیچ فرۆشیارێک نەدۆزرایەوە بۆ «{query}»
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-light)', padding: '4px 0 8px', display: 'flex', gap: 12 }}>
          <span>🟢 {results.filter(s => s.isOnline).length} ئەکتیف</span>
          <span>⚫ {results.filter(s => !s.isOnline).length} نائەکتیف</span>
        </div>
      )}

      {results.map(seller => (
        <div
          key={seller._id}
          className={`seller-card ${seller.isOnline ? 'online' : 'offline'}`}
          onClick={() => onSelectSeller(seller)}
        >
          <div className="seller-card-header">
            <div className="seller-avatar">
              {seller.name?.[0] || '👤'}
            </div>
            <div className="seller-info" style={{ flex: 1 }}>
              <h4>{seller.name}</h4>
              {seller.location?.road && <p>📍 {seller.location.road}</p>}
            </div>
            <span className={`status-badge ${seller.isOnline ? 'online' : 'offline'}`}>
              <span className={`status-dot ${seller.isOnline ? 'online' : 'offline'}`}></span>
              {seller.isOnline ? 'لەخەت' : 'لەخەت نیت'}
            </span>
          </div>

          {seller.rating?.average > 0 && (
            <div className="stars">{renderStars(seller.rating.average)} <span style={{ fontSize: 12, color: 'var(--text-light)', marginRight: 4 }}>({seller.rating.count})</span></div>
          )}

          {seller.distanceText && (
            <div className="distance-info">
              <span>📏 {seller.distanceText}</span>
              <span>⏱ {seller.travelTimeText}</span>
            </div>
          )}

          {seller.matchedProducts?.length > 0 && (
            <div className="products-preview">
              {seller.matchedProducts.map((p, i) => (
                <span key={i} className="product-tag">
                  {p.name} — {p.price?.toLocaleString()} د.ع/{p.unit}
                </span>
              ))}
            </div>
          )}

          {/* Contact buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }} onClick={e => e.stopPropagation()}>
            <a
              href={`tel:${seller.phone}`}
              style={{
                flex: 1, background: '#059669', color: 'white', textDecoration: 'none',
                padding: '8px 0', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 700
              }}
            >
              📞 پەیوەندی
            </a>
            <a
              href={`https://wa.me/${seller.phone?.replace(/^0/, '964')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, background: '#25D366', color: 'white', textDecoration: 'none',
                padding: '8px 0', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 700
              }}
            >
              💬 واتساپ
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchPanel;
