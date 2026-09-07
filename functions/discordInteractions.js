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

function getDiscordUser(interaction) {
  const user = (interaction.member && interaction.member.user) || interaction.user || {};
  return {
    id: user.id || "",
    displayName: user.global_name || user.username || "Nieznany gracz"
  };
}

function getSubcommand(interaction) {
  const options = (interaction.data && interaction.data.options) || [];
  const sub = options[0];
  if (!sub) return { name: "", opts: {}, focused: null, options: [] };
  const opts = {};
  (sub.options || []).forEach((o) => { opts[o.name] = o.value; });
  return {
    name: sub.name,
    opts,
    options: sub.options || [],
    focused: (sub.options || []).find((o) => o.focused) || null
  };
}

async function handleAutocomplete(interaction, res) {
  const sub = getSubcommand(interaction);
  const focused = sub.focused;

  if (!focused) {
    res.json({ type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT, data: { choices: [] } });
    return;
  }

  if (focused.name === "tatuaz") {
    const query = String(focused.value || "").trim().toLowerCase();
    const choices = FLAT
      .filter((it) => !query || it.name.toLowerCase().includes(query))
      .slice(0, 25)
      .map((it) => ({ name: it.name + " (" + it.cls + ")", value: it.name }));
    res.json({ type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT, data: { choices } });
    return;
  }

  if (focused.name === "wpis") {
    const user = getDiscordUser(interaction);
    const query = String(focused.value || "").trim().toLowerCase();

    const snap = await admin.firestore()
      .collection("listings")
      .where("discordUserId", "==", user.id)
      .limit(100)
      .get();

    const choices = snap.docs
      .map((d) => ({ id: d.id, data: d.data() }))
      .sort((a, b) => (b.data.ts || 0) - (a.data.ts || 0))
      .filter(({ data }) => !query || data.name.toLowerCase().includes(query))
      .slice(0, 25)
      .map(({ id, data }) => ({
        name: (data.type === "add" ? "[Oddaję] " : "[Szukam] ") + data.name + " (" + data.runeLabel + ")",
        value: id
      }));

    res.json({ type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT, data: { choices } });
    return;
  }

  res.json({ type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT, data: { choices: [] } });
}

async function handleAddOrSearch(sub, user, res) {
  const tattooName = String(sub.opts.tatuaz || "").trim();
  const item = FLAT.find((it) => it.name === tattooName);
  const rune = RUNE_COLORS.find((r) => r.key === sub.opts.runa);

  if (!item || !rune) {
    res.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Wybierz tatuaż z podpowiedzi (autouzupełnianie), a nie wpisuj go ręcznie.",
        flags: EPHEMERAL
      }
    });
    return;
  }

  const listing = {
    discordUserId: user.id,
    discordUsername: user.displayName,
    name: item.name,
    cls: item.cls,
    desc: item.desc,
    rune: rune.key,
    runeLabel: rune.label,
    type: sub.name,
    ts: Date.now()
  };

  await admin.firestore().collection("listings").add(listing);

  const verb = sub.name === "add" ? "ma do oddania tatuaż" : "szuka tatuażu";
  res.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content:
        "**" + user.displayName + "** " + verb + ": **" + item.name + "** [" + rune.label + "] (" + item.cls + ")\n> " + item.desc
    }
  });
}

async function handleRemove(sub, user, res) {
  const docId = String(sub.opts.wpis || "").trim();
  if (!docId) {
    res.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "Wybierz ogłoszenie z podpowiedzi.", flags: EPHEMERAL }
    });
    return;
  }

  const docRef = admin.firestore().collection("listings").doc(docId);
  const doc = await docRef.get();

  if (!doc.exists || doc.data().discordUserId !== user.id) {
    res.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "Nie znaleziono takiego ogłoszenia wśród Twoich wpisów.", flags: EPHEMERAL }
    });
    return;
  }

  const data = doc.data();
  await docRef.delete();

  res.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: "Usunięto ogłoszenie: **" + data.name + "** [" + data.runeLabel + "]",
      flags: EPHEMERAL
    }
  });
}

async function handleCommand(interaction, res) {
  const sub = getSubcommand(interaction);
  const user = getDiscordUser(interaction);

  if (sub.name === "add" || sub.name === "search") {
    await handleAddOrSearch(sub, user, res);
    return;
  }

  if (sub.name === "remove") {
    await handleRemove(sub, user, res);
    return;
  }

  res.status(400).send("Unknown subcommand");
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
      await handleAutocomplete(interaction, res);
      return;
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.data && interaction.data.name === "tattoo") {
      await handleCommand(interaction, res);
      return;
    }

    res.status(400).send("Unsupported interaction");
  }
);
