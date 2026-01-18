import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

/**
 * Parse transactions from PDF text
 * Attempts to detect common bank statement formats
 */
export function parseTransactionsFromPDF(text) {
  const transactions = [];
  const lines = text.split("\n").filter((line) => line.trim());

  // Common date patterns
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
    /(\d{4}-\d{2}-\d{2})/, // YYYY-MM-DD
    /(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i, // DD MMM YYYY
  ];

  // Amount patterns (negative or with minus/debit indicators)
  const amountPatterns = [
    /-?\$?€?[\d,]+\.\d{2}/, // -$1,234.56 or €1,234.56
    /[\d,]+\.\d{2}-/, // 1,234.56-
    /\([\d,]+\.\d{2}\)/, // (1,234.56)
  ];

  for (const line of lines) {
    // Try to find date
    let dateMatch = null;
    let date = null;

    for (const pattern of datePatterns) {
      dateMatch = line.match(pattern);
      if (dateMatch) {
        date = new Date(dateMatch[1]);
        if (!isNaN(date.getTime())) break;
      }
    }

    if (!date || isNaN(date.getTime())) continue;

    // Try to find amount
    let amountMatch = null;
    let amount = null;

    for (const pattern of amountPatterns) {
      amountMatch = line.match(pattern);
      if (amountMatch) {
        let amountStr = amountMatch[0]
          .replace(/[$€,]/g, "")
          .replace(/[()]/g, "")
          .replace(/-$/, "");

        amount = parseFloat(amountStr);

        // If amount is in parentheses or ends with -, make it negative
        if (/\(.*\)/.test(amountMatch[0]) || /-$/.test(amountMatch[0])) {
          amount = -Math.abs(amount);
        }

        // If pattern started with -, it's already negative
        if (amountMatch[0].startsWith("-")) {
          amount = -Math.abs(amount);
        }

        if (!isNaN(amount)) break;
      }
    }

    if (amount === null || isNaN(amount) || amount >= 0) continue;

    // Extract description (everything between date and amount)
    let description = line
      .replace(dateMatch[0], "")
      .replace(amountMatch[0], "")
      .trim();

    // Clean up description
    description = description
      .replace(/\s+/g, " ")
      .replace(/^[-\s]+|[-\s]+$/g, "")
      .substring(0, 100); // Limit length

    if (description.length > 3) {
      transactions.push({
        date,
        amount: Math.abs(amount),
        description,
        merchant: normalizeMerchant(description),
      });
    }
  }

  console.log(`📄 Extracted ${transactions.length} transactions from PDF`);
  return transactions;
}

/**
 * Normalize merchant names
 */
function normalizeMerchant(description) {
  let name = description
    .toUpperCase()
    .replace(
      /^(PAYMENT TO|DIRECT DEBIT|ACH|CARD PURCHASE|POS|WWW\.|HTTPS?:\/\/)/gi,
      "",
    )
    .replace(/\d{10,}/g, "")
    .replace(/[*#]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const brandPatterns = [
    /NETFLIX/i,
    /SPOTIFY/i,
    /AMAZON/i,
    /APPLE/i,
    /GOOGLE/i,
    /DISNEY/i,
    /HBO/i,
    /HULU/i,
    /ADOBE/i,
    /MICROSOFT/i,
    /DROPBOX/i,
    /LINKEDIN/i,
    /SLACK/i,
    /GITHUB/i,
    /ZOOM/i,
    /GYM|FITNESS|YOGA/i,
    /INSURANCE/i,
    /PHONE|MOBILE|TELECOM/i,
  ];

  for (const pattern of brandPatterns) {
    const match = name.match(pattern);
    if (match) {
      return match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase();
    }
  }

  const words = name.split(/\s+/).filter((w) => w.length > 2);
  return words[0] || name.substring(0, 20);
}
