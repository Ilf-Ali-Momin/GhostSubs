/**
 * AI Enhancement Service
 * Uses Claude API to enhance merchant names and generate insights
 * Falls back to rule-based logic if API is unavailable
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const USE_AI = !!ANTHROPIC_API_KEY;

export async function enhanceWithAI(subscriptions) {
  if (USE_AI) {
    try {
      return await enhanceWithClaudeAPI(subscriptions);
    } catch (error) {
      console.warn(
        "AI enhancement failed, falling back to rule-based:",
        error.message
      );
      return enhanceWithRules(subscriptions);
    }
  } else {
    return enhanceWithRules(subscriptions);
  }
}

async function enhanceWithClaudeAPI(subscriptions) {
  const merchantList = subscriptions.map((s) => s.merchant).join(", ");

  const prompt = `You are analyzing subscription data. Given these merchant names: ${merchantList}

For each merchant, provide:
1. A clean, user-friendly display name
2. A category (Entertainment, Productivity, Health & Fitness, Finance, Telecom, Other)
3. A brief description (one sentence)

Respond ONLY with valid JSON in this exact format:
{
  "merchants": [
    {
      "original": "NETFLIX",
      "displayName": "Netflix",
      "category": "Entertainment",
      "description": "Video streaming service"
    }
  ]
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = await response.json();
  const aiText = data.content[0].text;

  const jsonMatch = aiText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response format");

  const aiData = JSON.parse(jsonMatch[0]);

  const enhancedSubs = subscriptions.map((sub) => {
    const aiInfo = aiData.merchants.find(
      (m) => m.original.toUpperCase() === sub.merchant.toUpperCase()
    );

    return {
      ...sub,
      displayName: aiInfo?.displayName || sub.merchant,
      category: aiInfo?.category || "Other",
      description: aiInfo?.description || "Recurring subscription service",
    };
  });

  const insight = await generateInsightWithAI(enhancedSubs);
  return createAnalysisResult(enhancedSubs, insight);
}

async function generateInsightWithAI(subscriptions) {
  const totalMonthly = subscriptions
    .filter((s) => s.frequency === "monthly")
    .reduce((sum, s) => sum + s.avgAmount, 0);

  const unusedCount = subscriptions.filter((s) => s.possiblyUnused).length;

  const prompt = `Analyze these subscription statistics and provide a brief, friendly insight (2-3 sentences):
- ${subscriptions.length} subscriptions detected
- €${totalMonthly.toFixed(2)}/month in monthly subscriptions
- ${unusedCount} potentially unused subscriptions

Write a conversational summary highlighting key findings and potential savings.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.content[0].text.trim();
}

function enhanceWithRules(subscriptions) {
  const enhancedSubs = subscriptions.map((sub) => ({
    ...sub,
    displayName: enhanceMerchantName(sub.merchant),
    category: categorizeSubscription(sub.merchant),
    description: getSubscriptionDescription(sub.merchant),
  }));

  const insight = generateInsightText(enhancedSubs);
  return createAnalysisResult(enhancedSubs, insight);
}

function createAnalysisResult(subscriptions, insight) {
  const totalMonthly = subscriptions
    .filter((s) => s.frequency === "monthly")
    .reduce((sum, s) => sum + s.avgAmount, 0);

  const totalYearly = subscriptions
    .filter((s) => s.frequency === "yearly")
    .reduce((sum, s) => sum + s.avgAmount, 0);

  const totalQuarterly = subscriptions
    .filter((s) => s.frequency === "quarterly")
    .reduce((sum, s) => sum + s.avgAmount * 4, 0);

  const unusedSubs = subscriptions.filter((s) => s.possiblyUnused);
  const potentialSavings = unusedSubs.reduce((sum, s) => {
    if (s.frequency === "monthly") return sum + s.avgAmount * 12;
    if (s.frequency === "quarterly") return sum + s.avgAmount * 4;
    return sum + s.avgAmount;
  }, 0);

  const totalAnnualCost = totalMonthly * 12 + totalYearly + totalQuarterly;

  return {
    subscriptions,
    insight,
    summary: {
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      totalYearly: Math.round(totalYearly * 100) / 100,
      totalQuarterly: Math.round(totalQuarterly * 100) / 100,
      totalAnnualCost: Math.round(totalAnnualCost * 100) / 100,
      potentialSavings: Math.round(potentialSavings * 100) / 100,
      subscriptionCount: subscriptions.length,
      unusedCount: unusedSubs.length,
    },
  };
}

function enhanceMerchantName(merchant) {
  const nameMap = {
    NETFLIX: "Netflix",
    SPOTIFY: "Spotify",
    AMAZON: "Amazon Prime",
    APPLE: "Apple Services",
    GOOGLE: "Google One",
    DISNEY: "Disney+",
    HBO: "HBO Max",
    HULU: "Hulu",
    ADOBE: "Adobe Creative Cloud",
    MICROSOFT: "Microsoft 365",
    DROPBOX: "Dropbox",
    LINKEDIN: "LinkedIn Premium",
    GYM: "Gym Membership",
    FITNESS: "Fitness Subscription",
    INSURANCE: "Insurance Premium",
    PHONE: "Phone Service",
    MOBILE: "Mobile Service",
  };

  const upper = merchant.toUpperCase();
  for (const [key, value] of Object.entries(nameMap)) {
    if (upper.includes(key)) return value;
  }

  return merchant.charAt(0).toUpperCase() + merchant.slice(1).toLowerCase();
}

function categorizeSubscription(merchant) {
  const m = merchant.toUpperCase();

  if (
    /NETFLIX|DISNEY|HBO|HULU|SPOTIFY|APPLE MUSIC|YOUTUBE|PRIME VIDEO/i.test(m)
  ) {
    return "Entertainment";
  }
  if (/GYM|FITNESS|YOGA|PELOTON|HEALTH/i.test(m)) {
    return "Health & Fitness";
  }
  if (/ADOBE|MICROSOFT|DROPBOX|GITHUB|SLACK|ZOOM|OFFICE/i.test(m)) {
    return "Productivity";
  }
  if (/INSURANCE|LIFE|HEALTH|AUTO/i.test(m)) {
    return "Insurance";
  }
  if (/PHONE|MOBILE|TELECOM|VERIZON|AT&T|T-MOBILE/i.test(m)) {
    return "Telecom";
  }
  if (/LINKEDIN|INDEED|CAREER/i.test(m)) {
    return "Professional";
  }

  return "Other";
}

function getSubscriptionDescription(merchant) {
  const descriptions = {
    NETFLIX: "Video streaming service",
    SPOTIFY: "Music streaming platform",
    AMAZON: "Prime membership with shopping and streaming",
    APPLE: "Apple services bundle",
    GOOGLE: "Cloud storage service",
    DISNEY: "Family entertainment streaming",
    HBO: "Premium video streaming",
    ADOBE: "Creative software suite",
    MICROSOFT: "Office productivity suite",
    GYM: "Fitness center membership",
    INSURANCE: "Insurance coverage",
    PHONE: "Telecommunications service",
  };

  const upper = merchant.toUpperCase();
  for (const [key, value] of Object.entries(descriptions)) {
    if (upper.includes(key)) return value;
  }

  return "Recurring subscription service";
}

function generateInsightText(subscriptions) {
  const totalMonthly = subscriptions
    .filter((s) => s.frequency === "monthly")
    .reduce((sum, s) => sum + s.avgAmount, 0);

  const totalYearly = subscriptions
    .filter((s) => s.frequency === "yearly")
    .reduce((sum, s) => sum + s.avgAmount, 0);

  const unusedSubs = subscriptions.filter((s) => s.possiblyUnused);
  const unusedCount = unusedSubs.length;

  const potentialSavings = unusedSubs.reduce((sum, s) => {
    return sum + (s.frequency === "monthly" ? s.avgAmount * 12 : s.avgAmount);
  }, 0);

  let text = `You're spending €${totalMonthly.toFixed(2)}/month on ${
    subscriptions.filter((s) => s.frequency === "monthly").length
  } monthly subscriptions`;

  if (totalYearly > 0) {
    text += ` and €${totalYearly.toFixed(2)}/year on annual plans`;
  }
  text += ". ";

  if (unusedCount > 0) {
    text += `${unusedCount} subscription${
      unusedCount > 1 ? "s appear" : " appears"
    } inactive. `;
    text += `Cancelling unused services could save you €${potentialSavings.toFixed(
      0
    )}/year. `;
  } else {
    text += "All subscriptions appear active. ";
  }

  const totalAnnual = totalMonthly * 12 + totalYearly;
  text += `Your total annual subscription cost is approximately €${totalAnnual.toFixed(
    0
  )}.`;

  return text;
}
