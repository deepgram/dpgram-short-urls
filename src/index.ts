import { App, InputBlock, SlashCommand, ViewSubmitAction } from "@slack/bolt";
import { Client } from "faunadb";
import { createUrl, getUrlByLong, getUrlByShort } from "./utils/faunaDb";
import { parse } from "url";
import dotenv from "dotenv";
import isValidUrl from "./utils/isValidUrl";
import modalFactory from "./blocks/shorten-modal";
import randomString from "./utils/randomString";
import truncator from "./utils/truncator";
dotenv.config();

const defaultRedirectLocation = "https://deepgram.com";
const channel = process.env.SLACK_CHANNEL_ID;

const db = new Client({
  secret: process.env.FAUNA_DB_SECRET,
});

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  customRoutes: [
    {
      path: "/",
      method: ["GET"],
      handler: async (req, res) => {
        res.writeHead(301, {
          Location: defaultRedirectLocation,
        });

        res.end();
      },
    },
    {
      path: "/health-check",
      method: ["GET"],
      handler: async (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.writeHead(200);
        res.end(
          JSON.stringify({
            hello: "world",
            default_url: defaultRedirectLocation,
          }),
        );
      },
    },
    {
      path: "/redirect",
      method: ["GET"],
      handler: async (req, res) => {
        let { path } = parse(req.url, true).query;

        if (Array.isArray(path)) {
          path = path[0];
        }

        const shortUrl = await getUrlByShort(db, path);
        const redirectUrl = shortUrl
          ? shortUrl.data.target
          : defaultRedirectLocation;

        res.writeHead(301, {
          Location: redirectUrl,
        });

        res.end();
      },
    },
  ],
});

// Listen for slash commands
app.command<SlashCommand>(
  "/shorten",
  async ({ payload, client, command, body, ack }) => {
    await ack();
    let modal = modalFactory();

    const result = await client.conversations.members({
      channel,
    });

    const isMember = result.members.includes(payload.user_id);

    if (payload.channel_id !== channel) {
      if (!isMember) {
        await client.conversations.invite({
          token: process.env.SLACK_BOT_TOKEN,
          users: payload.user_id,
          channel,
        });
      }
    }

    // if value is in command body, add initial value to modal
    if (command.text !== "") {
      const url = command.text;
      const parsed = url.replace(/\<|\>/g, "").replace(/&amp;/g, "&");

      if (isValidUrl(parsed)) {
        modal = modalFactory({ initial_value: parsed });
      }
    }

    await client.views.open({
      trigger_id: body.trigger_id,
      view: modal,
    });
  },
);

app.view<ViewSubmitAction>(
  "try-shorten",
  async ({ payload, ack, body, client }) => {
    let long = payload.state.values.long_url.long.value;

    const urlObj = new URL(long);
    const urlParams = urlObj.searchParams;

    const values = payload.state.values;
    const {
      utm_source: {
        utm_source: { value: utm_source },
      },
      utm_campaign: {
        utm_campaign: { value: utm_campaign },
      },
      utm_content: {
        utm_content: { value: utm_content },
      },
      utm_medium: {
        utm_medium: { value: utm_medium },
      },
    } = values;

    if (utm_source) {
      urlParams.set("utm_source", utm_source);
    }

    if (utm_campaign) {
      urlParams.set("utm_campaign", utm_campaign);
    }

    if (utm_content) {
      urlParams.set("utm_content", utm_content);
    }

    if (utm_medium) {
      urlParams.set("utm_medium", utm_medium);
    }

    if (utm_source || utm_campaign || utm_content || utm_medium) {
      long = urlObj.href;
    }

    if (!isValidUrl(long)) {
      await ack({
        response_action: "errors",
        errors: {
          long_url: "A valid URL is required",
        },
      });

      return;
    }

    let short;
    let code = payload.state.values.short_url.short.value;

    if (code) {
      const shortExists = await getUrlByShort(db, code);

      if (shortExists) {
        await ack({
          response_action: "errors",
          errors: {
            short_url:
              "This short code has already been used, please enter a different one",
          },
        });

        return;
      }

      short = code;
    }

    const longExists = await getUrlByLong(db, long);

    if (longExists) {
      ack();

      client.chat.postMessage({
        channel,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `:disguised_face: Oops <@${body.user.id}>! It looks like your dpgr.am link was already shortened:`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Target Url:* <${longExists.data.target}|${truncator(
                longExists.data.target,
              )}>`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Short Url:* https://dpgr.am/${longExists.data.source}`,
            },
          },
        ],
        text: "It looks like your dpgr.am link was already shortened!",
        unfurl_links: false,
      });

      return;
    }

    if (!short) {
      short = randomString();
    }

    const newUrl = await createUrl(db, long, short);

    if (newUrl) {
      ack();

      client.chat.postMessage({
        channel,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `:tada: Hooray <@${body.user.id}>! Your dpgr.am link has been created:`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Target Url:* <${newUrl.data.target}|${truncator(
                newUrl.data.target,
              )}>`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Short Url:* https://dpgr.am/${newUrl.data.source}`,
            },
          },
        ],
        text: "It looks like your dpgr.am link was already shortened!",
        unfurl_links: false,
      });

      return;
    }

    // catch all, because everything should have been done by now.
    ack();

    await client.chat.postEphemeral({
      token: process.env.SLACK_BOT_TOKEN,
      channel: channel,
      user: body.user.id,
      text: `Sorry <@${body.user.id}>, an unknown error has occured. We either could not contact the database, or there has been another error.`,
    });
  },
);

(async () => {
  await app.start(process.env.PORT || 3000);
})();
