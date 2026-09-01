require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error("❌ BOT_TOKEN is missing in .env");
  process.exit(1);
}

const bot = new Telegraf(token);

// =====================================================
// NUIX OFFICIAL KNOWLEDGE BASE
// =====================================================

const NUIX = {
  name: "NUIXCOIN",
  symbol: "NUIX",

  network: "BNB Smart Chain",
  standard: "BEP-20",
  decimals: 18,

  supply: "1,000,000,000 NUIX",

  contract:
    "0x8174A72a8A11781bE881b2eaeb228a78b2387Ea9",

  vestingContract:
    "0xaa9B4a576987cdD5d9D1FC15aD49FD45C78A2A58",

  website: "https://nuixcoin.site",
  x: "https://x.com/NuixCoin",
  telegram: "https://t.me/nuix_coin",

  bscscan:
    "https://bscscan.com/token/0x8174A72a8A11781bE881b2eaeb228a78b2387Ea9",

  vestingBscscan:
    "https://bscscan.com/address/0xaa9B4a576987cdD5d9D1FC15aD49FD45C78A2A58",

  support: "support@nuixcoin.site",

  status: {
    preLaunch: true,
    tradingLive: false,
    dexLiquidityLive: false,
    launchDateAnnounced: false,
  },

  story: {
    N: "New — A new chapter in digital assets.",
    U: "Unity — A community connected by a shared vision.",
    I: "Innovation — Exploring new possibilities through technology.",
    X: "The Unknown — The future is not written.",
  },

  allocation: {
    liquidity: {
      amount: "550,000,000 NUIX",
      percent: "55%",
    },
    community: {
      amount: "150,000,000 NUIX",
      percent: "15%",
    },
    marketing: {
      amount: "100,000,000 NUIX",
      percent: "10%",
    },
    treasury: {
      amount: "100,000,000 NUIX",
      percent: "10%",
    },
    founder: {
      amount: "50,000,000 NUIX",
      percent: "5%",
    },
    team: {
      amount: "50,000,000 NUIX",
      percent: "5%",
    },
  },

  vesting: {
    allocation: "50,000,000 NUIX",
    cliff: "90 days",
    linearStart: "Day 90",
    fullVesting: "Day 180",
  },

  security: {
    solidity: "0.8.20",
    framework: "OpenZeppelin Contracts",
    criticalFindings: false,
    highFindings: false,
  },

  roadmap: {
    phase1:
      "Foundation — deploy contract, verify contract, official website, and official social channels.",

    phase2:
      "Market Infrastructure — establish DEX liquidity, enable trading, and pursue relevant token directory listings.",

    phase3:
      "Ecosystem Growth — community expansion, partnerships, and new utilities where appropriate.",

    phase4:
      "Long-Term Development — expand integrations, improve accessibility, and evaluate additional exchange and infrastructure integrations.",
  },

  rewards:
    "Early community rewards are being prepared. The allocation, eligibility, requirements, and distribution details have not been officially announced yet.",
};

// =====================================================
// BOT SETTINGS
// =====================================================

// Keep the automatic note short.
// We don't want every answer to feel robotic.
const BOT_NOTE =
  "\n\n🤖 Automated reply — please verify important details.";

// How long user context remains useful.
const CONTEXT_TTL = 10 * 60 * 1000; // 10 minutes

// How long before the bot can greet the same user again.
const GREETING_COOLDOWN = 20 * 60 * 1000; // 20 minutes

// =====================================================
// SIMPLE FREE CONTEXT MEMORY
// =====================================================

// userId -> {
//   lastIntent,
//   lastQuestion,
//   lastTimestamp
// }
const userContexts = new Map();

// userId -> last greeting timestamp
const greetingHistory = new Map();

// =====================================================
// MAIN MENU
// =====================================================

