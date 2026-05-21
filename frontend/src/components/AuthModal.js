import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';

// Use phone number as Firebase Auth email (phone@kurdistan.app)
const toEmail = (phone) => `${phone.replace(/\s/g, '')}@kurdistan.app`;

const AuthModal = ({ onClose }) => {
  const { login } = useAuth();
  const [tab, setTab] = useState('login');
  const [role, setRole] = useState('traveler');
  const [form, setForm] = useState({ name: '', phone: '', password: '', description: '', road: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const email = toEmail(form.phone);

      if (tab === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, form.password);
        const uid = cred.user.uid;
        const collection = role === 'seller' ? 'sellers' : 'travelers';
        const data = role === 'seller'
          ? { name: form.name, phone: form.phone, description: form.description || '', location: { road: form.road || '', lat: null, lng: null }, isOnline: false, products: [], rating: { avg: 0, count: 0, ratedBy: [] } }
          : { name: form.name, phone: form.phone, savedSellers: [] };
        await setDoc(doc(db, collection, uid), data);
        login({ _id: uid, ...data }, role);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, form.password);
        const uid = cred.user.uid;
        const collection = role === 'seller' ? 'sellers' : 'travelers';
        const snap = await getDoc(doc(db, collection, uid));
        if (!snap.exists()) {
          await auth.signOut();
          throw new Error(role === 'seller' ? 'ئەم ژمارەیە بەعنوانی فرۆشیار تۆمار نەکراوە' : 'ئەم ژمارەیە بەعنوانی گەشتیار تۆمار نەکراوە');
        }
        login({ _id: uid, ...snap.data() }, role);
      }
      onClose();
    } catch (err) {
      const code = err.code;
      if (code === 'auth/email-already-in-use') setError('ئەم ژمارەیە پێشتر تۆمارکراوە');
      else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') setError('ژمارە یان وشەی نهێنی هەڵەیە');
      else if (code === 'auth/user-not-found') setError('ئەم ژمارەیە تۆمار نەکراوە');
      else if (code === 'auth/weak-password') setError('وشەی نهێنی پێویستە لانیکەم ٦ پیت بێت');
      else setError(err.message || 'هەڵەیەک ڕوویدا، دووبارە هەوڵ بدەرەوە');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>🌿 بازاڕی رێگاکان</h2>
        <p className="modal-subtitle">بۆ دەستپێکردن پێویستە بچیتە ژوورەوە</p>

        {/* Role Select */}
        <div className="role-select">
          <div className={`role-card ${role === 'traveler' ? 'active' : ''}`} onClick={() => setRole('traveler')}>
            <div className="emoji">🚗</div>
            <h4>گەشتیار</h4>
            <p>بەدوای کالا دەگەڕیم</p>
          </div>
          <div className={`role-card ${role === 'seller' ? 'active' : ''}`} onClick={() => setRole('seller')}>
            <div className="emoji">🛒</div>
            <h4>فرۆشیار</h4>
            <p>لە رێگاکان کالا دەفرۆشم</p>
          </div>
        </div>

        {/* Login / Register Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>
            چوونەژوورەوە
          </button>
          <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
            تۆمارکردن
          </button>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">ناوی تەواو</label>
              <input
                className="form-input"
                placeholder="ناوت بنووسە"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">ژمارەی تەلەفۆن</label>
            <input
              className="form-input"
              placeholder="07xxxxxxxxx"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              required
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label className="form-label">وشەی نهێنی</label>
            <input
              className="form-input"
              type="password"
              placeholder="لانیکەم ٦ پیت"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {tab === 'register' && role === 'seller' && (
            <>
              <div className="form-group">
                <label className="form-label">ناوی جادە / شوێن (ئارەزوومەندانە)</label>
                <input
                  className="form-input"
                  placeholder="بۆ نمونە: جادەی سلێمانی-کەرکوک، نزیک پردی..."
                  value={form.road || ''}
                  onChange={e => setForm({ ...form, road: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">وەسفی کالاکانت (ئارەزوومەندانە)</label>
                <textarea
                  className="form-input"
                  placeholder="بۆ نمونە: مەوە و سەوزەی تازە دەفرۆشم..."
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </>
          )}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? '⏳ چاوەڕێ بکە...' : tab === 'login' ? '🚀 چوونەژوورەوە' : '✅ تۆمارکردن'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;

