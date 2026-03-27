const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_GENDERS = new Set(["MALE", "FEMALE", "OTHER"]);

function normalizeRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalString(value) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidEmail(value) {
  return EMAIL_REGEX.test(normalizeRequiredString(value));
}

function isValidGender(value) {
  return value == null || value === "" || VALID_GENDERS.has(value);
}

module.exports = {
  isValidEmail,
  isValidGender,
  normalizeOptionalString,
  normalizeRequiredString,
};
