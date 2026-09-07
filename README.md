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

Powiadomienia idą przez Cloud Function `notifyDiscord` (folder [`functions/`](functions)), nie przez `index.html` — dzięki temu prawdziwy adres webhooka nigdy nie trafia do kodu strony ani do (publicznego) repo.

Wymaga to konta z płatnością włączoną (plan **Blaze** — pay-as-you-go; przy małym ruchu koszt to praktycznie $0, patrz cennik Cloud Functions).

1. Zainstaluj [Node.js](https://nodejs.org/) (LTS) i Firebase CLI: `npm install -g firebase-tools`.
2. `firebase login` — zaloguj się kontem Google używanym w Firebase.
3. Na Discordzie: ustawienia kanału, na którym mają się pojawiać zgłoszenia → **Integrations → Webhooks → New Webhook** → **Copy Webhook URL**.
4. W katalogu projektu ustaw sekret (poprosi Cię o wklejenie URL w terminalu — nie w pliku):

   ```bash
   firebase functions:secrets:set DISCORD_WEBHOOK_URL
   ```

5. Wdróż funkcję:

   ```bash
   firebase deploy --only functions
   ```

6. Firebase wypisze adres wdrożonej funkcji (postaci `https://us-central1-<projectId>.cloudfunctions.net/notifyDiscord`). W `index.html` sprawdź, czy zmienna `notifyDiscordUrl` wskazuje na ten sam adres.

Jeśli funkcja nie jest wdrożona, powiadomienia po prostu się nie wysyłają — reszta strony działa normalnie.

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
