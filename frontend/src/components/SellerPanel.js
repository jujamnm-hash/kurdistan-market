import React, { useState, useEffect } from 'react';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const SellerPanel = ({ onGoOnline, onGoOffline, isOnline }) => {
  const { user, updateUser } = useAuth();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [product, setProduct] = useState({ name: '', price: '', unit: 'کیلۆ' });
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    description: user?.description || '',
    road: user?.location?.road || ''
  });

  // Sync form when user updates
  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      description: user?.description || '',
      road: user?.location?.road || ''
    });
  }, [user]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/sellers/products', {
        name: product.name,
        price: parseFloat(product.price),
        unit: product.unit
      });
      updateUser(res.data.seller);
      setProduct({ name: '', price: '', unit: 'کیلۆ' });
      setShowAddProduct(false);
      setMsg('✅ کالا زیاد کرا');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'هەڵەیەک ڕوویدا'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.put('/sellers/profile', {
        name: profileForm.name,
        description: profileForm.description,
        location: { ...user?.location, road: profileForm.road }
      });
      updateUser(res.data.seller);
      setShowEditProfile(false);
      setMsg('✅ پروفایل نوێ کرایەوە');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'هەڵەیەک ڕوویدا'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = async (productId) => {
    try {
      const res = await API.delete(`/sellers/products/${productId}`);
      updateUser(res.data.seller);
    } catch (err) {
      setMsg('❌ هەڵەیەک ڕوویدا');
    }
  };

  return (
    <div className="profile-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="seller-avatar" style={{ width: 44, height: 44, fontSize: 18 }}>
            {user?.name?.[0] || '👤'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{user?.phone}</div>
            {user?.location?.road && (
              <div style={{ fontSize: 12, color: 'var(--primary)' }}>📍 {user.location.road}</div>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowEditProfile(!showEditProfile)}
          style={{ background: 'var(--bg)', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
        >
          ✏️
        </button>
      </div>

      {/* Edit Profile */}
      {showEditProfile && (
        <form onSubmit={handleUpdateProfile} style={{ background: 'var(--bg)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>✏️ دەستکاری پروفایل</div>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <input className="form-input" placeholder="ناو" value={profileForm.name}
              onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <input className="form-input" placeholder="ناوی جادە / شوێن" value={profileForm.road}
              onChange={e => setProfileForm({ ...profileForm, road: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <textarea className="form-input" placeholder="وەسف" rows={2} value={profileForm.description}
              onChange={e => setProfileForm({ ...profileForm, description: e.target.value })} />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? '⏳...' : '💾 پاشەکەوتکردن'}
          </button>
        </form>
      )}

      {/* Online Toggle */}
      <div className="online-toggle">
        <span>{isOnline ? '🟢 ئێستا لەخەتی' : '⚫ لەخەت نیت'}</span>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={isOnline}
            onChange={isOnline ? onGoOffline : onGoOnline}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {isOnline && (
        <div className="alert alert-success" style={{ fontSize: 13 }}>
          ✅ ئێستا لەسەر نەخشە دیارەکانی گەشتیارەکان
        </div>
      )}

      {msg && (
        <div className={`alert ${msg.includes('❌') ? 'alert-error' : 'alert-success'}`}>
          {msg}
        </div>
      )}

      {/* Products */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>🧺 کالاکانم ({user?.products?.length || 0})</span>
          <button
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: 13 }}
            onClick={() => setShowAddProduct(!showAddProduct)}
          >
            + زیادکردن
          </button>
        </div>

        {showAddProduct && (
          <form onSubmit={handleAddProduct} style={{ background: 'var(--bg)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <input
                className="form-input"
                placeholder="ناوی کالا"
                value={product.name}
                onChange={e => setProduct({ ...product, name: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <input
                className="form-input"
                placeholder="نرخ (دینار)"
                type="number"
                value={product.price}
                onChange={e => setProduct({ ...product, price: e.target.value })}
                required
              />
              <select
                className="form-input"
                value={product.unit}
                onChange={e => setProduct({ ...product, unit: e.target.value })}
              >
                <option>کیلۆ</option>
                <option>دانە</option>
                <option>بستە</option>
                <option>لیتر</option>
                <option>جووتە</option>
                <option>سندوق</option>
              </select>
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? '⏳...' : '✅ زیادکردن'}
            </button>
          </form>
        )}

        <div className="products-list">
          {(!user?.products || user.products.length === 0) && (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: 13, padding: 16 }}>
              هێشتا هیچ کالایەکت زیاد نەکردووە
            </div>
          )}
          {user?.products?.map(p => (
            <div key={p._id} className="product-item">
              <div className="product-item-info">
                <span className="product-item-name">{p.name}</span>
                <span className="product-item-price">{p.price?.toLocaleString()} د.ع / {p.unit}</span>
              </div>
              <button
                onClick={() => handleRemoveProduct(p._id)}
                style={{ background: '#fef2f2', color: 'var(--danger)', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SellerPanel;
