const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();

const discordWebhookUrl = defineSecret("DISCORD_WEBHOOK_URL");

function truncate(value, maxLen) {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLen);
}

exports.notifyDiscord = onRequest(
  { region: "us-central1", secrets: [discordWebhookUrl], cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const body = req.body || {};
    const nickname = truncate(body.nickname, 24);
    const name = truncate(body.name, 60);
    const cls = truncate(body.cls, 60);
    const desc = truncate(body.desc, 300);
    const runeLabel = truncate(body.runeLabel, 40);

    if (!nickname || !name) {
      res.status(400).send("Missing nickname or name");
      return;
    }

    const content =
      "**" + nickname + "** prosi o tatuaż: **" + name + "**" +
      (runeLabel ? " [" + runeLabel + "]" : "") +
      (cls ? " (" + cls + ")" : "") +
      (desc ? "\n> " + desc : "");

    try {
      const discordRes = await fetch(discordWebhookUrl.value(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      if (!discordRes.ok) {
        res.status(502).send("Discord webhook error");
        return;
      }

      res.status(204).send();
    } catch (err) {
      res.status(502).send("Discord webhook unreachable");
    }
  }
);

exports.discordInteractions = require("./discordInteractions").discordInteractions;
