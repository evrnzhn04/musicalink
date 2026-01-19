# 📘 MUSICALINK - KAPSAMLI GELİŞTİRME YOL HARİTASI

**Proje Adı:** MusicaLink  
**Proje Türü:** Gerçek Zamanlı Sosyal Müzik Uygulaması  
**Platform:** Android (React Native CLI)  
**Backend:** Supabase (PostgreSQL + Realtime + Auth)  
**Harici API:** Spotify Web API (OAuth 2.0 PKCE)  
**Tarih:** 10 Ocak 2026  
**Versiyon:** 1.0

---

## 🎯 VİZYON VE HEDEF

MusicaLink, kullanıcıların Spotify hesaplarıyla giriş yaparak anlık dinledikleri müzikleri paylaşabildikleri, benzer müzik zevkine sahip insanlarla eşleşebildikleri ve gerçek zamanlı sohbet edebildikleri bir sosyal platform olacaktır.

### Temel Özellikler:
1. **Spotify OAuth Entegrasyonu** - Güvenli PKCE akışı ile kullanıcı girişi
2. **Gerçek Zamanlı Mesajlaşma** - Supabase Realtime ile anlık sohbet
3. **Müzik Durumu Paylaşımı** - Anlık dinlenen şarkının profilde görünmesi
4. **Arkadaşlık Sistemi** - İstek gönderme, kabul etme, reddetme
5. **Müzik Eşleştirme** - Benzer zevklere sahip kullanıcıları bulma

---

# 📑 BÖLÜM I: TEKNOLOJİ STACK'İ DETAYLI AÇIKLAMASI

## 1.1 React Native CLI Nedir ve Neden Tercih Ediyoruz?

React Native, Facebook tarafından geliştirilen ve JavaScript/TypeScript kullanarak native mobil uygulamalar oluşturmamızı sağlayan bir framework'tür.

**Expo yerine CLI tercih etmemizin nedenleri:**
- **Native Modül Erişimi:** Spotify SDK gibi native kütüphanelere doğrudan erişim
- **Tam Kontrol:** Android Manifest ve iOS Info.plist üzerinde tam kontrol
- **Deep Linking:** Custom URL scheme'ler için gerekli native konfigürasyonlar
- **Performans:** Gereksiz Expo katmanı olmadan daha iyi performans

**New Architecture (Fabric + TurboModules):**
React Native 0.76+ sürümlerinde varsayılan olarak aktif gelen yeni mimari, JavaScript ve Native kod arasındaki köprüyü yeniden tasarlar:
- **Fabric:** Yeni render sistemi, daha akıcı UI güncellemeleri
- **TurboModules:** Native modüllerin lazy loading ile yüklenmesi
- **JSI (JavaScript Interface):** Bridge yerine doğrudan memory erişimi

## 1.2 Supabase Nedir ve Nasıl Çalışır?

Supabase, Firebase'e açık kaynak alternatif olarak konumlandırılan bir Backend-as-a-Service (BaaS) platformudur.

**Supabase'in Bileşenleri:**

### PostgreSQL Veritabanı
- İlişkisel veritabanı yapısı
- Foreign Key ilişkileri ile veri bütünlüğü
- Güçlü sorgu yetenekleri (JOIN, subquery, vs.)

### Supabase Auth
- Email/Password, OAuth, Magic Link desteği
- JWT token tabanlı kimlik doğrulama
- Row Level Security (RLS) ile entegre

### Supabase Realtime
- WebSocket tabanlı gerçek zamanlı iletişim
- PostgreSQL tablolarındaki değişiklikleri anında dinleme
- Presence (çevrimiçi durumu) takibi

### Supabase Storage
- Dosya yükleme ve saklama
- CDN ile hızlı erişim
- RLS ile güvenli dosya erişimi

## 1.3 Spotify Web API Yapısı

Spotify, geliştiricilere kapsamlı bir RESTful API sunar.

**API Kategorileri:**

| Kategori | Endpoint Örnekleri | Kullanım Alanı |
|----------|-------------------|----------------|
| User Profile | `/v1/me` | Kullanıcı bilgileri |
| Player | `/v1/me/player` | Çalan şarkı bilgisi |
| Tracks | `/v1/tracks/{id}` | Şarkı detayları |
| Search | `/v1/search` | İçerik arama |
| Playlists | `/v1/playlists` | Playlist yönetimi |

**Rate Limiting:**
- Spotify API'de rate limit vardır
- Aşırı istek yapılırsa 429 hatası alınır
- Polling yaparken minimum 30 saniye aralık kullanılmalı

---

# 📑 BÖLÜM II: GELİŞTİRME ORTAMI KURULUMU

## 2.1 Windows İçin Gerekli Yazılımlar

### Node.js Kurulumu
```
Adım 1: nodejs.org adresine git
Adım 2: LTS (Long Term Support) sürümünü indir (20.x önerilir)
Adım 3: Kurulum sihirbazını çalıştır
Adım 4: "Automatically install necessary tools" seçeneğini işaretle
Adım 5: Kurulum tamamlandıktan sonra PowerShell'i aç
Adım 6: "node --version" yazarak kurulumu doğrula
```

### JDK 17 Kurulumu (Azul Zulu)
```
Adım 1: azul.com/downloads adresine git
Adım 2: Java Version: 17 (LTS) seç
Adım 3: Operating System: Windows seç
Adım 4: Architecture: x86 64-bit seç
Adım 5: Package Type: .msi seç ve indir
Adım 6: Kurulum sihirbazını "Set JAVA_HOME" seçeneği ile çalıştır
```

### Android Studio Kurulumu
```
Adım 1: developer.android.com/studio adresinden indir
Adım 2: Kurulum sihirbazını standart seçeneklerle tamamla
Adım 3: İlk açılışta SDK bileşenlerinin inmesini bekle
Adım 4: More Actions > SDK Manager > SDK Platforms
       - Android 14.0 (API 34) işaretle
Adım 5: SDK Tools sekmesi:
       - Android SDK Build-Tools 34
       - Android SDK Command-line Tools
       - Android Emulator
       - Android SDK Platform-Tools
Adım 6: Apply ve OK ile kurulumları tamamla
```

### Ortam Değişkenleri (Environment Variables)
```
Windows Arama > "Ortam değişkenleri" > "Sistem ortam değişkenlerini düzenle"

Kullanıcı değişkenleri bölümünde YENİ:
  Değişken adı: ANDROID_HOME
  Değişken değeri: C:\Users\[KULLANICI]\AppData\Local\Android\Sdk

Sistem değişkenleri > Path > Düzenle > Yeni:
  C:\Users\[KULLANICI]\AppData\Local\Android\Sdk\platform-tools
  C:\Users\[KULLANICI]\AppData\Local\Android\Sdk\emulator
```