const mainMenu = Markup.inlineKeyboard([
  [
    Markup.button.callback("🪙 NUIX Info", "info"),
    Markup.button.callback("🔎 Contract", "contract"),
  ],
  [
    Markup.button.callback("🚀 Status", "status"),
    Markup.button.callback("🎁 Rewards", "rewards"),
  ],
  [
    Markup.button.callback("🗺 Roadmap", "roadmap"),
    Markup.button.callback("🔗 Official Links", "links"),
  ],
]);

// =====================================================
// TEXT HELPERS
// =====================================================

function normalize(text = "") {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[@#$%&*_+=<>|~^`"'“”‘’!?.,:;()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(text = "") {
  return normalize(text).replace(/\s+/g, "");
}

function includesAny(text, values = []) {
  return values.some((value) => text.includes(value));
}

function exactAny(text, values = []) {
  return values.includes(text);
}

function hasWord(text, word) {
  return (` ${text} `).includes(` ${word} `);
}

function withNote(text) {
  return `${text}${BOT_NOTE}`;
}

function cleanupContext(userId) {
  const ctx = userContexts.get(userId);

  if (!ctx) return null;

  if (Date.now() - ctx.lastTimestamp > CONTEXT_TTL) {
    userContexts.delete(userId);
    return null;
  }

  return ctx;
}

function saveContext(userId, intent, question) {
  if (!userId || !intent) return;

  userContexts.set(userId, {
    lastIntent: intent,
    lastQuestion: question,
    lastTimestamp: Date.now(),
  });
}

// =====================================================
// SHORT MESSAGE RECOGNITION
// =====================================================

function detectGreeting(text, compactText) {
  if (
    exactAny(text, [
      "gm",
      "g m",
      "good morning",
      "morning",
      "hello",
      "hi",
      "hey",
      "hey bro",
      "yo",
      "yo bro",
      "sup",
      "wassup",
      "what’s up",
      "whats up",
      "evening",
      "good evening",
      "good night",
      "gn",
    ])
  ) {
    return true;
  }

  if (
    exactAny(compactText, [
      "gm",
      "gn",
      "hi",
      "hey",
      "yo",
      "sup",
    ])
  ) {
    return true;
  }

  return includesAny(text, [
    "good morning",
    "good evening",
    "good night",
  ]);
}

function detectSimpleSocialReply(text, compactText) {
  if (
    exactAny(compactText, [
      "ok",
      "okay",
      "k",
      "cool",
      "nice",
      "solid",
      "definitely",
      "agreed",
      "true",
      "exactly",
      "awesome",
      "great",
      "thanks",
      "thx",
      "appreciateit",
      "cheers",
      "lol",
      "lmao",
      "wow",
    ])
  ) {
    return true;
  }

  return false;
}

// =====================================================
// SMART CLASSIFIER
// =====================================================

function classifyQuestion(message, userId) {
  const text = normalize(message);
  const compactText = compact(message);

  const previous = cleanupContext(userId);
  const previousIntent = previous?.lastIntent || null;

  // ---------------------------------------------------
  // 1. Greetings
  // ---------------------------------------------------

  if (detectGreeting(text, compactText)) {
    return "greeting";
  }

  // ---------------------------------------------------
  // 2. Very short social replies
  // ---------------------------------------------------

  if (detectSimpleSocialReply(text, compactText)) {
    return "social_reply";
  }

  // ---------------------------------------------------
  // 3. Direct contract / CA
  // ---------------------------------------------------

  if (
    exactAny(compactText, [
      "ca",
      "c a",
      "contract",
      "contractaddress",
      "tokenaddress",
      "address",
      "bscscan",
    ]) ||
    includesAny(text, [
      "contract address",
      "token address",
      "smart contract",
      "where is the contract",
      "whats the ca",
      "what is the ca",
      "ca?",
    ])
  ) {
    return "contract";
  }

  // ---------------------------------------------------
  // 4. Supply
  // ---------------------------------------------------

  if (
    exactAny(compactText, [
      "supply",
      "max",
      "maxsupply",
      "total",
      "1b",
      "1bn",
      "1billion",
    ]) ||
    includesAny(text, [
      "max supply",
      "maximum supply",
      "total supply",
      "how many tokens",
      "how much supply",
      "token supply",
      "how many nuix",
    ])
  ) {
    return "supply";
  }

  // ---------------------------------------------------
  // 5. Allocation / tokenomics
  // ---------------------------------------------------

  if (
    exactAny(compactText, [
      "tokenomics",
      "allocation",
      "distribution",
      "allocations",
      "liq",
      "liquidity",
    ]) ||
    includesAny(text, [
      "how is the supply allocated",
      "how is supply distributed",
      "token distribution",
      "token allocation",
      "community allocation",
      "liquidity allocation",
      "marketing allocation",
      "treasury allocation",
      "founder allocation",
      "team allocation",
    ])
  ) {
    return "allocation";
  }

  // ---------------------------------------------------
  // 6. Launch / trading / buying
  // ---------------------------------------------------

  if (
    exactAny(compactText, [
      "wen",
      "when",
      "launch",
      "launched",
      "live",
      "buy",
      "buying",
      "trade",
      "trading",
      "listing",
      "listed",
    ]) ||
    includesAny(text, [
      "when launch",
      "wen launch",
      "when is launch",
      "launch date",
      "already launched",
      "is it live",
      "live yet",
      "trading live",
      "is trading live",
      "can i buy",
      "where can i buy",
      "where to buy",
      "how to buy",
      "can we trade",
      "when can we buy",
      "when can i buy",
    ])
  ) {
    return "launch";
  }

  // ---------------------------------------------------
  // 7. Liquidity / LP
  // ---------------------------------------------------

  if (
    exactAny(compactText, [
      "lp",
      "liq",
      "liquidity",
      "pool",
      "pair",
      "liquiditypool",
    ]) ||
    includesAny(text, [
      "liquidity pool",
      "dex liquidity",
      "liquidity live",
      "is lp live",
      "is liquidity live",
      "where is liquidity",
    ])
  ) {
    return "liquidity";
  }

  // ---------------------------------------------------
  // 8. Rewards / Airdrop
  // ---------------------------------------------------

  if (
    exactAny(compactText, [
      "airdrop",
      "airdrop?",
      "reward",
      "rewards",
      "giveaway",
      "free",
      "claim",
      "claims",
    ]) ||
    includesAny(text, [
      "any airdrop",
      "is there an airdrop",
      "what about rewards",
      "community rewards",
      "how much rewards",
      "how much is the airdrop",
      "free tokens",
      "can i claim",
    ])
  ) {
    return "rewards";
  }

  // ---------------------------------------------------
  // 9. Roadmap / plans
  // ---------------------------------------------------

  if (
    exactAny(compactText, [
      "roadmap",
      "road",
      "plans",
      "plan",
      "future",
      "next",
      "whatsnext",
      "whatnext",
    ]) ||
    includesAny(text, [
      "future plans",
      "what's next",
      "whats next",
      "next steps",
      "project plans",
      "what are the plans",
      "public roadmap",
    ])
  ) {
    return "roadmap";
  }

  // ---------------------------------------------------
  // 10. Story / meaning
  // ---------------------------------------------------

  if (
    exactAny(compactText, [
      "story",
      "meaning",
      "name",
      "whyn uix",
      "why nuix",
    ]) ||
    includesAny(text, [
      "why nuix",
      "why the name",
      "what does nuix mean",
      "meaning of nuix",
      "what do the letters mean",
      "story of nuix",
    ])
  ) {
    return "story";
  }

  // ---------------------------------------------------
  // 11. Security / audit
  // ---------------------------------------------------

  if (
    exactAny(compactText, [
      "audit",
      "audited",
      "security",
      "safe",
      "safety",
      "vuln",
      "vulnerabilities",
    ]) ||
    includesAny(text, [
      "is it audited",
      "is nuix audited",
      "security review",
      "smart contract security",
      "any vulnerabilities",
      "critical findings",
      "high risk findings",
      "is the contract safe",
    ])
  ) {
    return "security";
  }

  // ---------------------------------------------------
  // 12. Founder / team / dev
  // ---------------------------------------------------

  if (
    exactAny(compactText, [
      "dev",
      "developer",
      "team",
      "founder",
      "owner",
      "who",
    ]) ||
    includesAny(text, [
      "who is the dev",
      "who built nuix",
      "who created nuix",
      "who is behind nuix",
      "who is the founder",
      "is this the dev",
      "are you the dev",
    ])
  ) {
    return "founder";
  }

  // ---------------------------------------------------
  // 13. Team vesting / lock
  // ---------------------------------------------------

  if (
    exactAny(compactText, [
      "vesting",
      "vest",
      "cliff",
      "teamlock",
      "lockedteam",
    ]) ||
    includesAny(text, [
      "team vesting",
      "team tokens locked",
      "team allocation locked",
      "when do team tokens vest",
      "what is the vesting",
      "how long is the vesting",
    ])
  ) {
    return "vesting";
  }

  // ---------------------------------------------------
  // 14. Network / chain
  // ---------------------------------------------------

  if (
    exactAny(compactText, [
      "bnb",
      "bsc",
      "chain",
      "network",
      "bep20",
      "bep-20",
      "decimals",
      "18decimals",
    ]) ||
    includesAny(text, [
      "what chain",
      "which chain",
      "what network",
      "what blockchain",
      "is it bsc",
      "is it bnb",
      "what standard",
    ])
  ) {
    return "network";
  }

  // ---------------------------------------------------
  // 15. Price / MC
  // ---------------------------------------------------

  if (
    exactAny(compactText, [
      "price",
      "mc",
      "marketcap",
      "cap",
      "value",
      "worth",
    ]) ||
    includesAny(text, [
      "current price",
      "token price",
      "what is the price",
      "how much is nuix",
      "market cap",
      "starting price",
      "launch price",
    ])
  ) {
    return "price";
  }

  // ---------------------------------------------------
  // 16. Official links / contact
  // ---------------------------------------------------

  if (
    exactAny(compactText, [
      "tg",
      "telegram",
      "x",
      "twitter",
      "website",
      "site",
      "socials",
      "social",
      "email",
      "support",
      "contact",
    ]) ||
    includesAny(text, [
      "telegram link",
      "tg link",
      "x link",
      "twitter link",
      "official links",
      "official socials",
      "how to contact",
      "support email",
      "contact team",
    ])
  ) {
    return "socials";
  }

  // ---------------------------------------------------
  // 17. Follow-up context
  // ---------------------------------------------------

  // Example:
  // User: "Airdrop?"
  // Bot: ...
  // User: "How much?"
  //
  // Since "how much" is too vague alone,
  // use previous intent when it exists.

  if (
    previousIntent &&
    includesAny(text, [
      "how much",
      "how many",
      "when",
      "what about it",
      "more",
      "details",
      "how",
      "and what about that",
      "what about that",
    ])
  ) {
    return previousIntent;
  }

  // More examples:
  // User: "launch?"
  // User: "so when?"
  //
  // "so when" can use context.
  if (
    previousIntent &&
    includesAny(text, [
      "so when",
      "then when",
      "and when",
      "what now",
      "next?",
    ])
  ) {
    return previousIntent;
  }

  return "unknown";
}

// =====================================================
// RESPONSE BUILDER
// =====================================================

function responseForIntent(intent) {
  switch (intent) {
    case "greeting":
      return {
        text: "GM bro 👊 Welcome to NUIX. 👀🖤",
        note: false,
      };

    case "social_reply":
      return {
        text: "Appreciate it, bro. 👊🖤",
        note: false,
      };

    case "contract":
      return {
        text:
`🔎 Official NUIX Contract

${NUIX.contract}

BscScan:
${NUIX.bscscan}`,
        note: true,
      };

    case "supply":
      return {
        text:
`💰 NUIX Maximum Supply

${NUIX.supply}

Decimals: ${NUIX.decimals}`,
        note: true,
      };

    case "allocation":
      return {
        text:
`📊 NUIX Token Allocation

💧 Liquidity — ${NUIX.allocation.liquidity.amount} (${NUIX.allocation.liquidity.percent})
👥 Community — ${NUIX.allocation.community.amount} (${NUIX.allocation.community.percent})
📣 Marketing — ${NUIX.allocation.marketing.amount} (${NUIX.allocation.marketing.percent})
🏦 Treasury — ${NUIX.allocation.treasury.amount} (${NUIX.allocation.treasury.percent})
👤 Founder — ${NUIX.allocation.founder.amount} (${NUIX.allocation.founder.percent})
🔒 Team Vesting — ${NUIX.allocation.team.amount} (${NUIX.allocation.team.percent})`,
        note: true,
      };

    case "launch":
      return {
        text:
`🚀 NUIX is currently PRE-LAUNCH.

The token contract is already deployed on BNB Smart Chain, but DEX liquidity and trading are not live yet.

No official launch date has been announced.`,
        note: true,
      };

    case "liquidity":
      return {
        text:
`💧 DEX liquidity is not live yet.

NUIX is currently in the pre-launch phase.

55% of the maximum supply is allocated for liquidity and market infrastructure.`,
        note: true,
      };

    case "rewards":
      return {
        text:
`🎁 Early community rewards are being prepared.

The allocation, eligibility, requirements, and distribution details have not been officially announced yet.`,
        note: true,
      };

    case "roadmap":
      return {
        text:
`🗺 NUIX Roadmap

1️⃣ Foundation
2️⃣ Market Infrastructure
3️⃣ Ecosystem Growth
4️⃣ Long-Term Development

Roadmap items are development intentions, not guaranteed dates or outcomes.`,
        note: true,
      };

    case "story":
      return {
        text:
`📖 The Story of NUIX

N — New
A new chapter in digital assets.

U — Unity
A community connected by a shared vision.

I — Innovation
Exploring new possibilities through technology.

X — The Unknown
The future is not written.`,
        note: true,
      };

    case "security":
      return {
        text:
`🔐 NUIX Security Review

A technical security review was performed on the NUIXCOIN token and team vesting contracts.

✅ No Critical findings identified
✅ No High severity findings identified

Solidity: ${NUIX.security.solidity}
Framework: ${NUIX.security.framework}

This is not an independent third-party audit or a guarantee that the contracts are completely free from vulnerabilities.`,
        note: true,
      };

    case "founder":
      return {
        text:
`👤 NUIX is currently a founder-led project.

Founder: Hicham

The founder is responsible for overall project direction, coordination, ecosystem development, and strategic decisions.`,
        note: true,
      };

    case "vesting":
      return {
        text:
`🔒 Team Vesting

Allocation: ${NUIX.vesting.allocation}

Days 0–90:
0% vested

Days 90–180:
Linear vesting

Day 180:
100% vested

Vesting Contract:
${NUIX.vestingContract}`,
        note: true,
      };

    case "network":
      return {
        text:
`⛓ NUIX Network

BNB Smart Chain
Standard: BEP-20
Decimals: 18`,
        note: true,
      };

    case "price":
      return {
        text:
`💰 NUIX is not trading yet.

There is no official market price while DEX trading is not live.

NUIX does not guarantee future price performance.`,
        note: true,
      };

    case "socials":
      return {
        text:
`🔗 Official NUIX Channels

🌐 Website:
${NUIX.website}

🐦 X:
${NUIX.x}

💬 Telegram:
${NUIX.telegram}

📩 Support:
${NUIX.support}

🕐 Support:
24/7`,
        note: true,
      };

    case "unknown":
    default:
      return {
        text:
`🤖 I’m not sure what you mean.

Try: launch, contract, supply, liquidity, rewards, roadmap, security, vesting, or socials.`,
        note: false,
      };
  }
}

// =====================================================
// SEND SMART RESPONSE
// =====================================================

async function smartReply(ctx, userId, message) {
  const intent = classifyQuestion(message, userId);

  saveContext(userId, intent, message);

  const response = responseForIntent(intent);

  const finalText = response.note
    ? withNote(response.text)
    : response.text;

  await ctx.reply(finalText);
}

// =====================================================
// /START
// =====================================================

bot.start(async (ctx) => {
  await ctx.reply(
`👋 Welcome to NUIXCOIN!

You’ve just joined the early community. 👀

NUIXCOIN ($NUIX) is a community-driven meme coin built on BNB Smart Chain.

🚀 Status: Pre-Launch
💰 Max Supply: ${NUIX.supply}

🎁 Early community rewards are being prepared.

You can ask the bot questions naturally, or use the buttons below. 👇`,
    mainMenu
  );
});

// =====================================================
// BUTTON: INFO
// =====================================================

bot.action("info", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
`🪙 NUIXCOIN ($NUIX)

Network: ${NUIX.network}
Standard: ${NUIX.standard}
Decimals: ${NUIX.decimals}

Maximum Supply:
${NUIX.supply}

✅ Fixed Supply
✅ No Post-Deployment Minting
✅ No Tax
✅ No Blacklist
✅ No Pause
✅ No Upgradeability`,
    Markup.inlineKeyboard([
      [Markup.button.url("🌐 Website", NUIX.website)],
      [Markup.button.callback("⬅️ Back", "home")],
    ])
  );
});

