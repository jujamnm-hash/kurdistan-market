import React from 'react';

const Navbar = ({ user, role, onlineSellersCount, onAuthClick, onLogout }) => (
  <nav className="navbar">
    <div className="navbar-brand">
      <span className="emoji">🌿</span>
      بازاڕی رێگاکان
    </div>
    <div className="navbar-links">
      <span style={{ fontSize: 13, opacity: 0.8, marginLeft: 8 }}>
        🟢 {onlineSellersCount} فرۆشیاری ئەکتیف
      </span>
      {user ? (
        <>
          <span style={{ fontSize: 14, opacity: 0.9 }}>
            {role === 'seller' ? '🛒' : '🚗'} {user.name}
          </span>
          <button className="nav-btn" onClick={onLogout}>چوونەدەرەوە</button>
        </>
      ) : (
        <button className="nav-btn active" onClick={onAuthClick}>
          🚀 چوونەژوورەوە
        </button>
      )}
    </div>
  </nav>
);

export default Navbar;