## 2.2 Kurulum Doğrulama

PowerShell'de aşağıdaki komutları çalıştırarak kurulumları doğrula:

```powershell
node --version          # v20.x.x görmelisin
npm --version           # 10.x.x görmelisin
java --version          # openjdk 17.x.x görmelisin
adb --version           # Android Debug Bridge version görmelisin
```

---

# 📑 BÖLÜM III: SUPABASE BACKEND KURULUMU

## 3.1 Proje Oluşturma (Dashboard)

```
Adım 1: supabase.com adresine git
Adım 2: "Start your project" ile kayıt ol (GitHub hesabı önerilir)
Adım 3: Dashboard'da "New Project" butonuna tıkla
Adım 4: Organization seç veya yeni oluştur
Adım 5: Proje bilgilerini doldur:
        - Name: MusicaLink
        - Database Password: [GÜVENLİ ŞİFRE - MUTLAKA KAYDET]
        - Region: Frankfurt (eu-central-1) - Türkiye'ye en yakın
Adım 6: "Create new project" ile oluştur
Adım 7: 2-3 dakika bekle, proje başlatılıyor
```

## 3.2 API Anahtarlarını Alma

```
Project Settings (sol menüde dişli ikonu) > API

Burada iki önemli değer var:
1. Project URL: https://[PROJECT_ID].supabase.co
2. anon (public) key: eyJhbGc... (uzun bir JWT token)

BU DEĞERLERİ GÜVENLİ BİR YERE KAYDET!
Client Secret'ı asla mobil uygulamada kullanma!
```

## 3.3 Veritabanı Tabloları Oluşturma

### profiles Tablosu (Kullanıcı Profilleri)

Sol menüden Table Editor > New Table

```
Tablo Adı: profiles

Sütunlar:
┌─────────────────┬───────────┬─────────────┬─────────────────────────────┐
│ Sütun Adı       │ Veri Tipi │ Nullable    │ Açıklama                    │
├─────────────────┼───────────┼─────────────┼─────────────────────────────┤
│ id              │ uuid      │ NOT NULL    │ Primary Key, auth.users FK  │
│ username        │ text      │ NULL        │ Görünen kullanıcı adı       │
│ display_name    │ text      │ NULL        │ Spotify'dan gelen isim      │
│ avatar_url      │ text      │ NULL        │ Profil fotoğrafı URL        │
│ spotify_id      │ text      │ NOT NULL    │ Spotify kullanıcı ID        │
│ email           │ text      │ NULL        │ Email adresi                │
│ bio             │ text      │ NULL        │ Kullanıcı biyografisi       │
│ current_track   │ jsonb     │ NULL        │ Anlık dinlenen şarkı        │
│ is_online       │ boolean   │ DEFAULT F   │ Çevrimiçi durumu            │
│ last_seen       │ timestamp │ NULL        │ Son görülme zamanı          │
│ created_at      │ timestamp │ DEFAULT NOW │ Hesap oluşturma tarihi      │
│ updated_at      │ timestamp │ DEFAULT NOW │ Son güncelleme tarihi       │
└─────────────────┴───────────┴─────────────┴─────────────────────────────┘

Önemli Ayarlar:
- id sütunu için Foreign Key: auth.users(id) referansı
- spotify_id için UNIQUE constraint ekle
- updated_at için otomatik güncelleme trigger'ı eklenecek
```

### friendships Tablosu (Arkadaşlık İlişkileri)

```
Tablo Adı: friendships

Sütunlar:
┌─────────────────┬───────────┬─────────────┬─────────────────────────────┐
│ Sütun Adı       │ Veri Tipi │ Nullable    │ Açıklama                    │
├─────────────────┼───────────┼─────────────┼─────────────────────────────┤
│ id              │ int8      │ NOT NULL    │ Primary Key (auto-increment)│
│ requester_id    │ uuid      │ NOT NULL    │ İsteği gönderen (FK)        │
│ receiver_id     │ uuid      │ NOT NULL    │ İsteği alan (FK)            │
│ status          │ text      │ DEFAULT     │ pending/accepted/rejected   │
│ created_at      │ timestamp │ DEFAULT NOW │ İstek tarihi                │
│ updated_at      │ timestamp │ DEFAULT NOW │ Yanıt tarihi                │
└─────────────────┴───────────┴─────────────┴─────────────────────────────┘

Foreign Keys:
- requester_id -> profiles(id) ON DELETE CASCADE
- receiver_id -> profiles(id) ON DELETE CASCADE

UNIQUE constraint: (requester_id, receiver_id) çifti benzersiz olmalı
```

### messages Tablosu (Sohbet Mesajları)

```
Tablo Adı: messages

Sütunlar:
┌─────────────────┬───────────┬─────────────┬─────────────────────────────┐
│ Sütun Adı       │ Veri Tipi │ Nullable    │ Açıklama                    │
├─────────────────┼───────────┼─────────────┼─────────────────────────────┤
│ id              │ int8      │ NOT NULL    │ Primary Key (auto-increment)│
│ conversation_id │ text      │ NOT NULL    │ Sohbet odası kimliği        │
│ sender_id       │ uuid      │ NOT NULL    │ Gönderen (FK -> profiles)   │
│ receiver_id     │ uuid      │ NOT NULL    │ Alıcı (FK -> profiles)      │
│ content         │ text      │ NOT NULL    │ Mesaj içeriği               │
│ message_type    │ text      │ DEFAULT txt │ text/image/track            │
│ track_data      │ jsonb     │ NULL        │ Paylaşılan şarkı bilgisi    │
│ is_read         │ boolean   │ DEFAULT F   │ Okundu durumu               │
│ read_at         │ timestamp │ NULL        │ Okunma zamanı               │
│ created_at      │ timestamp │ DEFAULT NOW │ Gönderilme zamanı           │
└─────────────────┴───────────┴─────────────┴─────────────────────────────┘

conversation_id Mantığı:
- İki kullanıcı arasındaki tüm mesajlar aynı conversation_id'ye sahip
- Oluşturma: sorted([user1_id, user2_id]).join('_')
- Bu sayede A->B ve B->A aynı sohbette görünür
```

## 3.4 Row Level Security (RLS) Politikaları

RLS, veritabanı seviyesinde güvenlik sağlar. Her kullanıcı sadece yetkili olduğu verilere erişebilir.

Sol menü > Authentication > Policies

### profiles Tablosu Politikaları

