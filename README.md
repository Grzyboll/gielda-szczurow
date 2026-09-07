# Cech Tatuażystów

Strona zgłoszeniowa tatuaży dla graczy MUD. Statyczny plik `index.html` + Firestore (Firebase) jako wspólna baza zgłoszeń, hostowana za darmo.

## 1. Załóż darmowy projekt Firebase

1. Wejdź na https://console.firebase.google.com i zaloguj się kontem Google.
2. „Add project” → podaj nazwę (np. `cech-tatuazystow`) → wyłącz Google Analytics (niepotrzebne) → utwórz.
3. W menu po lewej: **Build → Firestore Database** → „Create database” → wybierz lokalizację (np. `eur3`) → tryb produkcyjny.
4. Zakładka **Rules** w Firestore → wklej zawartość pliku [`firestore.rules`](firestore.rules) z tego folderu → Publish.
5. W menu po lewej: ikona ⚙️ → **Project settings** → sekcja „Your apps” → kliknij ikonę `</>` (Web app) → nadaj nazwę → „Register app”.
6. Firebase pokaże obiekt `firebaseConfig` z wartościami `apiKey`, `authDomain`, `projectId` itd. — skopiuj je.

## 2. Podłącz konfigurację

Otwórz `index.html`, znajdź sekcję:

```js
// ==== KONFIGURACJA FIREBASE — WKLEJ TU SWOJE DANE ====
var firebaseConfig = {
  apiKey: "TWOJ_API_KEY",
  ...
};
```

Zastąp wartości `TWOJ_...` danymi skopiowanymi z Firebase. Zapisz plik.

## 3. (Opcjonalnie) Powiadomienia na Discordzie

Chcesz, żeby każde zgłoszenie leciało jako wiadomość na kanał Discorda:

1. Na Discordzie wejdź w ustawienia kanału, na którym mają się pojawiać zgłoszenia (może być istniejący kanał albo nowy, np. `#zgloszenia-tatuazy`) → **Integrations → Webhooks → New Webhook**.
2. Nadaj nazwę webhookowi, kliknij **Copy Webhook URL**.
3. W `index.html` znajdź linijkę:

   ```js
   var discordWebhookUrl = "TWOJ_DISCORD_WEBHOOK_URL";
   ```

   i zastąp skopiowanym adresem URL. Zapisz plik.

Jeśli zostawisz wartość `TWOJ_DISCORD_WEBHOOK_URL` bez zmian, powiadomienia po prostu się nie wysyłają — reszta strony działa normalnie.

## 4. Wystaw stronę online (za darmo)

Najprostsza opcja — bez instalowania czegokolwiek:

1. Wejdź na https://app.netlify.com/drop
2. Przeciągnij folder z tym projektem (zawierający `index.html`) na stronę.
3. Netlify od razu wygeneruje darmowy adres w stylu `nazwa-losowa.netlify.app` — strona jest już publicznie dostępna.

## 5. (Opcjonalnie) Podepnij własną domenę

W panelu Netlify: **Site settings → Domain management → Add a domain**. Możesz tam:
- kupić nową domenę bezpośrednio przez Netlify, albo
- wskazać domenę kupioną gdzie indziej (np. OVH, home.pl, Namecheap) — Netlify poda rekordy DNS do ustawienia u rejestratora.

Samo podpięcie domeny w Netlify jest darmowe — kosztuje tylko zakup domeny u rejestratora (odnawiany co roku).
