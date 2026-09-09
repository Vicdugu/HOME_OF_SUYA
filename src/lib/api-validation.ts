/**
 * API Request Validation Schema
 * Defines validation rules for all API endpoints
 * Prevents invalid requests and ensures data consistency
 */

import { sanitizeString, sanitizeEmail, sanitizeInteger, sanitizePhoneNumber } from "@/lib/input-validation";

export interface ValidationRule {
  type: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedValues?: any[];
  custom?: (value: any) => boolean;
}

/**
 * Validate request body against schema
 */
export function validateRequestBody(
  body: any,
  schema: Record<string, ValidationRule>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(schema)) {
    const value = body[field];

    // Check required field
    if (rule.required && (value === undefined || value === null || value === "")) {
      errors[field] = `${field} is required`;
      continue;
    }

    if (!rule.required && !value) {
      continue; // Skip validation for optional empty fields
    }

    // Type validation
    switch (rule.type) {
      case "string":
        if (typeof value !== "string") {
          errors[field] = `${field} must be a string`;
          continue;
        }
        if (rule.minLength && value.length < rule.minLength) {
          errors[field] = `${field} must be at least ${rule.minLength} characters`;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors[field] = `${field} must be at most ${rule.maxLength} characters`;
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors[field] = `${field} format is invalid`;
        }
        break;

      case "email":
        if (!sanitizeEmail(value)) {
          errors[field] = `${field} must be a valid email`;
        }
        break;

      case "number":
        if (typeof value !== "number" || isNaN(value)) {
          errors[field] = `${field} must be a number`;
          continue;
        }
        if (rule.min !== undefined && value < rule.min) {
          errors[field] = `${field} must be at least ${rule.min}`;
        }
        if (rule.max !== undefined && value > rule.max) {
          errors[field] = `${field} must be at most ${rule.max}`;
        }
        break;

      case "integer":
        if (!Number.isInteger(value)) {
          errors[field] = `${field} must be an integer`;
          continue;
        }
        if (rule.min !== undefined && value < rule.min) {
          errors[field] = `${field} must be at least ${rule.min}`;
        }
        if (rule.max !== undefined && value > rule.max) {
          errors[field] = `${field} must be at most ${rule.max}`;
        }
        break;

      case "boolean":
        if (typeof value !== "boolean") {
          errors[field] = `${field} must be a boolean`;
        }
        break;

      case "enum":
        if (rule.allowedValues && !rule.allowedValues.includes(value)) {
          errors[field] = `${field} must be one of: ${rule.allowedValues.join(", ")}`;
        }
        break;

      case "array":
        if (!Array.isArray(value)) {
          errors[field] = `${field} must be an array`;
          continue;
        }
        if (rule.minLength && value.length < rule.minLength) {
          errors[field] = `${field} must have at least ${rule.minLength} items`;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors[field] = `${field} must have at most ${rule.maxLength} items`;
        }
        break;

      case "date":
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors[field] = `${field} must be a valid date`;
        }
        break;

      case "phone":
        if (!sanitizePhoneNumber(value)) {
          errors[field] = `${field} must be a valid phone number`;
        }
        break;
    }

    // Custom validation
    if (rule.custom && !errors[field]) {
      const isValid = rule.custom(value);
      if (!isValid) {
        errors[field] = `${field} validation failed`;
      }
    }

    // Allowed values check
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      errors[field] = `${field} contains invalid value`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Common validation schemas for API endpoints
 */
export const validationSchemas = {
  // Authentication schemas
  login: {
    email: { type: "email", required: true },
    password: { type: "string", required: true, minLength: 8, maxLength: 128 },
  },

  register: {
    email: { type: "email", required: true },
    password: { type: "string", required: true, minLength: 8, maxLength: 128 },
    confirmPassword: { type: "string", required: true },
  },

  resetPassword: {
    token: { type: "string", required: true, minLength: 10 },
    password: { type: "string", required: true, minLength: 8, maxLength: 128 },
    confirmPassword: { type: "string", required: true },
  },

  // Meal schemas
  createMeal: {
    name: { type: "string", required: true, minLength: 2, maxLength: 200 },
    description: { type: "string", maxLength: 2000 },
    price: { type: "number", required: true, min: 0, max: 10000 },
    servings: { type: "integer", required: true, min: 1, max: 1000 },
    category: { type: "string", required: true, maxLength: 100 },
  },

  updateMeal: {
    name: { type: "string", minLength: 2, maxLength: 200 },
    description: { type: "string", maxLength: 2000 },
    price: { type: "number", min: 0, max: 10000 },
    servings: { type: "integer", min: 1, max: 1000 },
  },

  // Booking schemas
  createBooking: {
    mealId: { type: "string", required: true },
    quantity: { type: "integer", required: true, min: 1, max: 1000 },
    deliveryDate: { type: "date", required: true },
    deliveryTime: { type: "string", required: true },
    firstName: { type: "string", required: true, minLength: 2, maxLength: 100 },
    lastName: { type: "string", required: true, minLength: 2, maxLength: 100 },
    email: { type: "email", required: true },
    phone: { type: "phone", required: true },
    address: { type: "string", required: true, minLength: 5, maxLength: 500 },
  },

  // Promo code schemas
  createPromoCode: {
    code: {
      type: "string",
      required: true,
      minLength: 3,
      maxLength: 50,
      pattern: /^[A-Z0-9_-]+$/,
    },
    discount: { type: "number", required: true, min: 0, max: 100 },
    discountType: { type: "enum", required: true, allowedValues: ["percentage", "fixed"] },
    maxUses: { type: "integer", required: true, min: 1 },
    expiryDate: { type: "date", required: true },
  },

  // Settings schemas
  updateSettings: {
    businessName: { type: "string", maxLength: 200 },
    businessEmail: { type: "email" },
    businessPhone: { type: "phone" },
    businessAddress: { type: "string", maxLength: 500 },
  },

  // Contact form schemas
  contactForm: {
    name: { type: "string", required: true, minLength: 2, maxLength: 200 },
    email: { type: "email", required: true },
    phone: { type: "phone", required: true },
    subject: { type: "string", required: true, minLength: 5, maxLength: 200 },
    message: { type: "string", required: true, minLength: 10, maxLength: 5000 },
  },

  // Catering enquiry schemas
  cateringEnquiry: {
    name: { type: "string", required: true, minLength: 2, maxLength: 200 },
    email: { type: "email", required: true },
    phone: { type: "phone", required: true },
    eventDate: { type: "date", required: true },
    guestCount: { type: "integer", required: true, min: 5, max: 10000 },
    eventType: { type: "string", required: true, maxLength: 100 },
    requirements: { type: "string", maxLength: 2000 },
  },
};

/**
 * Sanitize validated data
 */
export function sanitizeValidatedData(
  data: Record<string, any>,
  schema: Record<string, ValidationRule>
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [field, value] of Object.entries(data)) {
    if (!schema[field]) continue;

    const rule = schema[field];

    switch (rule.type) {
      case "string":
      case "email":
        sanitized[field] = sanitizeString(value, rule.maxLength);
        break;

      case "number":
        sanitized[field] = Number(value);
        break;

      case "integer":
        sanitized[field] = sanitizeInteger(value);
        break;

      case "boolean":
        sanitized[field] = Boolean(value);
        break;

      default:
        sanitized[field] = value;
    }
  }

  return sanitized;
}