```sql
-- Herkes profilleri okuyabilir (arkadaş arama için)
CREATE POLICY "Profiles are viewable by everyone" ON profiles
FOR SELECT USING (true);

-- Kullanıcılar sadece kendi profillerini güncelleyebilir
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Yeni profil sadece kendi için oluşturulabilir
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);
```

### friendships Tablosu Politikaları

```sql
-- Kullanıcılar kendileriyle ilgili arkadaşlıkları görebilir
CREATE POLICY "Users can view own friendships" ON friendships
FOR SELECT USING (
  auth.uid() = requester_id OR auth.uid() = receiver_id
);

-- Arkadaşlık isteği gönderme
CREATE POLICY "Users can send friend requests" ON friendships
FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Sadece alıcı isteği güncelleyebilir (kabul/red)
CREATE POLICY "Receiver can update friendship" ON friendships
FOR UPDATE USING (auth.uid() = receiver_id);
```

### messages Tablosu Politikaları

```sql
-- Kullanıcılar sadece kendi mesajlarını görebilir
CREATE POLICY "Users can view own messages" ON messages
FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Mesaj gönderme - sadece kendi adına
CREATE POLICY "Users can send messages" ON messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Mesaj güncelleme - alıcı sadece is_read güncelleyebilir
CREATE POLICY "Receiver can mark as read" ON messages
FOR UPDATE USING (auth.uid() = receiver_id);
```

## 3.5 Realtime Konfigürasyonu

```
Database > Replication > supabase_realtime

Aşağıdaki tabloları Realtime için aktif et:
✓ messages (INSERT, UPDATE, DELETE)
✓ friendships (INSERT, UPDATE)
✓ profiles (UPDATE) - current_track güncellemeleri için
```

---

# 📑 BÖLÜM IV: SPOTIFY DEVELOPER KURULUMU

## 4.1 Uygulama Oluşturma

```
Adım 1: developer.spotify.com adresine git
Adım 2: Dashboard'a giriş yap (Spotify hesabınla)
Adım 3: "Create App" butonuna tıkla
Adım 4: Bilgileri doldur:
        - App name: MusicaLink
        - App description: Social music sharing app
        - Website: (boş bırakılabilir)
        - Redirect URIs: musicalink://spotify-callback
        
Adım 5: API seçenekleri:
        ✓ Web API
        ✓ Android SDK (gelecekte gerekebilir)
        
Adım 6: Terms of Service'i kabul et
Adım 7: Save ile kaydet
```

## 4.2 Client ID ve Ayarlar

```
Settings sayfasında:

Client ID: [KOPYALA VE KAYDET]
(Client Secret KULLANMA - PKCE akışı için gerekli değil)

Redirect URIs bölümünde aynen şunu ekle:
musicalink://spotify-callback

DIKKAT: 
- HTTP veya HTTPS kullanMA
- Büyük/küçük harf duyarlıdır
- Sondaki slash (/) önemlidir, ekleme
```

## 4.3 Gerekli OAuth Scopes

Spotify OAuth'da scope'lar, uygulamanın hangi verilere erişebileceğini belirler.

```
FAZ 1 (Temel) için gerekli scope'lar:
- user-read-private: Kullanıcı profil bilgileri
- user-read-email: Email adresi

FAZ 2 (Müzik) için ek scope'lar:
- user-read-currently-playing: Anlık çalan şarkı
- user-read-playback-state: Player durumu (pause, shuffle, vs.)
- user-read-recently-played: Son dinlenen şarkılar
- user-top-read: En çok dinlenen artist/track
- user-library-read: Beğenilen şarkılar
```
NASIL İLERLENECEĞİYLE İLGİLİ KURALLAR:
1) İlk olarak bana teorik bir şekilde görevimizin amacını ve ne yapacağımızı söyleyeceksin.
2) Sen profesyonelce ve tip güvenliğine dikkat edecek şekilde bana bunun kodunu nasıl yazağımı göstereceksin ama çok dikkat et bu kısım sadece örnek bir gösterim olacak, benim yazmam gereken kod olmayacak. Her detayı gösterip sonra bana görev olarak vereceksin ben kendim kodlayacağım.
3) Yazacağımız kod uzun olacaksa adım adım sırayla ilerleyeceğiz, birinci adımı anlatıp benden onay bekleyeceksin ve sonra devam edeceğiz.
4) Kontrol et dediğimde kontrol edeceksin ve eksikleri, hataları, olumlu yönleri söyleyeceksin.
5) Dosya ve proje bütünlüğünü asla bozmayacaksın.
---

# 📑 BÖLÜM V: REACT NATIVE PROJE KURULUMU

## 5.1 Projeyi Başlatma

```powershell
# Proje klasörüne git
cd C:\RN\MusicaLink

# React Native CLI ile proje oluştur
npx @react-native-community/cli@latest init Musicalink

# Proje klasörüne gir
cd Musicalink

# Git repository başlat
git init
git add .
git commit -m "Initial React Native CLI project"
```

## 5.2 Proje Yapısı Oluşturma

```
Musicalink/
├── android/                 # Android native kodları
├── ios/                     # iOS native kodları (opsiyonel)
├── src/                     # Tüm uygulama kodları
│   ├── api/                 # API çağrıları
│   │   ├── spotify.ts       # Spotify API fonksiyonları
│   │   └── supabase.ts      # Supabase client ve yardımcılar
│   ├── components/          # Yeniden kullanılabilir bileşenler
│   │   ├── common/          # Button, Input, Card, vs.
│   │   ├── chat/            # MessageBubble, ChatInput, vs.
│   │   ├── music/           # TrackCard, MiniPlayer, vs.
│   │   └── profile/         # Avatar, ProfileCard, vs.
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx  # Kimlik doğrulama state
│   │   ├── ChatContext.tsx  # Sohbet state
│   │   └── MusicContext.tsx # Müzik state
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Auth işlemleri
│   │   ├── useRealtime.ts   # Supabase realtime
│   │   └── useSpotify.ts    # Spotify API çağrıları
│   ├── navigation/          # React Navigation yapısı
│   │   ├── AppNavigator.tsx # Ana navigator
│   │   ├── AuthStack.tsx    # Login/Register stack
│   │   └── MainTabs.tsx     # Ana tab navigator
│   ├── screens/             # Ekran bileşenleri
│   │   ├── auth/            # Login, Register
│   │   ├── chat/            # ChatList, ChatRoom
│   │   ├── friends/         # FriendsList, AddFriend
│   │   ├── profile/         # MyProfile, EditProfile
│   │   └── settings/        # Settings, About
│   ├── services/            # İş mantığı servisleri
│   │   ├── authService.ts   # Auth işlemleri
│   │   ├── chatService.ts   # Mesajlaşma işlemleri
│   │   └── friendService.ts # Arkadaşlık işlemleri
│   ├── styles/              # Global stiller
│   │   ├── colors.ts        # Renk paleti
│   │   ├── typography.ts    # Font stilleri
│   │   └── spacing.ts       # Boşluk değerleri
│   ├── types/               # TypeScript tipleri
│   │   ├── auth.types.ts
│   │   ├── chat.types.ts
│   │   └── spotify.types.ts
│   ├── utils/               # Yardımcı fonksiyonlar
│   │   ├── storage.ts       # Encrypted storage
│   │   ├── helpers.ts       # Genel yardımcılar
│   │   └── constants.ts     # Sabit değerler
│   └── App.tsx              # Ana uygulama bileşeni
├── .env                     # Ortam değişkenleri
├── .env.example             # Örnek env dosyası
├── index.js                 # Uygulama giriş noktası
└── package.json
```

