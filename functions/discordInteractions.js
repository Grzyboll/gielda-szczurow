const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const nacl = require("tweetnacl");
const admin = require("firebase-admin");
const { FLAT, RUNE_COLORS } = require("./tattoos");

const discordPublicKey = defineSecret("DISCORD_PUBLIC_KEY");

const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4
};

const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8
};

const EPHEMERAL = 64;

function verifySignature(req, publicKeyHex) {
  const signature = req.get("X-Signature-Ed25519");
  const timestamp = req.get("X-Signature-Timestamp");
  if (!signature || !timestamp || !req.rawBody) return false;
  try {
    return nacl.sign.detached.verify(
      Buffer.concat([Buffer.from(timestamp), req.rawBody]),
      Buffer.from(signature, "hex"),
      Buffer.from(publicKeyHex, "hex")
    );
  } catch (err) {
    return false;
  }
}

function handleAutocomplete(interaction, res) {
  const options = (interaction.data && interaction.data.options) || [];
  const focused = options.find((o) => o.focused);
  const query = String((focused && focused.value) || "").trim().toLowerCase();

  const choices = FLAT
    .filter((it) => !query || it.name.toLowerCase().includes(query))
    .slice(0, 25)
    .map((it) => ({ name: it.name + " (" + it.cls + ")", value: it.name }));

  res.json({
    type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
    data: { choices }
  });
}

async function handleTattooCommand(interaction, res) {
  const options = (interaction.data && interaction.data.options) || [];
  const opts = {};
  options.forEach((o) => { opts[o.name] = o.value; });

  const nickname = String(opts.nick || "").trim().slice(0, 24);
  const tattooName = String(opts.bonus || "").trim();
  const item = FLAT.find((it) => it.name === tattooName);
  const rune = RUNE_COLORS.find((r) => r.key === opts.runa);

  if (!nickname || !item || !rune) {
    res.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Nie udało się złożyć zgłoszenia — podaj nick i wybierz tatuaż z podpowiedzi (autouzupełnianie), a nie wpisuj go ręcznie.",
        flags: EPHEMERAL
      }
    });
    return;
  }

  const entry = {
    nickname,
    name: item.name,
    cls: item.cls,
    desc: item.desc,
    rune: rune.key,
    runeLabel: rune.label,
    ts: Date.now()
  };

  try {
    await admin.firestore().collection("requests").add(entry);
  } catch (err) {
    res.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "Błąd zapisu zgłoszenia do bazy. Spróbuj ponownie.", flags: EPHEMERAL }
    });
    return;
  }

  res.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content:
        "**" + nickname + "** prosi o tatuaż: **" + item.name + "** [" + rune.label + "] (" + item.cls + ")\n> " + item.desc
    }
  });
}

exports.discordInteractions = onRequest(
  { region: "us-central1", secrets: [discordPublicKey] },
  async (req, res) => {
    if (!verifySignature(req, discordPublicKey.value())) {
      res.status(401).send("Bad request signature");
      return;
    }

    const interaction = req.body;

    if (interaction.type === InteractionType.PING) {
      res.json({ type: InteractionResponseType.PONG });
      return;
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
      handleAutocomplete(interaction, res);
      return;
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.data && interaction.data.name === "tatuaz") {
      await handleTattooCommand(interaction, res);
      return;
    }

    res.status(400).send("Unsupported interaction");
  }
);
