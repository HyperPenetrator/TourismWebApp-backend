/**
 * Simple safety validator for NER input.
 */

export function validateTextInput(text) {
  if (typeof text !== "string") {
    return { valid: false, error: "Input must be a string" };
  }

  if (text.length > 5000) {
    return { valid: false, error: "Text too long (max 5000 chars)" };
  }

  // Basic check for potentially harmful content (placeholders)
  const blockedKeywords = ["<script>", "javascript:", "eval("];
  for (const keyword of blockedKeywords) {
    if (text.toLowerCase().includes(keyword)) {
      return { valid: false, error: "Potential injection attack detected" };
    }
  }

  return { valid: true };
}

export function scrubPII(text) {
  // Simple PII scrubbing (emails, phone numbers)
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;

  return text.replace(emailRegex, "[EMAIL]").replace(phoneRegex, "[PHONE]");
}