## 5.3 Temel Paketlerin Kurulumu

```powershell
# Navigasyon paketleri
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# Supabase client
npm install @supabase/supabase-js

# URL Polyfill (Supabase için gerekli)
npm install react-native-url-polyfill

# Güvenli depolama (tokenlar için)
npm install react-native-encrypted-storage

# Performanslı liste (chat için)
npm install @shopify/flash-list

# Ortam değişkenleri
npm install react-native-dotenv

# İkonlar
npm install react-native-vector-icons

# Gesture ve Reanimated (animasyonlar için)
npm install react-native-gesture-handler react-native-reanimated
```

## 5.4 Android Native Konfigürasyonu

### AndroidManifest.xml (Deep Linking)

Dosya: `android/app/src/main/AndroidManifest.xml`

```xml
<activity
  android:name=".MainActivity"
  android:exported="true"
  android:launchMode="singleTask">
  
  <!-- Mevcut intent-filter'a dokunma -->
  
  <!-- Spotify Deep Link için YENİ intent-filter -->
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="musicalink" />
  </intent-filter>
</activity>
```

### build.gradle Ayarları

Dosya: `android/app/build.gradle`

```gradle
android {
    defaultConfig {
        // Minimum SDK (Spotify SDK için 21 gerekli)
        minSdkVersion 21
        targetSdkVersion 34
    }
}
```

## 5.5 index.js Polyfill Ayarı

```javascript
// index.js - EN ÜSTE EKLE
import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
```
NASIL İLERLENECEĞİYLE İLGİLİ KURALLAR:
1) İlk olarak bana teorik bir şekilde görevimizin amacını ve ne yapacağımızı söyleyeceksin.
2) Sen profesyonelce ve tip güvenliğine dikkat edecek şekilde bana bunun kodunu nasıl yazağımı göstereceksin ama çok dikkat et bu kısım sadece örnek bir gösterim olacak, benim yazmam gereken kod olmayacak. Her detayı gösterip sonra bana görev olarak vereceksin ben kendim kodlayacağım.
3) Yazacağımız kod uzun olacaksa adım adım sırayla ilerleyeceğiz, birinci adımı anlatıp benden onay bekleyeceksin ve sonra devam edeceğiz.
4) Kontrol et dediğimde kontrol edeceksin ve eksikleri, hataları, olumlu yönleri söyleyeceksin.
5) Dosya ve proje bütünlüğünü asla bozmayacaksın.
---

# 📑 BÖLÜM VI: SPOTIFY OAUTH 2.0 PKCE AKIŞI

## 6.1 PKCE Nedir ve Neden Kullanıyoruz?

PKCE (Proof Key for Code Exchange), mobil uygulamalar için tasarlanmış güvenli bir OAuth 2.0 akışıdır.

**Geleneksel OAuth Sorunu:**
- Client Secret'ı mobil uygulamada saklamak güvensizdir
- APK decompile edilebilir ve secret çalınabilir

**PKCE Çözümü:**
1. Her login için rastgele bir "code_verifier" oluştur
2. Bu verifier'ın SHA-256 hash'ini al = "code_challenge"
3. Challenge'ı Spotify'a gönder
4. Kullanıcı onayladıktan sonra gelen code'u verifier ile değiştir
5. Spotify, verifier'ı hash'leyerek challenge ile karşılaştırır

## 6.2 Auth Akışı Detaylı Adımları

