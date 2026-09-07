// Jednorazowy (albo uruchamiany po każdej zmianie definicji komendy) skrypt
// rejestrujący komendę slash /tattoo w Discordzie. NIE jest częścią wdrażanej
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

const runeChoices = RUNE_COLORS.map((r) => ({ name: r.label, value: r.key }));

const addSearchOptions = [
  {
    name: "runa",
    description: "Kolor runy",
    type: 3, // STRING
    required: true,
    choices: runeChoices
  },
  {
    name: "tatuaz",
    description: "Zacznij pisać nazwę tatuażu / bonusu klasowego i wybierz z podpowiedzi",
    type: 3,
    required: true,
    autocomplete: true
  }
];

const command = {
  name: "tattoo",
  description: "Giełda tatuaży gildii — dodaj, poszukaj, usuń swoje ogłoszenie albo zobacz ranking",
  options: [
    {
      name: "add",
      description: "Dodaj tatuaż, który masz i chcesz oddać (nick brany automatycznie z Discorda)",
      type: 1, // SUB_COMMAND
      options: addSearchOptions
    },
    {
      name: "search",
      description: "Dodaj tatuaż, którego szukasz (nick brany automatycznie z Discorda)",
      type: 1,
      options: addSearchOptions
    },
    {
      name: "remove",
      description: "Usuń jedno ze swoich ogłoszeń",
      type: 1,
      options: [
        {
          name: "wpis",
          description: "Wybierz swoje ogłoszenie do usunięcia",
          type: 3,
          required: true,
          autocomplete: true
        },
        {
          name: "help",
          description: "Usuwasz poszukiwanie bo znalazłeś? Zaznacz kto pomógł — dostanie +5 pkt",
          type: 6, // USER
          required: false
        }
      ]
    },
    {
      name: "ranking",
      description: "Pokaż ranking gildii (kto zdobył najwięcej punktów)",
      type: 1,
      options: []
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
