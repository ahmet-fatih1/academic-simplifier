# Optimizasyon Planı — Academic Simplifier

**Son güncelleme:** 2026-07-24
**Toplam Tespit:** 101 sorun (7 Critical, 30 High, 44 Medium, 20 Low) — TÜMÜ ÇÖZÜLDÜ
**Ek:** İlk 1000 müşteri için özellik planı eklendi

---

## Aşama 1: Kritik Güvenlik — ✅ TAMAMLANDI

| # | Sorun | Dosya | Durum |
|---|-------|-------|-------|
| 1 | API key header'a geç | `api/simplify.js` | ✅ |
| 2 | test-models.js sil | `api/test-models.js` | ✅ |
| 3 | `?pro=1` bypass kaldır | `pages/index.js` | ✅ |
| 4 | Hata detayı sızıntısı düzelt | `api/simplify.js`, `api/chat.js` | ✅ |
| 5 | ensureSchema cache | `lib/db.js` | ✅ |
| 6 | Rate limit eşitle | `pages/index.js` + `api/simplify.js` | ✅ |
| 7 | DB pool hata yönetimi | `lib/db.js` | ✅ |

## Aşama 2: Performans — ✅ TAMAMLANDI

| # | Sorun | Durum |
|---|-------|-------|
| 8 | jsPDF dynamic import | ✅ |
| 9 | ChatPanel duplicate kaldır | ✅ |
| 10 | scrollIntoView throttle | ✅ |
| 11 | Chat AbortController | ✅ |
| 12 | Stale closure fix | ✅ |
| 13 | Shared API helpers | ✅ |
| 14 | Dark mode duplicate kaldır | ✅ |
| 15 | proSection dark mode fix | ✅ |
| 16 | MAX_CONTEXT_CHARS eşitle | ✅ |
| 17 | LanguageContext memo | ✅ |
| 18 | localStorage debounce | ✅ |
| 19 | protectedTerms reuse | ✅ |

## Aşama 3: Kalite + Erişilebilirlik — ✅ TAMAMLANDI

| # | Sorun | Durum |
|---|-------|-------|
| 20 | prefers-reduced-motion | ✅ |
| 21 | Transition specificity | ✅ |
| 22 | Redundant CSS kaldır | ✅ |
| 23 | !important kaldır | ✅ |
| 24 | Focus ring fix | ✅ |
| 25 | PDF worker self-host | ✅ |
| 26 | OG image PNG | ✅ (manuel) |
| 27 | Privacy/Terms sayfaları | ✅ |
| 28 | html lang attribute | ✅ |
| 29 | Turbopack enable | ✅ |
| 30 | Security headers | ✅ |
| 31 | API error language | ✅ |
| 32 | Body size limit | ✅ |
| 33 | Pro-status POST-only | ✅ |

## Aşama 4: İyileştirme — ✅ TAMAMLANDI

| # | Sorun | Durum |
|---|-------|-------|
| 34 | Unused boilerplate dosyaları | ✅ |
| 35 | Committed build artifact'ları | ✅ (zaten temiz) |
| 36 | Inline arrow functions | ✅ |
| 37 | handleClear reducer | ⏭️ Gereksiz karmaşıklık, atlandı |
| 38 | hasResult wrapper | ✅ (zaten temiz) |
| 39 | Hardcoded checkout URL | ✅ |
| 40 | SVG logo aria-label | ✅ |
| 41 | Chat panel aria-live | ✅ |
| 42 | .env.example | ✅ |
| 43 | Prettier | ✅ |
| 44 | 404.js useRouter | ✅ |
| 45 | Chat drawer shadow | ✅ |
| 46 | Font fallback | ✅ |

---

## Risk Analizi — ✅ Tüm Riskler Mitige Edildi

| Değişiklik | Risk | Durum | Alınan Önlem |
|------------|------|-------|-------------|
| `?pro=1` kaldır | Orta | ✅ | URL parametresini silindi, pro status DB'den email ile kontrol ediliyor |
| Rate limit düzelt | Orta | ✅ | Sunucu + istemci eşit (5/10), 429 hatasında sayaç senkronize ediliyor, chat quota günlük resetleniyor |
| Dark mode duplicate | Orta | ✅ | Sadece `.darkMode` CSS class kullanılıyor, `@media` query yok |
| Security headers | Düşük | ✅ | CSP, X-Frame-Options, X-Content-Type-Options aktif |
| ChatPanel refactor | Orta | ✅ | CSS tabanlı toggle (`splitLayout.chatOpen`), mobil/masaüstü test edildi |
| ensureSchema cache | Düşük | ✅ | `schemaReady` bayrak ile sadece bir kez çalıştırılıyor |
        
---

## Aşama 5: SEO — 🔄 DEVAM EDİYOR

**Bağlam (2026-10-14):** Search Console'da 582 gösterim / 2 tıklama. Gösterimler "simplify paragraph / text / sentences" sorgularından geliyor, trafiğin çoğu İngilizce konuşulan ülkelerden.

| # | Görev | Durum |
|---|-------|-------|
| 47 | Marka adını "Simplify Academic" olarak birleştir | ✅ |
| 48 | Ana sayfa title/description yenile, meta keywords kaldır | ✅ |
| 49 | Ana sayfa bileşenini `components/SimplifierPage.js`'e taşı (`seo` prop) | ✅ |
| 50 | Landing sayfaları: `/paragraph-simplifier`, `/simplify-research-paper`, `/abstract-simplifier`, `/sentence-simplifier` (`lib/seo-pages.js`) | ✅ |
| 51 | FAQPage JSON-LD + footer'da iç linkler | ✅ |
| 52 | Sitemap'ten noindex sayfaları çıkar | ✅ |
| 53 | `href="CHECKOUT_URL"` hatası — Pro butonları 404'e gidiyordu | ✅ |
| 54 | Deploy sonrası Search Console'a sitemap gönder, yeni URL'leri dizine ekleme iste | ⬜ |
| 55 | "Trusted by 12,000+ researchers" ifadesini gerçek veriyle değiştir veya kaldır | ⬜ |
| 56 | Footer/privacy'deki `ahmet@example.com` yer tutucusunu gerçek adresle değiştir | ⬜ |
| 57 | 4–6 hafta sonra Search Console'da sayfa bazlı sonuçları ölç | ⬜ |
| 58 | Kendi alan adı (opsiyonel, ~10–12 $/yıl .com) | ⬜ |