```
┌─────────────────────────────────────────────────────────────────┐
│                     SPOTIFY PKCE AUTH AKIŞI                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. UYGULAMA                                                     │
│     └─> code_verifier (128 karakter rastgele string) oluştur    │
│     └─> code_challenge = SHA256(code_verifier) base64url encode │
│     └─> verifier'ı güvenli bellekte sakla                       │
│                                                                  │
│  2. SPOTIFY LOGIN URL OLUŞTUR                                    │
│     https://accounts.spotify.com/authorize?                      │
│       client_id=[CLIENT_ID]                                      │
│       &response_type=code                                        │
│       &redirect_uri=musicalink://spotify-callback                │
│       &scope=user-read-private user-read-email                   │
│       &code_challenge=[CHALLENGE]                                │
│       &code_challenge_method=S256                                │
│                                                                  │
│  3. KULLANICI SPOTIFY'A YÖNLENDİRİLİR                           │
│     └─> Spotify login sayfası açılır                            │
│     └─> Kullanıcı izinleri onaylar                              │
│     └─> Spotify, musicalink://spotify-callback?code=XXX döner   │
│                                                                  │
│  4. DEEP LINK YAKALANIR                                          │
│     └─> Uygulama tekrar açılır                                  │
│     └─> URL'den authorization code parse edilir                 │
│                                                                  │
│  5. TOKEN TAKASI (POST İSTEĞİ)                                   │
│     POST https://accounts.spotify.com/api/token                  │
│     Body: {                                                      │
│       grant_type: "authorization_code",                          │
│       code: [AUTH_CODE],                                         │
│       redirect_uri: "musicalink://spotify-callback",             │
│       client_id: [CLIENT_ID],                                    │
│       code_verifier: [VERİFİER]                                  │
│     }                                                            │
│                                                                  │
│  6. TOKEN ALINDI                                                 │
│     └─> access_token (1 saat geçerli)                           │
│     └─> refresh_token (süresiz, yenileme için)                  │
│     └─> EncryptedStorage'a kaydet                               │
│                                                                  │
│  7. SUPABASE İLE SENKRONIZE ET                                   │
│     └─> Spotify /me endpoint'inden kullanıcı bilgisi al         │
│     └─> profiles tablosuna upsert yap                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 6.3 Token Yenileme (Refresh) Mekanizması

Access token 1 saat sonra expire olur. Kullanıcıyı tekrar login'e yönlendirmemek için:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN REFRESH AKIŞI                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. API İSTEĞİ YAPMADAN ÖNCE                                     │
│     └─> Token'ın expire süresini kontrol et                     │
│     └─> 5 dakikadan az kaldıysa refresh yap                     │
│                                                                  │
│  2. REFRESH İSTEĞİ                                               │
│     POST https://accounts.spotify.com/api/token                  │
│     Body: {                                                      │
│       grant_type: "refresh_token",                               │
│       refresh_token: [REFRESH_TOKEN],                            │
│       client_id: [CLIENT_ID]                                     │
│     }                                                            │
│                                                                  │
│  3. YENİ TOKENLAR                                                │
│     └─> Yeni access_token alınır                                │
│     └─> Bazen yeni refresh_token da gelir                       │
│     └─> EncryptedStorage güncellenir                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
NASIL İLERLENECEĞİYLE İLGİLİ KURALLAR:
1) İlk olarak bana teorik bir şekilde görevimizin amacını ve ne yapacağımızı söyleyeceksin.
2) Sen profesyonelce ve tip güvenliğine dikkat edecek şekilde bana bunun kodunu nasıl yazağımı göstereceksin ama çok dikkat et bu kısım sadece örnek bir gösterim olacak, benim yazmam gereken kod olmayacak. Her detayı gösterip sonra bana görev olarak vereceksin ben kendim kodlayacağım.
3) Yazacağımız kod uzun olacaksa adım adım sırayla ilerleyeceğiz, birinci adımı anlatıp benden onay bekleyeceksin ve sonra devam edeceğiz.
4) Kontrol et dediğimde kontrol edeceksin ve eksikleri, hataları, olumlu yönleri söyleyeceksin.
5) Dosya ve proje bütünlüğünü asla bozmayacaksın.
---

# 📑 BÖLÜM VII: GERÇEK ZAMANLI SOHBET SİSTEMİ

## 7.1 Supabase Realtime Nasıl Çalışır?

Supabase Realtime, PostgreSQL'in NOTIFY/LISTEN mekanizmasını WebSocket üzerinden istemcilere iletir.

```
┌─────────────────────────────────────────────────────────────────┐
│                   REALTIME MESAJLAŞMA AKIŞI                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  KULLANICI A                SUPABASE                KULLANICI B  │
│      │                         │                         │       │
│      │  1. INSERT mesaj        │                         │       │
│      │──────────────────────>  │                         │       │
│      │                         │                         │       │
│      │                         │  2. PostgreSQL trigger  │       │
│      │                         │     NOTIFY eventi       │       │
│      │                         │                         │       │
│      │                         │  3. WebSocket broadcast │       │
│      │                         │ ──────────────────────> │       │
│      │                         │                         │       │
│      │                         │         4. Mesaj        │       │
│      │                         │         alındı!         │       │
│      │                         │                         │       │
└─────────────────────────────────────────────────────────────────┘
```

## 7.2 Channel Yapısı ve Filtreleme

```javascript
// Örnek: Chat odasına abone olma

const conversationId = generateConversationId(myUserId, friendUserId);

const channel = supabase
  .channel(`chat:${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',          // Sadece yeni mesajlar
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    },
    (payload) => {
      // payload.new = yeni eklenen mesaj objesi
      addMessageToState(payload.new);
    }
  )
  .subscribe();

// Cleanup (ekran kapanınca)
return () => {
  supabase.removeChannel(channel);
};
```

## 7.3 Conversation ID Oluşturma Mantığı

İki kullanıcı arasındaki sohbetin benzersiz kimliği:

```javascript
function generateConversationId(userId1, userId2) {
  // UUID'leri sırala (alfabetik)
  const sorted = [userId1, userId2].sort();
  // Birleştir
  return `${sorted[0]}_${sorted[1]}`;
}

// Örnek:
// User A: "abc-123"
// User B: "xyz-789"
// Conversation ID: "abc-123_xyz-789"

// Bu sayede:
// - A -> B mesaj gönderince: "abc-123_xyz-789"
// - B -> A mesaj gönderince: "abc-123_xyz-789"
// Aynı conversation_id = aynı sohbet odası
```

## 7.4 Mesaj Gönderme Akışı

```javascript
async function sendMessage(content, receiverId) {
  const myId = await getCurrentUserId();
  const conversationId = generateConversationId(myId, receiverId);
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: myId,
      receiver_id: receiverId,
      content: content,
      message_type: 'text',
      is_read: false
    })
    .select()
    .single();
    
  if (error) {
    console.error('Mesaj gönderilemedi:', error);
    throw error;
  }
  
  return data;
}
```

## 7.5 Okundu Bilgisi (Read Receipts)

```javascript
// Mesajları okundu olarak işaretle
async function markMessagesAsRead(conversationId, senderId) {
  const myId = await getCurrentUserId();
  
  const { error } = await supabase
    .from('messages')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('conversation_id', conversationId)
    .eq('sender_id', senderId)  // Sadece karşı tarafın mesajları
    .eq('receiver_id', myId)    // Bana gelen
    .eq('is_read', false);      // Henüz okunmamış
    
  return error;
}
```
NASIL İLERLENECEĞİYLE İLGİLİ KURALLAR:
1) İlk olarak bana teorik bir şekilde görevimizin amacını ve ne yapacağımızı söyleyeceksin.
2) Sen profesyonelce ve tip güvenliğine dikkat edecek şekilde bana bunun kodunu nasıl yazağımı göstereceksin ama çok dikkat et bu kısım sadece örnek bir gösterim olacak, benim yazmam gereken kod olmayacak. Her detayı gösterip sonra bana görev olarak vereceksin ben kendim kodlayacağım.
3) Yazacağımız kod uzun olacaksa adım adım sırayla ilerleyeceğiz, birinci adımı anlatıp benden onay bekleyeceksin ve sonra devam edeceğiz.
4) Kontrol et dediğimde kontrol edeceksin ve eksikleri, hataları, olumlu yönleri söyleyeceksin.
5) Dosya ve proje bütünlüğünü asla bozmayacaksın.
---

# 📑 BÖLÜM VIII: MÜZİK ENTEGRASYONU (FAZ 2)

## 8.1 Anlık Dinleme Durumu (Currently Playing)

