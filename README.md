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

## 3b. (Opcjonalnie) Bot Discorda — zgłaszanie tatuaży komendą `/tatuaz`

Osobna funkcja `discordInteractions` (też w [`functions/`](functions)) obsługuje komendę slash `/tatuaz`, która zapisuje zgłoszenie prosto do tej samej bazy co strona. Wymaga to własnej aplikacji/bota w Discord Developer Portal (oddzielnej od zwykłego webhooka z punktu 3).

1. Wejdź na https://discord.com/developers/applications → **New Application** → nadaj nazwę (np. "Kowal Run") → utwórz.
2. Zakładka **General Information** — skopiuj **Application ID** oraz **Public Key**.
3. Zakładka **Bot** → **Reset Token** (albo od razu zobaczysz token) → skopiuj **token bota** (pokazuje się tylko raz).
4. Ustaw sekret z **Public Key** (potrzebny funkcji do weryfikacji, że zapytania faktycznie przychodzą z Discorda — wklej wartość z kroku 2):

   ```bash
   firebase functions:secrets:set DISCORD_PUBLIC_KEY
   ```

5. Wdróż funkcję:

   ```bash
   firebase deploy --only functions
   ```
   Zapisz adres funkcji `discordInteractions` (postaci `https://us-central1-<projectId>.cloudfunctions.net/discordInteractions`).

6. Wróć do Developer Portal → **General Information** → pole **Interactions Endpoint URL** → wklej tam adres z kroku 5 → **Save Changes**. Discord od razu wyśle testowe zapytanie (PING) — jeśli funkcja jest wdrożona poprawnie, zapisze się bez błędu.

7. Zarejestruj komendę `/tatuaz` (robisz to raz, i za każdym razem gdy zmienisz jej definicję w `functions/register-commands.js`). W terminalu, w folderze `functions`:

   **PowerShell:**
   ```powershell
   $env:DISCORD_APPLICATION_ID = "wklej Application ID"
   $env:DISCORD_BOT_TOKEN = "wklej token bota"
   node register-commands.js
   ```

8. Zaproś bota na serwer: Developer Portal → **OAuth2 → URL Generator** → zaznacz scope **`applications.commands`** (samo to wystarczy do obsługi komend slash — scope `bot` jest potrzebny tylko jeśli chcesz mu dodatkowo nadać inne uprawnienia) → skopiuj wygenerowany link → otwórz go w przeglądarce → wybierz swój serwer.

9. Na Discordzie wpisz `/tatuaz` na dowolnym kanale, gdzie jest bot — powinny pojawić się pola `nick`, `bonus` (z podpowiedziami po zaczęciu pisania) i `runa`.

Uwaga: Public Key **nie jest tajny** (Discord i tak go publikuje), ale trzymamy go jako sekret dla spójności z resztą konfiguracji — nic złego się nie stanie jeśli ktoś go pozna. Token bota **jest** tajny i nigdzie w repo się nie zapisuje — używasz go tylko raz, lokalnie, do rejestracji komend.

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
