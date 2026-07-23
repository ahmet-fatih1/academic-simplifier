# Feature: PDF Upload

PDF dosyalarını yükleyip doğrudan simplify etme özelliği.

## Güvenlik Analizi

| Risk | Seviye | Çözüm |
|------|--------|-------|
| Dosya boyutu | Yüksek | Max 10MB client-side, sunucuda max 50K karakter |
| Zararlı PDF | Orta | pdfjs-dist sandboxlı worker kullanır |
| Metin çıkaramama | Düşük | Kullanıcıya hata mesajı |
| Token limiti | Yüksek | Max 50K karakter限制 |
| Depolama sızıntısı | Yok | Client-side parsing |

## Gün 1: Altyapı ve Kütüphane Kurulumu

- [x] pdfjs-dist kur
- [x] lib/pdf-parser.js oluştur
- [x] pages/index.js'e PDF state'leri ekle
- [x] PDF worker URL yapılandırması

## Gün 2: UI Bileşenleri

- [x] Textarea'nın üstüne "Upload PDF" sürükle-bırak alanı
- [x] `<input type="file" accept=".pdf">` gizli input
- [x] PDF yükleme butonu
- [x] Yükleme durumunda spinner/loading state
- [x] PDF dosya adı gösterimi (kaldır butonuyla)
- [x] styles/Home.module.css'e PDF stilleri

## Gün 3: PDF Parsing Mantığı

- [x] handlePdfUpload(file) fonksiyonu
- [x] Dosya boyutu kontrolü (max 10MB)
- [x] Dosya tipi kontrolü (sadece .pdf)
- [x] PDF'den text çıkarma
- [x] Boş PDF / image-only PDF kontrolü
- [x] Hata yönetimi
- [x] Max karakter limiti kontrolü (50K)

## Gün 4: Entegrasyon ve İyileştirme

- [x] PDF yüklendiğinde textarea'ya otomatik doldur
- [x] Sürükle-bırak ile textarea'ya bırakma
- [x] PDF + text yapıştırma birlikte çalışsın
- [x] Temizle butonu PDF state'ini de sıfırlasın
- [ ] History'ye PDF dosya adını kaydet

## Gün 5: Test, Güvenlik, Dokümantasyon

- [ ] Farklı PDF boyutlarını test et
- [ ] Bozuk PDF testi
- [ ] Image-only PDF testi
- [ ] Max boyut aşıldığında uyarı testi
- [ ] Vercel deploy testi
- [ ] TASKS.md güncelle