```
┌─────────────────────────────────────────────────────────────────┐
│                  MÜZİK DURUMU SENKRONIZASYONU                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  POLLING MEKANİZMASI (30 saniyede bir)                          │
│                                                                  │
│  1. SPOTIFY API ÇAĞRISI                                          │
│     GET https://api.spotify.com/v1/me/player/currently-playing  │
│     Headers: { Authorization: "Bearer [ACCESS_TOKEN]" }          │
│                                                                  │
│  2. YANIT PARSE                                                  │
│     {                                                            │
│       "is_playing": true,                                        │
│       "item": {                                                  │
│         "id": "spotify_track_id",                                │
│         "name": "Şarkı Adı",                                     │
│         "artists": [{ "name": "Sanatçı" }],                      │
│         "album": {                                               │
│           "images": [{ "url": "album_cover.jpg" }]               │
│         },                                                       │
│         "duration_ms": 210000                                    │
│       },                                                         │
│       "progress_ms": 45000                                       │
│     }                                                            │
│                                                                  │
│  3. SUPABASE'E KAYDET                                            │
│     UPDATE profiles SET current_track = {                        │
│       track_id, name, artist, album_image, is_playing            │
│     } WHERE id = my_user_id                                      │
│                                                                  │
│  4. REALTIME BROADCAST                                           │
│     └─> Arkadaşlar anlık olarak görür                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 8.2 Müzik Eşleştirme Algoritması

Benzer müzik zevkine sahip kullanıcıları bulmak için:

```javascript
/*
EŞLEŞME KRİTERLERİ:
1. Aynı şarkıyı dinleyenler (En yüksek puan)
2. Aynı sanatçıyı dinleyenler
3. Aynı albümü dinleyenler
4. Benzer genre'da şarkı dinleyenler

PUAN SİSTEMİ:
- Aynı şarkı: 100 puan
- Aynı albüm, farklı şarkı: 50 puan
- Aynı sanatçı: 30 puan
*/

async function findMusicMatches() {
  const myTrack = await getCurrentTrack();
  
  // Aynı şarkıyı dinleyenleri bul
  const { data: sameTrackUsers } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, current_track')
    .neq('id', myUserId)
    .filter('current_track->track_id', 'eq', myTrack.track_id)
    .filter('current_track->is_playing', 'eq', true);
    
  // Aynı sanatçıyı dinleyenleri bul
  const { data: sameArtistUsers } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, current_track')
    .neq('id', myUserId)
    .filter('current_track->artist', 'eq', myTrack.artist)
    .filter('current_track->is_playing', 'eq', true);
    
  return {
    exactMatches: sameTrackUsers,
    artistMatches: sameArtistUsers
  };
}
```

## 8.3 Şarkı Paylaşımı (Chat'te)

```javascript
// Sohbette şarkı paylaş
async function shareCurrentTrack(receiverId) {
  const track = await getCurrentTrack();
  const conversationId = generateConversationId(myUserId, receiverId);
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: myUserId,
      receiver_id: receiverId,
      content: `🎵 ${track.name} - ${track.artist}`,
      message_type: 'track',
      track_data: {
        track_id: track.track_id,
        name: track.name,
        artist: track.artist,
        album_image: track.album_image,
        spotify_uri: `spotify:track:${track.track_id}`
      }
    });
    
  return data;
}
```

## 8.4 "Birlikte Dinle" Özelliği

```javascript
import { Linking } from 'react-native';

// Arkadaşın dinlediği şarkıyı aç
async function listenTogether(trackId) {
  const spotifyUri = `spotify:track:${trackId}`;
  
  // Önce Spotify yüklü mü kontrol et
  const canOpen = await Linking.canOpenURL(spotifyUri);
  
  if (canOpen) {
    // Spotify uygulamasında şarkıyı aç
    await Linking.openURL(spotifyUri);
  } else {
    // Spotify yüklü değil, web'de aç
    await Linking.openURL(`https://open.spotify.com/track/${trackId}`);
  }
}
```
NASIL İLERLENECEĞİYLE İLGİLİ KURALLAR:
1) İlk olarak bana teorik bir şekilde görevimizin amacını ve ne yapacağımızı söyleyeceksin.
2) Sen profesyonelce ve tip güvenliğine dikkat edecek şekilde bana bunun kodunu nasıl yazağımı göstereceksin ama çok dikkat et bu kısım sadece örnek bir gösterim olacak, benim yazmam gereken kod olmayacak. Her detayı gösterip sonra bana görev olarak vereceksin ben kendim kodlayacağım.
3) Yazacağımız kod uzun olacaksa adım adım sırayla ilerleyeceğiz, birinci adımı anlatıp benden onay bekleyeceksin ve sonra devam edeceğiz.
4) Kontrol et dediğimde kontrol edeceksin ve eksikleri, hataları, olumlu yönleri söyleyeceksin.
5) Dosya ve proje bütünlüğünü asla bozmayacaksın.
---

# 📑 BÖLÜM IX: ARKADAŞLIK SİSTEMİ

## 9.1 Arkadaşlık Durumları

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARKADAŞLIK DURUM MAKİNESİ                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [A] ──(istek gönder)──> [pending] ──(B kabul)──> [accepted]    │
│                              │                                   │
│                              └──(B reddet)──> [rejected]         │
│                                                                  │
│  Durumlar:                                                       │
│  - pending: İstek beklemede                                      │
│  - accepted: Arkadaşlar                                          │
│  - rejected: Reddedildi                                          │
│  - blocked: Engellendi (gelecek özellik)                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 9.2 Arkadaş Arama

```javascript
async function searchUsers(query) {
  if (query.length < 2) return [];
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, current_track')
    .neq('id', myUserId)  // Kendimi hariç tut
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(20);
    
  // Her sonuç için arkadaşlık durumunu kontrol et
  const resultsWithStatus = await Promise.all(
    data.map(async (user) => {
      const status = await getFriendshipStatus(user.id);
      return { ...user, friendshipStatus: status };
    })
  );
  
  return resultsWithStatus;
}
```

## 9.3 Arkadaşlık İsteği Gönderme

```javascript
async function sendFriendRequest(receiverId) {
  // Mevcut ilişki var mı kontrol et
  const existing = await checkExistingFriendship(receiverId);
  if (existing) {
    throw new Error('Zaten bir ilişki mevcut');
  }
  
  const { data, error } = await supabase
    .from('friendships')
    .insert({
      requester_id: myUserId,
      receiver_id: receiverId,
      status: 'pending'
    })
    .select()
    .single();
    
  if (error) throw error;
  
  // Push notification gönder (opsiyonel)
  await sendNotification(receiverId, 'Yeni arkadaşlık isteği!');
  
  return data;
}
```

## 9.4 Gelen İstekleri Listeleme

```javascript
async function getPendingRequests() {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      created_at,
      requester:profiles!requester_id (
        id,
        username,
        display_name,
        avatar_url,
        current_track
      )
    `)
    .eq('receiver_id', myUserId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
    
  return data;
}
```

## 9.5 İsteği Kabul/Reddetme

```javascript
async function respondToFriendRequest(friendshipId, accept) {
  const newStatus = accept ? 'accepted' : 'rejected';
  
  const { data, error } = await supabase
    .from('friendships')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', friendshipId)
    .eq('receiver_id', myUserId)  // Sadece alıcı güncelleyebilir
    .select()
    .single();
    
  if (accept) {
    // Karşı tarafa bildirim gönder
    await sendNotification(data.requester_id, 'Arkadaşlık isteği kabul edildi!');
  }
  
  return data;
}
```
NASIL İLERLENECEĞİYLE İLGİLİ KURALLAR:
1) İlk olarak bana teorik bir şekilde görevimizin amacını ve ne yapacağımızı söyleyeceksin.
2) Sen profesyonelce ve tip güvenliğine dikkat edecek şekilde bana bunun kodunu nasıl yazağımı göstereceksin ama çok dikkat et bu kısım sadece örnek bir gösterim olacak, benim yazmam gereken kod olmayacak. Her detayı gösterip sonra bana görev olarak vereceksin ben kendim kodlayacağım.
3) Yazacağımız kod uzun olacaksa adım adım sırayla ilerleyeceğiz, birinci adımı anlatıp benden onay bekleyeceksin ve sonra devam edeceğiz.
4) Kontrol et dediğimde kontrol edeceksin ve eksikleri, hataları, olumlu yönleri söyleyeceksin.
5) Dosya ve proje bütünlüğünü asla bozmayacaksın.
---

