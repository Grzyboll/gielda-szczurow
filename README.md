# Cech Tatuażystów

Giełda tatuaży dla graczy MUD — strona (`index.html`) tylko wyświetla ogłoszenia „mam do oddania” i „szukam”, wczytywane na żywo z Firestore (Firebase). Dodawanie i usuwanie ogłoszeń odbywa się wyłącznie przez bota Discord (komendy `/tattoo add`, `/tattoo search`, `/tattoo remove`) — strona nie ma żadnego formularza.

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

## 3. Bot Discorda — jedyny sposób dodawania ogłoszeń

Funkcja `discordInteractions` (w [`functions/`](functions)) obsługuje komendę slash `/tattoo` z trzema podkomendami:

- **`/tattoo add nick:<nick postaci> runa:<kolor> tatuaz:<nazwa>`** — masz ten tatuaż i chcesz go oddać.
- **`/tattoo search nick:<nick postaci> runa:<kolor> tatuaz:<nazwa>`** — szukasz tego tatuażu.
- **`/tattoo remove wpis:<Twoje ogłoszenie>`** — usuwa jedno z Twoich własnych ogłoszeń (podpowiedzi pokazują tylko Twoje wpisy).

Przy `add`/`search` bot dodatkowo:
- sprawdza, czy po drugiej stronie (kogoś kto szuka / coś oferuje) już istnieje pasujący wpis na ten sam tatuaż + runę — jeśli tak, dopisuje w odpowiedzi kto to jest i oznacza go (`@wzmianka`), żeby można było się od razu odezwać;
- wysyła ogłoszenie na webhook Discorda (ten sam mechanizm co dawniej — patrz niżej), więc nowy wpis widać na dedykowanym kanale niezależnie od tego, gdzie komenda została użyta.

Wymaga to konta z płatnością włączoną (plan **Blaze** — pay-as-you-go; przy małym ruchu koszt to praktycznie $0, patrz cennik Cloud Functions) oraz własnej aplikacji/bota w Discord Developer Portal.

1. Zainstaluj [Node.js](https://nodejs.org/) (LTS) i Firebase CLI: `npm install -g firebase-tools`.
2. `firebase login` — zaloguj się kontem Google używanym w Firebase.
3. Wejdź na https://discord.com/developers/applications → **New Application** → nadaj nazwę (np. "Kowal Run") → utwórz.
4. Zakładka **General Information** — skopiuj **Application ID** oraz **Public Key**.
5. Zakładka **Bot** → **Reset Token** (albo od razu zobaczysz token) → skopiuj **token bota** (pokazuje się tylko raz).
6. Ustaw sekret z **Public Key** (potrzebny funkcji do weryfikacji, że zapytania faktycznie przychodzą z Discorda — wklej wartość z kroku 4):

   ```bash
   firebase functions:secrets:set DISCORD_PUBLIC_KEY
   ```

6b. (Opcjonalnie, ale zalecane) Ustaw webhook do ogłoszeń — na Discordzie: ustawienia kanału, na którym mają się pojawiać ogłoszenia → **Integrations → Webhooks → New Webhook → Copy Webhook URL**, potem:

   ```bash
   firebase functions:secrets:set DISCORD_WEBHOOK_URL
   ```
   Jeśli pominiesz ten krok, komendy `/tattoo add`/`search` nadal działają — po prostu nie polecą dodatkowo na webhook (zostanie tylko odpowiedź bota w kanale, gdzie użyto komendy).

7. Wdróż funkcję:

   ```bash
   firebase deploy --only functions
   ```
   Zapisz adres funkcji `discordInteractions` (postaci `https://us-central1-<projectId>.cloudfunctions.net/discordInteractions`).

8. Wróć do Developer Portal → **General Information** → pole **Interactions Endpoint URL** → wklej tam adres z kroku 7 → **Save Changes**. Discord od razu wyśle testowe zapytanie (PING) — jeśli funkcja jest wdrożona poprawnie, zapisze się bez błędu.

9. Zarejestruj komendę `/tattoo` (robisz to raz, i za każdym razem gdy zmienisz jej definicję w `functions/register-commands.js`). W terminalu, w folderze `functions`:

   **PowerShell:**
   ```powershell
   $env:DISCORD_APPLICATION_ID = "wklej Application ID"
   $env:DISCORD_BOT_TOKEN = "wklej token bota"
   node register-commands.js
   ```

10. Zaproś bota na serwer: Developer Portal → **OAuth2 → URL Generator** → zaznacz scope **`applications.commands`** (samo to wystarczy do obsługi komend slash — scope `bot` jest potrzebny tylko jeśli chcesz mu dodatkowo nadać inne uprawnienia) → skopiuj wygenerowany link → otwórz go w przeglądarce → wybierz swój serwer.

11. Na Discordzie wpisz `/tattoo add` (albo `search`/`remove`) na dowolnym kanale, gdzie jest bot — powinny pojawić się pola `runa` (lista do wyboru) i `tatuaz`/`wpis` (podpowiedzi po zaczęciu pisania).

Uwaga: Public Key **nie jest tajny** (Discord i tak go publikuje), ale trzymamy go jako sekret dla spójności z resztą konfiguracji — nic złego się nie stanie jeśli ktoś go pozna. Token bota **jest** tajny i nigdzie w repo się nie zapisuje — używasz go tylko raz, lokalnie, do rejestracji komend.

Jeśli funkcja nie jest wdrożona, komenda po prostu nie zadziała w Discordzie — strona nadal wyświetli to, co już jest w bazie.

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
