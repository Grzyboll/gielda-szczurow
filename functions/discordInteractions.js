const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const nacl = require("tweetnacl");
const admin = require("firebase-admin");
const { FLAT, RUNE_COLORS } = require("./tattoos");

const discordPublicKey = defineSecret("DISCORD_PUBLIC_KEY");
const discordWebhookUrl = defineSecret("DISCORD_WEBHOOK_URL");

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

// Nick brany automatycznie z Discorda: nick serwerowy (member.nick) jeśli
// gracz go ustawił, inaczej globalna nazwa/username — nigdy nie pytamy o to
// ręcznie.
function getDiscordUser(interaction) {
  const member = interaction.member;
  const user = (member && member.user) || interaction.user || {};
  const serverNick = member && member.nick;
  return {
    id: user.id || "",
    mention: user.id ? "<@" + user.id + ">" : "",
    displayName: serverNick || user.global_name || user.username || "Nieznany gracz"
  };
}

function resolveMentionedUser(interaction, userId) {
  const resolved = (interaction.data && interaction.data.resolved) || {};
  const member = resolved.members && resolved.members[userId];
  const user = resolved.users && resolved.users[userId];
  const displayName = (member && member.nick) || (user && (user.global_name || user.username)) || "Nieznany gracz";
  return { id: userId, displayName };
}

function getSubcommand(interaction) {
  const options = (interaction.data && interaction.data.options) || [];
  const sub = options[0];
  if (!sub) return { name: "", opts: {}, focused: null };
  const opts = {};
  (sub.options || []).forEach((o) => { opts[o.name] = o.value; });
  return {
    name: sub.name,
    opts,
    focused: (sub.options || []).find((o) => o.focused) || null
  };
}

async function sendWebhook(content) {
  const url = discordWebhookUrl.value();
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
  } catch (err) {
    // Webhook jest tylko dodatkowym ogłoszeniem — brak dostawy nie blokuje zgłoszenia.
  }
}

async function findMatches(oppositeType, name, runeKey) {
  const snap = await admin.firestore()
    .collection("listings")
    .where("type", "==", oppositeType)
    .limit(200)
    .get();

  return snap.docs
    .map((d) => d.data())
    .filter((d) => d.name === name && d.rune === runeKey);
}

async function awardPoints(discordUserId, discordUsername, points, reason) {
  if (!discordUserId || !points) return;
  const ref = admin.firestore().collection("rankings").doc(discordUserId);
  await ref.set(
    {
      discordUserId,
      discordUsername,
      points: admin.firestore.FieldValue.increment(points)
    },
    { merge: true }
  );
  await admin.firestore().collection("pointHistory").add({
    discordUserId,
    discordUsername,
    points,
    reason,
    ts: Date.now()
  });
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

  if (focused.name === "entry") {
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
  const rune = RUNE_COLORS.find((r) => r.key === sub.opts.rune);

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

  const isAdd = sub.name === "add";
  if (isAdd) {
    await awardPoints(user.id, user.displayName, 1, "Dodał tatuaż: " + item.name + " [" + rune.label + "]");
  }
  const verb = isAdd ? "ma do oddania tatuaż" : "szuka tatuażu";
  const headline =
    "**" + user.displayName + "** " + verb + ": **" + item.name + "** [" + rune.label + "] (" + item.cls + ")\n> " + item.desc;

  const matches = await findMatches(isAdd ? "search" : "add", item.name, rune.key);
  var matchNote = "";
  if (matches.length > 0) {
    const names = matches
      .map((m) => m.discordUsername + (m.discordUserId ? " (<@" + m.discordUserId + ">)" : ""))
      .join(", ");
    matchNote = isAdd
      ? "\n\n🔔 Ktoś już tego szuka: " + names
      : "\n\n🔔 To jest już dostępne! Ma to: " + names;
  }

  const webhookPrefix = isAdd ? "🟢 Nowa oferta" : "🔍 Nowe poszukiwanie";
  await sendWebhook(webhookPrefix + " — " + headline + matchNote);

  res.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: headline + matchNote }
  });
}

async function handleRemove(sub, user, interaction, res) {
  const docId = String(sub.opts.entry || "").trim();
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

  var bonusNote = "";
  const helperId = sub.opts.help;

  if (helperId) {
    if (data.type !== "search") {
      bonusNote = "\n(Bonus +5 pkt działa tylko przy usuwaniu poszukiwań — pominięto.)";
    } else if (helperId === user.id) {
      bonusNote = "\n(Nie można przyznać punktów samemu sobie.)";
    } else {
      const helper = resolveMentionedUser(interaction, helperId);
      await awardPoints(
        helperId,
        helper.displayName,
        5,
        "Pomógł/pomogła zdobyć: " + data.name + " [" + data.runeLabel + "] (dla " + user.displayName + ")"
      );
      bonusNote = "\n+5 pkt dla <@" + helperId + "> — dzięki!";
      await sendWebhook(
        "🏆 <@" + helperId + "> dostaje +5 pkt — pomógł/pomogła **" + user.displayName + "** zdobyć **" + data.name + "** [" + data.runeLabel + "]!"
      );
    }
  }

  res.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: "Usunięto ogłoszenie: **" + data.name + "** [" + data.runeLabel + "]" + bonusNote,
      flags: EPHEMERAL
    }
  });
}

async function handleRanking(res) {
  const snap = await admin.firestore()
    .collection("rankings")
    .orderBy("points", "desc")
    .limit(10)
    .get();

  if (snap.empty) {
    res.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "Ranking jest jeszcze pusty." }
    });
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  const lines = snap.docs.map((d, i) => {
    const data = d.data();
    return (medals[i] || i + 1 + ".") + " **" + data.discordUsername + "** — " + data.points + " pkt";
  });

  res.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: "**Ranking gildii**\n" + lines.join("\n") }
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
    await handleRemove(sub, user, interaction, res);
    return;
  }

  if (sub.name === "ranking") {
    await handleRanking(res);
    return;
  }

  res.status(400).send("Unknown subcommand");
}

exports.discordInteractions = onRequest(
  { region: "us-central1", secrets: [discordPublicKey, discordWebhookUrl] },
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