# 📑 BÖLÜM X: UI/UX TASARIM PRENSİPLERİ

## 10.1 Renk Paleti

```javascript
// src/styles/colors.ts

export const colors = {
  // Ana Renkler (Spotify'dan esinlenilmiş)
  primary: '#1DB954',        // Spotify yeşili
  primaryDark: '#1AA34A',    // Hover/pressed durumu
  secondary: '#191414',      // Spotify siyahı
  
  // Arka Plan Tonları
  background: {
    primary: '#121212',      // Ana arka plan
    secondary: '#181818',    // Kartlar
    tertiary: '#282828',     // Elevated surfaces
    elevated: '#333333',     // Modal, dropdown
  },
  
  // Metin Renkleri
  text: {
    primary: '#FFFFFF',      // Ana metin
    secondary: '#B3B3B3',    // İkincil metin
    muted: '#6A6A6A',        // Disabled, hint
  },
  
  // Durum Renkleri
  status: {
    online: '#1DB954',       // Çevrimiçi
    offline: '#535353',      // Çevrimdışı
    listening: '#1DB954',    // Müzik dinliyor
  },
  
  // Aksiyon Renkleri
  action: {
    danger: '#E91429',       // Sil, engelle
    warning: '#F59B23',      // Uyarı
    info: '#2E77D0',         // Bilgi
  }
};
```

## 10.2 Tipografi

```javascript
// src/styles/typography.ts

export const typography = {
  // Font Ailesi
  fontFamily: {
    regular: 'Circular-Regular',      // Spotify fontu benzeri
    medium: 'Circular-Medium',
    bold: 'Circular-Bold',
    // Alternatif: Inter, Poppins
  },
  
  // Font Boyutları
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 34,
  },
  
  // Satır Yükseklikleri
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  }
};
```

## 10.3 Boşluk (Spacing) Sistemi

```javascript
// src/styles/spacing.ts

export const spacing = {
  // Base: 4px
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,  // Yuvarlak (avatar için)
};
```
NASIL İLERLENECEĞİYLE İLGİLİ KURALLAR:
1) İlk olarak bana teorik bir şekilde görevimizin amacını ve ne yapacağımızı söyleyeceksin.
2) Sen profesyonelce ve tip güvenliğine dikkat edecek şekilde bana bunun kodunu nasıl yazağımı göstereceksin ama çok dikkat et bu kısım sadece örnek bir gösterim olacak, benim yazmam gereken kod olmayacak. Her detayı gösterip sonra bana görev olarak vereceksin ben kendim kodlayacağım.
3) Yazacağımız kod uzun olacaksa adım adım sırayla ilerleyeceğiz, birinci adımı anlatıp benden onay bekleyeceksin ve sonra devam edeceğiz.
4) Kontrol et dediğimde kontrol edeceksin ve eksikleri, hataları, olumlu yönleri söyleyeceksin.
5) Dosya ve proje bütünlüğünü asla bozmayacaksın.
---

# 📑 BÖLÜM XI: PERFORMANS OPTİMİZASYONU

## 11.1 FlashList Kullanımı

Chat listesi gibi uzun listelerde FlatList yerine FlashList kullan:

```javascript
import { FlashList } from '@shopify/flash-list';

function ChatList({ messages }) {
  return (
    <FlashList
      data={messages}
      renderItem={({ item }) => <MessageBubble message={item} />}
      estimatedItemSize={80}  // Ortalama item yüksekliği (önemli!)
      keyExtractor={(item) => item.id}
      inverted={true}  // Chat için en yeni en altta
    />
  );
}
```

## 11.2 Memoization

```javascript
import { memo, useMemo, useCallback } from 'react';

// Komponenti memoize et
const MessageBubble = memo(({ message, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(message)}>
      <Text>{message.content}</Text>
    </TouchableOpacity>
  );
});

// Parent'ta callback'i memoize et
function ChatRoom() {
  const handleMessagePress = useCallback((message) => {
    // İşlem
  }, []);
  
  // Filtreleme gibi ağır işlemleri memoize et
  const unreadMessages = useMemo(() => {
    return messages.filter(m => !m.is_read);
  }, [messages]);
}
```

## 11.3 Image Caching

```javascript
// react-native-fast-image kullan
import FastImage from 'react-native-fast-image';

function Avatar({ url }) {
  return (
    <FastImage
      source={{
        uri: url,
        priority: FastImage.priority.normal,
        cache: FastImage.cacheControl.immutable,
      }}
      style={styles.avatar}
    />
  );
}
```
NASIL İLERLENECEĞİYLE İLGİLİ KURALLAR:
1) İlk olarak bana teorik bir şekilde görevimizin amacını ve ne yapacağımızı söyleyeceksin.
2) Sen profesyonelce ve tip güvenliğine dikkat edecek şekilde bana bunun kodunu nasıl yazağımı göstereceksin ama çok dikkat et bu kısım sadece örnek bir gösterim olacak, benim yazmam gereken kod olmayacak. Her detayı gösterip sonra bana görev olarak vereceksin ben kendim kodlayacağım.
3) Yazacağımız kod uzun olacaksa adım adım sırayla ilerleyeceğiz, birinci adımı anlatıp benden onay bekleyeceksin ve sonra devam edeceğiz.
4) Kontrol et dediğimde kontrol edeceksin ve eksikleri, hataları, olumlu yönleri söyleyeceksin.
5) Dosya ve proje bütünlüğünü asla bozmayacaksın.
---