// =====================================================
// BUTTON: CONTRACT
// =====================================================

bot.action("contract", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
`🔎 Official NUIX Contract

${NUIX.contract}`,
    Markup.inlineKeyboard([
      [Markup.button.url("🔎 View on BscScan", NUIX.bscscan)],
      [Markup.button.callback("⬅️ Back", "home")],
    ])
  );
});

// =====================================================
// BUTTON: STATUS
// =====================================================

bot.action("status", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
`🚀 NUIX STATUS

${NUIX.status.preLaunch
  ? "NUIX is currently in the pre-launch phase."
  : "NUIX is no longer in the pre-launch phase."}

Trading:
${NUIX.status.tradingLive ? "Live ✅" : "Not live yet"}

DEX Liquidity:
${NUIX.status.dexLiquidityLive ? "Live ✅" : "Not live yet"}

Launch date:
${NUIX.status.launchDateAnnounced ? "Announced" : "Not announced yet"}`,
    Markup.inlineKeyboard([
      [Markup.button.url("🌐 Website", NUIX.website)],
      [Markup.button.callback("⬅️ Back", "home")],
    ])
  );
});

// =====================================================
// BUTTON: REWARDS
// =====================================================

bot.action("rewards", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
`🎁 NUIX COMMUNITY REWARDS

${NUIX.rewards}`,
    Markup.inlineKeyboard([
      [Markup.button.callback("⬅️ Back", "home")],
    ])
  );
});

