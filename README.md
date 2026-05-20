# بازاڕی رێگاکانی کوردستان 🌿
## Kurdistan Roadside Market System

سیستەمێکی پرۆفیشنال بۆ فرۆشیارانی کالا لە رێگاکانی کوردستان و گەشتیارەکان.

---

## تایبەتمەندیەکان

### بۆ فرۆشیارەکان 🛒
- تۆمارکردن و چوونەژوورەوە
- زیادکردنی کالاکان (ناو + نرخ + یەکە)
- تۆگڵی لەخەت/لەخەت نیت بە یەک کلیک
- بە ئۆتۆماتیکی هەر ٣٠ چرکەیەک شوێنەکە نوێ دەکرێتەوە
- تەنها ئەوانەی لەخەتن لەسەر نەخشە دیارن

### بۆ گەشتیارەکان 🚗
- گەڕان بۆ کالا بە ناو
- دیاربوونی فرۆشیارەکان لەسەر نەخشەی کوردستان
- دووری بە مەتر/کیلۆمەتر و کاتی گەیشتن
- نووسینی ئارەزوو بۆ فرۆشیار (١ تا ٥ ئەستێرە)
- کلیک لەسەر نەخشە بۆ Google Maps ناوبەری

---

## دامەزراندن

### پێشمەرج
- Node.js v18+
- MongoDB
- npm

### ١. دامەزراندنی backend

```bash
cd backend
npm install
```

`.env` دروست بکە:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/kurdistan_market
JWT_SECRET=هەر_نهێنیەکی_پتر_لە_٢٠_پیت
JWT_EXPIRE=7d
```

```bash
npm run dev
```

### ٢. دامەزراندنی frontend

```bash
cd frontend
npm install
npm start
```

ئێستا بڕۆ بۆ: http://localhost:3000

---

## ئەرشیتێکچەر

```
backend/
├── server.js          # سێرڤەری سەرەکی + Socket.io
├── models/
│   ├── Seller.js      # مۆدێلی فرۆشیار
│   └── Traveler.js    # مۆدێلی گەشتیار
├── routes/
│   ├── auth.js        # چوونەژوورەوە / تۆمارکردن
│   ├── sellers.js     # API فرۆشیارەکان + nearby
│   ├── travelers.js   # API گەشتیارەکان
│   └── products.js    # گەڕان بۆ کالا
└── middleware/
    └── auth.js        # پشکنینی JWT

frontend/src/
├── App.js             # کۆمپۆنێنتی سەرەکی
├── api.js             # Axios instance
├── socket.js          # Socket.io client
├── context/
│   └── AuthContext.js # دۆخی بەکارهێنەر
└── components/
    ├── KurdistanMap.js  # نەخشەی Leaflet
    ├── SearchPanel.js   # پانێلی گەڕان
    ├── SellerPanel.js   # پانێلی فرۆشیار
    ├── SellerDetail.js  # وردەکاری فرۆشیار
    └── AuthModal.js     # مۆدالی چوونەژوورەوە
```

---

## API Endpoints

| Method | Endpoint | وەسف |
|--------|----------|------|
| POST | /api/auth/seller/register | تۆمارکردنی فرۆشیار |
| POST | /api/auth/seller/login | چوونەژوورەوەی فرۆشیار |
| POST | /api/auth/traveler/register | تۆمارکردنی گەشتیار |
| POST | /api/auth/traveler/login | چوونەژوورەوەی گەشتیار |
| GET | /api/sellers/online | فرۆشیارانی ئەکتیف |
| GET | /api/sellers/nearby?lat=&lng=&product= | نزیکترین فرۆشیار |
| POST | /api/sellers/products | زیادکردنی کالا |
| POST | /api/sellers/:id/rate | هەڵسەنگاندن |

## Socket Events

| Event | ئاڕاستە | وەسف |
|-------|---------|------|
| seller:online | Client→Server | فرۆشیار دێتە ئەکتیف |
| seller:updateLocation | Client→Server | نوێکردنەوەی شوێن |
| sellers:getAll | Client→Server | داواکردنی هەموو فرۆشیارەکان |
| sellers:update | Server→All | نوێکردنەوەی لیستی فرۆشیارەکان |
