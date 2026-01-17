/**
 * CSV Parser Service
 * Intelligently parses bank statement CSVs with automatic column detection
 */

export function parseCSV(csvText) {
  const lines = csvText
    .trim()
    .split("\n")
    .filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("CSV file is empty or invalid");
  }

  // Parse headers
  const headers = parseCSVLine(lines[0]).map((h) =>
    h.trim().toLowerCase().replace(/['"]/g, "")
  );

  console.log("📊 CSV Headers detected:", headers);

  // Smart column detection
  const columnMap = detectColumns(headers);

  console.log("📍 Column mapping:", columnMap);

  if (
    columnMap.date === null ||
    columnMap.amount === null ||
    columnMap.description === null
  ) {
    console.error("❌ Column detection failed!");
    console.error("Headers found:", headers);
    console.error("Mapping result:", columnMap);
    throw new Error(
      `Could not detect required columns. Found headers: ${headers.join(", ")}`
    );
  }

  // Parse transaction rows
  const transactions = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);

      if (
        values.length <=
        Math.max(columnMap.date, columnMap.amount, columnMap.description)
      ) {
        console.warn(`Skipping row ${i}: insufficient columns`);
        continue;
      }

      const amountStr = values[columnMap.amount].replace(/[^0-9.-]/g, "");
      const amount = parseFloat(amountStr);

      // Skip invalid or positive amounts (we want outgoing transactions)
      if (isNaN(amount) || amount >= 0) {
        console.warn(`Skipping row ${i}: invalid amount (${amount})`);
        continue;
      }

      const dateStr = values[columnMap.date].trim();
      const date = parseDate(dateStr);

      if (!date || isNaN(date.getTime())) {
        console.warn(`Skipping row ${i}: invalid date (${dateStr})`);
        continue;
      }

      transactions.push({
        date,
        amount: Math.abs(amount),
        description: values[columnMap.description].trim(),
        merchant: normalizeMerchant(values[columnMap.description]),
      });
    } catch (err) {
      console.warn(`Skipping row ${i}: ${err.message}`);
    }
  }

  console.log(`✅ Successfully parsed ${transactions.length} transactions`);

  // Sort by date ascending
  transactions.sort((a, b) => a.date - b.date);

  return transactions;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current); // Add last value
  return values.map((v) => v.trim().replace(/^"|"$/g, ""));
}

/**
 * Detect column indices from headers
 */
function detectColumns(headers) {
  const map = { date: null, amount: null, description: null };

  headers.forEach((header, index) => {
    // Date column detection
    if (/date|time|timestamp|posted/i.test(header)) {
      if (map.date === null) map.date = index;
    }

    // Amount column detection
    if (
      /amount|debit|credit|value|sum|total/i.test(header) &&
      !/balance/i.test(header)
    ) {
      if (map.amount === null) map.amount = index;
    }

    // Description column detection
    if (/description|merchant|name|payee|details|memo/i.test(header)) {
      if (map.description === null) map.description = index;
    }
  });

  return map;
}

/**
 * Parse various date formats
 */
function parseDate(dateStr) {
  // Try standard formats
  let date = new Date(dateStr);

  if (isNaN(date.getTime())) {
    // Try DD/MM/YYYY or MM/DD/YYYY
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      // Try DD/MM/YYYY
      date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);

      if (isNaN(date.getTime())) {
        // Try MM/DD/YYYY
        date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
      }
    }
  }

  return date;
}

/**
 * Normalize merchant names by removing payment processor info
 */
function normalizeMerchant(description) {
  let name = description
    .toUpperCase()
    // Remove common prefixes
    .replace(
      /^(PAYMENT TO|DIRECT DEBIT|ACH|CARD PURCHASE|POS|WWW\.|HTTPS?:\/\/)/gi,
      ""
    )
    // Remove long numbers (transaction IDs)
    .replace(/\d{10,}/g, "")
    // Remove special characters
    .replace(/[*#]/g, "")
    // Remove extra whitespace
    .replace(/\s+/g, " ")
    .trim();

  // Extract known brand patterns
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
    /PHONE|MOBILE|TELECOM|VERIZON|AT&T/i,
  ];

  for (const pattern of brandPatterns) {
    const match = name.match(pattern);
    if (match) {
      return match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase();
    }
  }

  // Take first meaningful word (at least 3 chars)
  const words = name.split(/\s+/).filter((w) => w.length > 2);
  return words[0] || name.substring(0, 20);
}
