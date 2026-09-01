# Koch Lojistik Android APK

`kochlojistik.com` adresini tam ekran açan WebView uygulaması.

---

## APK Build Etme — GitHub Actions (Android Studio gerekmez)

### 1. GitHub hesabı aç
https://github.com adresine git, ücretsiz hesap oluştur.

### 2. Yeni repository oluştur
- Sağ üstte **+** → **New repository**
- Name: `kochlojistik-android`
- Public veya Private (ikisi de çalışır)
- **Create repository**

### 3. Bu klasörü yükle
Repository sayfasında **"uploading an existing file"** linkine tıkla.
Bu klasörün içindeki TÜM dosyaları sürükle bırak (alt klasörler dahil).
**Commit changes** butonuna bas.

### 4. APK otomatik build olur
- **Actions** sekmesine git
- "Build APK" workflow'u çalışıyor olacak (~3-5 dakika)
- Bittikten sonra tıkla → sayfanın altında **Artifacts** bölümü
- **kochlojistik-debug** → indir → ZIP içinde `app-debug.apk`

### Sonraki seferlerde
Dosya değişikliği push edince otomatik build olur.
Ya da Actions sekmesinde **"Run workflow"** butonuyla manuel tetikle.

---

## Uygulama Özellikleri

- Tam ekran WebView → kochlojistik.com
- Geri tuşu: sitede geri gider, ana sayfada uygulamadan çıkar
- JavaScript + DOM Storage aktif
- Android 5.0+ (API 21) uyumlu
- Action bar yok

## İkon Değiştirme

`app/src/main/res/mipmap-*/ic_launcher.png` dosyalarını kendi logonuzla değiştirin.
Boyutlar: mdpi=48px, hdpi=72px, xhdpi=96px, xxhdpi=144px, xxxhdpi=192px
