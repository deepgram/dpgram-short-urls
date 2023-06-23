import { ModalView } from "@slack/bolt";

const modal: ModalView = {
  callback_id: "try-shorten",
  type: "modal",
  title: {
    type: "plain_text",
    text: "Dpgr.am - Short URLs",
    emoji: true,
  },
  submit: {
    type: "plain_text",
    text: "Create Short URL",
    emoji: true,
  },
  close: {
    type: "plain_text",
    text: "Close",
    emoji: true,
  },
  blocks: [
    {
      type: "input",
      block_id: "long_url",
      element: {
        type: "url_text_input",
        action_id: "long",
        placeholder: {
          type: "plain_text",
          text: "What is the long URL to shorten?",
        },
      },
      label: {
        type: "plain_text",
        text: "Long URL",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "What URL did you want to shorten? This can be any URL, not just a Deepgram URL.",
      },
    },
    {
      type: "input",
      optional: true,
      block_id: "short_url",
      element: {
        type: "plain_text_input",
        action_id: "short",
        placeholder: {
          type: "plain_text",
          text: "If left blank, you'll get a generated string (like bit.ly)",
        },
      },
      label: {
        type: "plain_text",
        text: "Custom Shortcode",
      },
    },
    {
      type: "divider",
    },
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "SEO Magic",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "plain_text",
        text: "UTM tags for better link tracking. These will be added to the end of the long URL.",
        emoji: true,
      },
    },
    {
      type: "input",
      block_id: "utm_source",
      optional: true,
      element: {
        type: "plain_text_input",
        action_id: "utm_source",
        placeholder: {
          type: "plain_text",
          text: "Past examples: twitter, devto, reddit, linkedin, event, hackathon",
        },
      },
      label: {
        type: "plain_text",
        text: "UTM Source",
      },
    },
    {
      type: "input",
      block_id: "utm_campaign",
      optional: true,
      element: {
        type: "plain_text_input",
        action_id: "utm_campaign",
        placeholder: {
          type: "plain_text",
          text: "Past examples: paidsocial",
        },
      },
      label: {
        type: "plain_text",
        text: "UTM Campaign",
      },
    },
    {
      type: "input",
      block_id: "utm_medium",
      optional: true,
      element: {
        type: "plain_text_input",
        action_id: "utm_medium",
        placeholder: {
          type: "plain_text",
          text: "Past examples: blog, share, pycon2021",
        },
      },
      label: {
        type: "plain_text",
        text: "UTM Medium",
      },
    },
    {
      type: "input",
      block_id: "utm_content",
      optional: true,
      element: {
        type: "plain_text_input",
        action_id: "utm_content",
        placeholder: {
          type: "plain_text",
          text: "Past examples: /create-readable-transcripts-for-podcasts/",
        },
      },
      label: {
        type: "plain_text",
        text: "UTM Content",
      },
    },
  ],
};

export default modal;