// =====================================================
// BUTTON: ROADMAP
// =====================================================

bot.action("roadmap", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
`🗺 NUIX ROADMAP

1️⃣ Foundation
${NUIX.roadmap.phase1}

2️⃣ Market Infrastructure
${NUIX.roadmap.phase2}

3️⃣ Ecosystem Growth
${NUIX.roadmap.phase3}

4️⃣ Long-Term Development
${NUIX.roadmap.phase4}`,
    Markup.inlineKeyboard([
      [Markup.button.url("🌐 Website", NUIX.website)],
      [Markup.button.callback("⬅️ Back", "home")],
    ])
  );
});

// =====================================================
// BUTTON: LINKS
// =====================================================

bot.action("links", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
`🔗 Official NUIX Channels

🌐 Website
${NUIX.website}

🐦 X
${NUIX.x}

💬 Telegram
${NUIX.telegram}

📩 Support
${NUIX.support}

🕐 Support: 24/7`,
    Markup.inlineKeyboard([
      [Markup.button.url("🌐 Website", NUIX.website)],
      [Markup.button.url("🐦 X", NUIX.x)],
      [Markup.button.url("🔎 BscScan", NUIX.bscscan)],
      [Markup.button.callback("⬅️ Back", "home")],
    ])
  );
});

// =====================================================
// BUTTON: HOME
// =====================================================

