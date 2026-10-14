# Teknik Gelecek Notları

**Son güncelleme:** 2026-07-24
**Bağlam:** Simplify My Paper optimizasyon oturumu sonrası notları

---

## Hemen Yapılması Gerekenler (1-2 hafta)

### OG Image PNG Dönüşümü
- ~~`public/og-image.svg` → 1200x630 PNG çevir~~ ✅ Manuel olarak tamamlandı
- Sosyal paylaşım önizlemeleri (Twitter, LinkedIn, Facebook) için kritik

### `!important` Specificity Testi
- Kaldırılan 3 `!important`'ın (compareProCell, chatToggleButton, splitLayout.chatOpen) specificity sorunu yaratıp yaratmadığını test et
- Farklı tarayıcılarda (Chrome, Firefox, Safari, Edge) kontrol et
- Gerekirse `:where()` veya higher-specificity selector ile çöz

### Dark Mode Flash (Flicker)
- İlk yüklemede light→dark geçiş flash'ı olabilir
- `next/dynamic` ile `<Head>` içinde inline script ekle: `document.documentElement.classList.toggle('darkMode', savedDark)`
- Veya `_document.js`'de `getInitialProps` ile localStorage'dan oku

### `notlar.txt` Sil
- İçeriği bu dosyaya taşındı, `notlar.txt`'yi sil

---

## Kısa Vadeli (1-3 ay)

### Mimari Bölünme (C Aşaması)
- `Home` bileşeni ~1460 satır, çok büyük
- Alt bileşenlere böl:
  - `Header` — marka, dil toggle, dark mode toggle
  - `Hero` — başlık, CTA, istatistikler
  - `EditorPanel` — ayarlar, textarea, PDF upload
  - `ResultPanel` — sonuç, karşılaştırma, meaning check
  - `HistoryList` — geçmiş kayıtları
  - `ChatPanel` — zaten ayrı dosyada ✅
  - `PricingSection` — pro bölümü
  - `Footer` — bağlantılar
- Her bileşen kendi CSS module'ünü kullansın

### State Reducer'a Geçir
- 35 `useState` → `useReducer` ile 3 reducer:
  - `simplifyReducer`: text, result, error, loading, latency, summary, meaning
  - `chatReducer`: messages, streaming, streamText, quota
  - `settingsReducer`: model, persona, terms, reduction, proEmail, darkMode
- State güncellemeleri minimal re-render sağlar

### OG Image Dinamik
- Farklı diller için farklı OG image'ları (tr/en)
- `pages/api/og.js` ile dinamik oluştur (vercel/og kullanarak)
- Veya statik PNG'leri `public/og-{lang}.png` olarak sakla

### Lighthouse 100 Hedefi
- Mevcut skorları ölç (lhci ile)
- Hedef: Performance 90+, Accessibility 95+, Best Practices 95+, SEO 100
- Kritik iyileştirmeler:
  - Largest Contentful Paint (LCP) < 2.5s
  - First Input Delay (FID) < 100ms
  - Cumulative Layout Shift (CLS) < 0.1

### Bundle Analiz
- `@next/bundle-analyzer` ekle
- Hangi kütüphaneler en fazla yer kaplıyor analiz et
- Beklenen sonuçlar:
  - `pdfjs-dist`: ~2-4MB (zaten dynamic import ✅)
  - `jspdf`: ~500KB-1MB (zaten dynamic import ✅)
  - `pg`: sadece server-side
  - `react` + `react-dom`: ~120KB (normal)

### Proactive Error Handling
- `window.error` ve `unhandledrejection` handler'ları zaten var ✅
- Eksik: API route'larda `try-catch` chain'leri iyileştir
- Eksik: Gemini API timeout'ları (30s) ekle

---

## Orta Vadeli (3-6 ay)

### Service Worker + PWA
- Offline destek: son 5 simplification sonucunu cache'le
- Cache stratejisi: stale-while-revalidate
- `next-pwa` veya `serwist` kullan
- Service worker registration: `_app.js`'de

### E2E Testler
- Playwright ile kritik user flow'ları test et:
  1. Ana sayfa yükleme
  2. Text yapıştır → Simplify
  3. Persona değiştirme
  4. PDF yükleme
  5. Chat açılma + mesaj gönderme
  6. Pro checkout akışı
  7. Dil değiştirme
- CI/CD'e ekle (GitHub Actions)

### Monitoring
- Sentry free tier: hata takibi
- Vercel Analytics: page view, web vitals
- Custom metrics: simplify completion rate, chat usage
- Uptime monitoring: Betterstack veya UptimeRobot

### A/B Testing Altyapısı
- `feature.js` (basit bir flag sistemi) veya `flagsmith` free tier
- Test edilecekler:
  - CTA metni: "Simplify Now" vs "Make It Simple"
  - Fiyatlandırma: $9/mo vs $12/mo vs $15/mo
  - Hero layout: centered vs split
  - Free limit: 3 vs 5 vs 7

### Database Optimization
- `subscriptions` tablosuna `created_at` indeksi
- `usage_limits` tablosuna monthly partition
- Connection pooling: `pgbouncer` veya Vercel Postgres pooling
- Read replica (eğer traffic artarsa)

### API Rate Limiting İyileştirmesi
- Mevcut: DB-backed UPSERT (güzel ✅)
- Eksik: IP-based rate limit (VPN/proxy bypass için)
- Eksik: `pro-status` endpoint'ine rate limit
- Önerü: `rate-limiter-flexible` kütüphanesi

---

## Uzun Vadeli (6+ ay)

### Micro-Frontend / Page Splitting
- Eğer traffic 10K+ MAU'ya ulaşırsa düşün
- Shallow routing ile sayfalar arası geçiş
- Lazy loading ile bundle parçalama

### Edge Functions
- Rate limiting'i Vercel Edge'e taşı (düşük latency)
- A/B testing flag'lerini edge'de değerlendir
- Geo-based dil otomatik algılama

### Multi-Language API Hataları
- API hata mesajlarını da i18n yap
- `lib/locales/api-errors.js` oluştur
- Client-side'da error code → localized message mapping

### Webhook Retry Mechanism
- LemonSqueezy webhook'ları için retry + dead letter queue
- 3 başarısız deneme sonrası email notification
- Webhook log tablosu (audit trail)

### Database Migrations
- `db-migrate` veya `knex` migration sistemi ekle
- Schema değişikliklerini versiyonla
- Rollback mekanizması

### Performance Budget
- Bundle boyut limiti: < 200KB (gzipped, first load)
- LCP budget: < 2s
- FID budget: < 50ms
- CI'de otomatik kontrol (bundlesize + lighthouse-ci)
