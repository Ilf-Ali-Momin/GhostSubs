import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Extract text from PDF buffer using pdfjs-dist
 */
export async function extractTextFromPDF(buffer) {
  try {
    const loadingTask = getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const pageText = textContent.items.map((item) => item.str).join(" ");

      fullText += pageText + "\n";
    }

    console.log(
      `📄 Extracted ${fullText.length} characters from ${pdf.numPages} pages`,
    );
    return fullText;
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

/**
 * Parse transactions from PDF text
 * Optimized for bank statement format: Date Description $-Amount Balance
 */
export function parseTransactionsFromPDF(text) {
  const transactions = [];
  const lines = text.split("\n").filter((line) => line.trim());

  console.log(`📄 Processing ${lines.length} lines from PDF`);

  // Date patterns - Updated for YYYY-MM-DD format
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2})/, // 2025-10-20 (YOUR FORMAT!)
    /(\d{1,2}\/\d{1,2}\/\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
    /(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i, // DD MMM YYYY
  ];

  // Amount patterns - Updated for $-19.99 format (YOUR FORMAT!)
  const amountPatterns = [
    /\$-[\d,]+\.\d{2}/, // $-19.99 (EXACT MATCH!)
    /-\$[\d,]+\.\d{2}/, // -$19.99
    /\$[\d,]+\.\d{2}-/, // $19.99-
    /€-[\d,]+\.\d{2}/, // €-19.99
    /-€[\d,]+\.\d{2}/, // -€19.99
    /£-[\d,]+\.\d{2}/, // £-19.99
    /-£[\d,]+\.\d{2}/, // -£19.99
    /\([\$€£]?[\d,]+\.\d{2}\)/, // ($19.99)
  ];

  for (const line of lines) {
    // Skip header lines and very short lines
    if (
      line.includes("Date Description") ||
      line.includes("Account Statement") ||
      line.trim().length < 15
    ) {
      continue;
    }

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
        // Extract just the number, remove all symbols
        let amountStr = amountMatch[0].replace(/[$€£,\s()-]/g, "");

        amount = parseFloat(amountStr);

        if (!isNaN(amount) && amount > 0) {
          // Make it negative (it's an expense)
          amount = -amount;
          break;
        }
      }
    }

    if (amount === null || isNaN(amount) || amount >= 0) continue;

    // Extract description (text between date and amount)
    let description = line;

    if (dateMatch) {
      description = description.replace(dateMatch[0], "");
    }
    if (amountMatch) {
      description = description.replace(amountMatch[0], "");
    }

    // Also remove the balance amount (last number on line)
    description = description
      .replace(/\$[\d,]+\.\d{2}$/, "")
      .replace(/€[\d,]+\.\d{2}$/, "")
      .replace(/£[\d,]+\.\d{2}$/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (description.length > 2) {
      transactions.push({
        date,
        amount: Math.abs(amount),
        description,
        merchant: normalizeMerchant(description),
      });

      console.log(
        `✅ Found: ${date.toISOString().split("T")[0]} | ${description} | $${Math.abs(amount)}`,
      );
    }
  }

  console.log(`✅ Extracted ${transactions.length} transactions from PDF`);

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
    /CHATGPT/i,
    /OPENAI/i,
    /CANVA/i,
    /YOUTUBE/i,
    /GYM|FITNESS|YOGA/i,
    /INSURANCE/i,
    /PHONE|MOBILE|TELECOM/i,
    /STARBUCKS/i,
    /SHELL/i,
    /LANDLORD|RENT/i,
    /UTILITY|UTILITIES/i,
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