bot.action("home", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
`👋 Welcome to NUIXCOIN!

You’re early. 👀

🚀 Status: Pre-Launch
💰 Max Supply: ${NUIX.supply}

Choose an option below. 👇`,
    mainMenu
  );
});

// =====================================================
// DIRECT COMMANDS
// =====================================================

bot.command("info", async (ctx) => {
  await ctx.reply(
`🪙 NUIXCOIN ($NUIX)

Network: ${NUIX.network}
Standard: ${NUIX.standard}
Decimals: ${NUIX.decimals}
Max Supply: ${NUIX.supply}`
  );
});

bot.command("contract", async (ctx) => {
  await ctx.reply(
`🔎 Official NUIX Contract

${NUIX.contract}

BscScan:
${NUIX.bscscan}`
  );
});

bot.command("status", async (ctx) => {
  await ctx.reply(
`🚀 NUIX is currently in the pre-launch phase.

Trading and DEX liquidity are not live yet.

No official launch date has been announced.`
  );
});

bot.command("rewards", async (ctx) => {
  await ctx.reply(
`🎁 Early community rewards are being prepared.

Official allocation and distribution details have not been announced yet.`
  );
});

bot.command("roadmap", async (ctx) => {
  await ctx.reply(
`🗺 NUIX Roadmap

1️⃣ Foundation
2️⃣ Market Infrastructure
3️⃣ Ecosystem Growth
4️⃣ Long-Term Development`
  );
});

