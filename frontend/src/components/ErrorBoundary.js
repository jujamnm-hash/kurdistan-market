import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', padding: 20,
          background: '#fef2f2', color: '#ef4444', textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ marginBottom: 8 }}>هەڵەیەک ڕووی دا</h2>
          <p style={{ color: '#6b7280', marginBottom: 20 }}>
            تکایە پەڕەکە نوێ بکەرەوە
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#ef4444', color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: 10, cursor: 'pointer',
              fontSize: 15, fontFamily: 'inherit'
            }}
          >
            🔄 نوێکردنەوە
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
