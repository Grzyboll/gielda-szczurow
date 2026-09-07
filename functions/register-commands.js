// Jednorazowy (albo uruchamiany po każdej zmianie definicji komendy) skrypt
// rejestrujący komendę slash /tatuaz w Discordzie. NIE jest częścią wdrażanej
// funkcji (nie jest exportowany z index.js) — uruchamiasz go ręcznie lokalnie:
//
//   DISCORD_APPLICATION_ID=... DISCORD_BOT_TOKEN=... node register-commands.js
//
// (na Windows/PowerShell: patrz README.md, sekcja o bocie Discord)

const applicationId = process.env.DISCORD_APPLICATION_ID;
const botToken = process.env.DISCORD_BOT_TOKEN;

if (!applicationId || !botToken) {
  console.error("Ustaw zmienne środowiskowe DISCORD_APPLICATION_ID i DISCORD_BOT_TOKEN przed uruchomieniem.");
  process.exit(1);
}

const { RUNE_COLORS } = require("./tattoos");

const command = {
  name: "tatuaz",
  description: "Zgłoś prośbę o tatuaż do kowala run",
  options: [
    {
      name: "nick",
      description: "Nick Twojej postaci",
      type: 3, // STRING
      required: true
    },
    {
      name: "bonus",
      description: "Zacznij pisać nazwę tatuażu / bonusu klasowego i wybierz z podpowiedzi",
      type: 3,
      required: true,
      autocomplete: true
    },
    {
      name: "runa",
      description: "Kolor runy",
      type: 3,
      required: true,
      choices: RUNE_COLORS.map((r) => ({ name: r.label, value: r.key }))
    }
  ]
};

async function main() {
  const res = await fetch(
    "https://discord.com/api/v10/applications/" + applicationId + "/commands",
    {
      method: "PUT",
      headers: {
        Authorization: "Bot " + botToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([command])
    }
  );

  const body = await res.text();
  console.log("Status:", res.status);
  console.log(body);

  if (!res.ok) process.exit(1);
}

main();