bot.command("links", async (ctx) => {
  await ctx.reply(
`🔗 Official NUIX Links

🌐 ${NUIX.website}
🐦 ${NUIX.x}
💬 ${NUIX.telegram}
📩 ${NUIX.support}`
  );
});

bot.help(async (ctx) => {
  await ctx.reply(
`🤖 NUIX Community Bot

You can ask naturally about:

• NUIX
• Supply
• Contract
• Launch
• Liquidity
• Rewards
• Roadmap
• Security
• Vesting
• Founder
• Network
• Official links

Commands:
/start
/info
/contract
/status
/rewards
/roadmap
/links`
  );
});

// =====================================================
// WELCOME NEW MEMBERS
// =====================================================

bot.on("new_chat_members", async (ctx) => {
  for (const member of ctx.message.new_chat_members) {
    if (member.is_bot) continue;

    const firstName = member.first_name || "there";
    const userId = member.id;

    const previousGreeting = greetingHistory.get(userId);

    // Avoid repeated greeting spam.
    if (
      previousGreeting &&
      Date.now() - previousGreeting < GREETING_COOLDOWN
    ) {
      continue;
    }

    greetingHistory.set(userId, Date.now());

    await ctx.reply(
`👋 Welcome, ${firstName}!

Glad to have you in the NUIX community. 🖤

You’re early. 👀

Ask me anything about NUIX or use the buttons below.`,
      mainMenu
    );
  }
});

// =====================================================
// NORMAL TEXT MESSAGES
// =====================================================

// IMPORTANT:
// Commands are handled before this handler.
// This catches normal group messages.
bot.on("text", async (ctx) => {
  try {
    const message = ctx.message?.text?.trim();

    if (!message) return;

    // Ignore commands here.
    if (message.startsWith("/")) return;

    const userId = ctx.from?.id;

    if (!userId) return;

    await smartReply(ctx, userId, message);
  } catch (error) {
    console.error("❌ Message handling error:", error);
  }
});

// =====================================================
// ERROR HANDLER
// =====================================================

bot.catch((err) => {
  console.error("❌ Bot error:", err);
});

// =====================================================
// START
// =====================================================

bot.launch();

console.log("✅ NUIX Community Bot is running...");
console.log("🧠 Natural language mode: ON");
console.log("💾 Context memory: ON");
console.log("🔌 External AI/API: NONE");

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));