# 📑 BÖLÜM XII: TEST VE HATA AYIKLAMA

## 12.1 Debug Araçları

```
React Native Debugger:
- Chrome DevTools entegrasyonu
- Redux/State inspection
- Network request monitoring

Flipper:
- Native log görüntüleme
- Layout inspection
- Network debugging
- Performans profiling

React DevTools:
- Component tree
- Props/State inspection
- Profiler
```

## 12.2 Yaygın Hatalar ve Çözümleri

```
HATA: "Unable to resolve module..."
ÇÖZÜM: 
1. npm install çalıştır
2. Watchman cache temizle: watchman watch-del-all
3. Metro cache temizle: npm start -- --reset-cache

HATA: "Invariant Violation: requireNativeComponent..."
ÇÖZÜM:
1. cd android && ./gradlew clean
2. cd ios && pod install
3. Uygulamayı tamamen kapat ve yeniden başlat

HATA: Supabase Realtime bağlanmıyor
ÇÖZÜM:
1. Polyfill'in import edildiğinden emin ol
2. RLS politikalarını kontrol et
3. Supabase Dashboard'da Realtime aktif mi kontrol et
```
NASIL İLERLENECEĞİYLE İLGİLİ KURALLAR:
1) İlk olarak bana teorik bir şekilde görevimizin amacını ve ne yapacağımızı söyleyeceksin.
2) Sen profesyonelce ve tip güvenliğine dikkat edecek şekilde bana bunun kodunu nasıl yazağımı göstereceksin ama çok dikkat et bu kısım sadece örnek bir gösterim olacak, benim yazmam gereken kod olmayacak. Her detayı gösterip sonra bana görev olarak vereceksin ben kendim kodlayacağım.
3) Yazacağımız kod uzun olacaksa adım adım sırayla ilerleyeceğiz, birinci adımı anlatıp benden onay bekleyeceksin ve sonra devam edeceğiz.
4) Kontrol et dediğimde kontrol edeceksin ve eksikleri, hataları, olumlu yönleri söyleyeceksin.
5) Dosya ve proje bütünlüğünü asla bozmayacaksın.
---

# 📑 BÖLÜM XIII: DEPLOYMENT VE YAYINLAMA

## 13.1 Android APK Oluşturma

```powershell
# 1. Keystore oluştur (bir kerelik)
keytool -genkeypair -v -storetype PKCS12 -keystore musicalink-release.keystore -alias musicalink -keyalg RSA -keysize 2048 -validity 10000

# 2. Keystore'u android/app klasörüne taşı

# 3. android/gradle.properties dosyasına ekle:
MUSICALINK_UPLOAD_STORE_FILE=musicalink-release.keystore
MUSICALINK_UPLOAD_KEY_ALIAS=musicalink
MUSICALINK_UPLOAD_STORE_PASSWORD=*****
MUSICALINK_UPLOAD_KEY_PASSWORD=*****

# 4. Release APK oluştur
cd android
./gradlew assembleRelease

# APK konumu: android/app/build/outputs/apk/release/app-release.apk
```

## 13.2 Google Play Store Hazırlığı

```
Gerekli Materyaller:
- Uygulama ikonu (512x512 PNG)
- Feature Graphic (1024x500 PNG)
- En az 2 ekran görüntüsü (telefon)
- Kısa açıklama (80 karakter)
- Uzun açıklama (4000 karakter)
- Gizlilik Politikası URL'i (zorunlu)
- Kategori seçimi

Spotify API İçin:
- Rate Limit (Extended Quota) başvurusu
- Terms of Service uyumu
- Branding guidelines uyumu
```

---

# 📑 BÖLÜM XIV: GELİŞTİRME TAKVİMİ

## Sprint Planlaması

```
┌─────────────────────────────────────────────────────────────────┐
│                     GELİŞTİRME ROADMAP                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SPRINT 1 (Hafta 1-2): Temel Altyapı                            │
│  └─ Proje kurulumu                                              │
│  └─ Supabase konfigürasyonu                                      │
│  └─ Spotify OAuth entegrasyonu                                   │
│  └─ Temel navigasyon yapısı                                      │
│                                                                  │
│  SPRINT 2 (Hafta 3-4): Kullanıcı Sistemi                        │
│  └─ Login/Logout akışı                                          │
│  └─ Profil sayfası                                              │
│  └─ Profil düzenleme                                            │
│  └─ Arkadaş arama                                               │
│                                                                  │
│  SPRINT 3 (Hafta 5-6): Arkadaşlık Sistemi                       │
│  └─ Arkadaşlık isteği gönderme                                  │
│  └─ İstek kabul/red                                             │
│  └─ Arkadaş listesi                                             │
│  └─ Realtime durum güncellemeleri                               │
│                                                                  │
│  SPRINT 4 (Hafta 7-8): Mesajlaşma                               │
│  └─ Chat room tasarımı                                          │
│  └─ Mesaj gönderme/alma                                         │
│  └─ Realtime mesajlaşma                                         │
│  └─ Okundu bilgisi                                              │
│                                                                  │
│  SPRINT 5 (Hafta 9-10): Müzik Entegrasyonu                      │
│  └─ Anlık dinleme durumu                                        │
│  └─ Profilde şarkı gösterimi                                    │
│  └─ Şarkı paylaşımı                                             │
│  └─ "Birlikte dinle" özelliği                                   │
│                                                                  │
│  SPRINT 6 (Hafta 11-12): Polish & Release                       │
│  └─ UI/UX iyileştirmeleri                                       │
│  └─ Performans optimizasyonu                                    │
│  └─ Beta test                                                   │
│  └─ Play Store yayını                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# 📑 SONUÇ

Bu yol haritası, MusicaLink projesinin A'dan Z'ye tüm teknik detaylarını içermektedir. Her bölümü sırasıyla takip ederek, tam fonksiyonel bir gerçek zamanlı sosyal müzik uygulaması geliştirebilirsiniz.

**Önemli Hatırlatmalar:**
1. Her adımı tamamlamadan bir sonrakine geçme
2. Hata aldığında önce bu dökümana başvur
3. API anahtarlarını asla public repolara commit etme
4. Düzenli backup al
5. Her sprint sonunda test yap

**Başarılar! 🎵**
