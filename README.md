# Bizning xotiralarimiz — sozlash qo'llanmasi

Bu qo'llanma sizga saytni ishga tushirish uchun kerak bo'lgan barcha qadamlarni ko'rsatadi.
Umumiy jarayon: **Firebase** (ma'lumotlar bazasi) sozlash → **GitHub** ga joylashtirish → birinchi admin hisobini yaratish.

---

## 1-QADAM: Firebase loyihasini yaratish

1. https://console.firebase.google.com ga Google hisobingiz bilan kiring
2. **"Add project" / "Loyiha qo'shish"** tugmasini bosing
3. Loyihaga nom bering (masalan `bizning-xotiralarimiz`) va yarating
4. Google Analytics so'ralsa — kerak emas, o'chirib qo'yaversangiz bo'ladi

## 2-QADAM: Authentication (login tizimi) yoqish

1. Chap menyudan **Build > Authentication** ni tanlang
2. **Get started** tugmasini bosing
3. **Sign-in method** bo'limida **Email/Password** ni tanlang va yoqing (Enable)

## 3-QADAM: Firestore Database yaratish

1. Chap menyudan **Build > Firestore Database** ni tanlang
2. **Create database** tugmasini bosing
3. Joylashuvni tanlang (istalgan yaqin region, masalan `europe-west` yoki `asia-south1`)
4. **Production mode** ni tanlang
5. Baza yaratilgach, **Rules** bo'limiga o'ting va ushbu loyihadagi `firestore.rules` faylining butun mazmunini nusxalab, joylashtiring va **Publish** qiling

## 4-QADAM: Storage yoqish (rasm/video uchun)

1. Chap menyudan **Build > Storage** ni tanlang
2. **Get started** tugmasini bosing, standart sozlamalarni tasdiqlang
3. **Rules** bo'limiga o'tib, ushbu loyihadagi `storage.rules` faylining mazmunini joylashtiring va **Publish** qiling

## 5-QADAM: Web ilova qo'shish va konfiguratsiyani olish

1. Loyiha sozlamalariga o'ting: chap yuqoridagi tishli g'ildirak (⚙️) > **Project settings**
2. Pastga tushib, **"Your apps"** bo'limida **`</>`** (Web) belgisini bosing
3. Ilovaga nom bering (masalan `love-site`) va **Register app** qiling
4. Sizga `firebaseConfig` degan JavaScript obyekti ko'rsatiladi — uni to'liq nusxalang
5. Loyihadagi `js/firebase-config.js` faylini oching va o'sha joydagi `firebaseConfig = {...}` qismini o'zingiz nusxalagan ma'lumotlar bilan almashtiring

## 6-QADAM: Birinchi admin hisobini yaratish (bu — SIZ)

1. Firebase konsolida **Authentication > Users** bo'limiga o'ting
2. **Add user** tugmasini bosing
3. Email sifatida: `sizningloginingiz@sevgi-sayti.local` deb yozing (masalan `admin@sevgi-sayti.local`) — bu yerdagi "sizningloginingiz" o'rniga o'zingiz xohlagan login so'zini yozing
4. Parol o'rnating va **Add user** ni bosing
5. Yaratilgan foydalanuvchi qatoridan **User UID** ni nusxalab oling (uzun harf-raqamli kod)
6. Endi **Firestore Database > Data** bo'limiga o'ting
7. **Start collection** tugmasini bosib, collection nomini `users` deb kiriting
8. Document ID sifatida yuqorida nusxalagan **UID** ni qo'ying
9. Quyidagi maydonlarni qo'shing:
   - `nickname` (string) — masalan `Men`
   - `username` (string) — email'dagi `@` belgisidan oldingi qism (masalan `admin`)
   - `isAdmin` (boolean) — `true`
   - `disabled` (boolean) — `false`
   - `specialName` (string) — xohlasangiz hoziroq `qiyomatligim` deb yozing, keyin saytdan ham o'zgartirasiz
10. **Save** qiling

Endi sizning admin hisobingiz tayyor: login — email'dagi `@` belgisidan oldingi qism, parol — o'zingiz o'rnatgan parol.

---

## 7-QADAM: GitHub'ga joylashtirish

1. https://github.com da yangi repository yarating, **Private** qilib qo'ying
2. Ushbu loyihadagi barcha fayllarni (`index.html`, `css/`, `js/`, va boshqalar) shu repositoryga yuklang (GitHub saytida "Add file > Upload files" orqali ham qilsa bo'ladi)
3. Repository ichida **Settings > Pages** bo'limiga o'ting
4. **Branch** qismida `main` (yoki `master`) va `/root` ni tanlab **Save** qiling
5. Bir necha daqiqadan so'ng sizga sayt manzili beriladi (masalan `https://foydalanuvchi-nomi.github.io/repo-nomi/`)

> **Eslatma:** Agar GitHub Pro yoki Team hisobingiz bo'lmasa, private repo'ning Pages sayti ham ushbu link orqali ochiladi — lekin login/parol bilan himoyalangani uchun faqat sizlar kira olasiz.

---

## 8-QADAM: Ikkinchi foydalanuvchini qo'shish

1. Saytga o'zingizning admin login/parolingiz bilan kiring
2. Hamburger menyu (☰) > **Admin panel** ni oching
3. **Foydalanuvchilar** bo'limida taxallus, login va parol kiritib, ikkinchi kishi (sevgilingiz) uchun hisob yarating
4. Endi u shu login/parol bilan saytga kira oladi

---

## Muhim eslatmalar

- Ma'lumotlar (matn, rasm, video, komment) Firebase'da saqlanadi — sayt qayta ochilganda, boshqa qurilmadan kirganda ham hammasi turgan joyida bo'ladi
- Firebase'ning bepul tarifi (Spark) ushbu loyiha uchun to'liq yetarli
- Foydalanuvchi biror narsani o'chirsa, unga darhol o'chgandek ko'rinadi, lekin siz (admin) **Admin panel > O'chirishlar** bo'limida uni butunlay o'chirish yoki tiklashni tanlaysiz — bu jarayon foydalanuvchiga sezilmaydi
- Sayt sarlavhasini o'zgartirish uchun `index.html` faylidagi `<title>` va login ekranidagi `<h1>Bizning xotiralarimiz</h1>` qismlarini xohlagan nomga almashtiring
