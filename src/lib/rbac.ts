/**
 * Role-Based Access Control (RBAC) System
 * Defines roles, permissions, and access control for admin operations
 * Roles: SUPER_ADMIN, ADMIN, MODERATOR
 */

export enum AdminRole {
  SUPER_ADMIN = "SUPER_ADMIN", // Full system access
  ADMIN = "ADMIN", // Full content access, limited user management
  MODERATOR = "MODERATOR", // Content review and moderation only
}

export enum Permission {
  // Admin Management
  VIEW_ADMINS = "view:admins",
  CREATE_ADMIN = "create:admin",
  EDIT_ADMIN = "edit:admin",
  DELETE_ADMIN = "delete:admin",
  UNLOCK_ADMIN = "unlock:admin",
  EDIT_ROLES = "edit:roles",

  // Meals Management
  VIEW_MEALS = "view:meals",
  CREATE_MEAL = "create:meal",
  EDIT_MEAL = "edit:meal",
  DELETE_MEAL = "delete:meal",
  UPLOAD_MEAL_PHOTOS = "upload:meal_photos",

  // Bookings Management
  VIEW_BOOKINGS = "view:bookings",
  EDIT_BOOKING = "edit:booking",
  CANCEL_BOOKING = "cancel:booking",
  EXPORT_BOOKINGS = "export:bookings",

  // Settings Management
  VIEW_SETTINGS = "view:settings",
  EDIT_SETTINGS = "edit:settings",
  EDIT_DELIVERY_SETTINGS = "edit:delivery_settings",
  EDIT_BRANDING = "edit:branding",

  // Promo Codes
  VIEW_PROMO_CODES = "view:promo_codes",
  CREATE_PROMO_CODE = "create:promo_code",
  EDIT_PROMO_CODE = "edit:promo_code",
  DELETE_PROMO_CODE = "delete:promo_code",

  // Analytics
  VIEW_ANALYTICS = "view:analytics",
  VIEW_STATS = "view:stats",
  EXPORT_ANALYTICS = "export:analytics",

  // Blocked Dates
  MANAGE_BLOCKED_DATES = "manage:blocked_dates",

  // Catering Enquiries
  VIEW_CATERING = "view:catering",
  RESPOND_CATERING = "respond:catering",
}

/**
 * Role-to-Permissions mapping
 * Defines which permissions each role has
 */
const rolePermissions: Record<AdminRole, Permission[]> = {
  [AdminRole.SUPER_ADMIN]: [
    // All permissions
    Permission.VIEW_ADMINS,
    Permission.CREATE_ADMIN,
    Permission.EDIT_ADMIN,
    Permission.DELETE_ADMIN,
    Permission.UNLOCK_ADMIN,
    Permission.EDIT_ROLES,
    Permission.VIEW_MEALS,
    Permission.CREATE_MEAL,
    Permission.EDIT_MEAL,
    Permission.DELETE_MEAL,
    Permission.UPLOAD_MEAL_PHOTOS,
    Permission.VIEW_BOOKINGS,
    Permission.EDIT_BOOKING,
    Permission.CANCEL_BOOKING,
    Permission.EXPORT_BOOKINGS,
    Permission.VIEW_SETTINGS,
    Permission.EDIT_SETTINGS,
    Permission.EDIT_DELIVERY_SETTINGS,
    Permission.EDIT_BRANDING,
    Permission.VIEW_PROMO_CODES,
    Permission.CREATE_PROMO_CODE,
    Permission.EDIT_PROMO_CODE,
    Permission.DELETE_PROMO_CODE,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_STATS,
    Permission.EXPORT_ANALYTICS,
    Permission.MANAGE_BLOCKED_DATES,
    Permission.VIEW_CATERING,
    Permission.RESPOND_CATERING,
  ],

  [AdminRole.ADMIN]: [
    // All permissions except admin/role management
    Permission.VIEW_ADMINS, // View only
    Permission.VIEW_MEALS,
    Permission.CREATE_MEAL,
    Permission.EDIT_MEAL,
    Permission.DELETE_MEAL,
    Permission.UPLOAD_MEAL_PHOTOS,
    Permission.VIEW_BOOKINGS,
    Permission.EDIT_BOOKING,
    Permission.CANCEL_BOOKING,
    Permission.EXPORT_BOOKINGS,
    Permission.VIEW_SETTINGS,
    Permission.EDIT_SETTINGS,
    Permission.EDIT_DELIVERY_SETTINGS,
    Permission.EDIT_BRANDING,
    Permission.VIEW_PROMO_CODES,
    Permission.CREATE_PROMO_CODE,
    Permission.EDIT_PROMO_CODE,
    Permission.DELETE_PROMO_CODE,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_STATS,
    Permission.EXPORT_ANALYTICS,
    Permission.MANAGE_BLOCKED_DATES,
    Permission.VIEW_CATERING,
    Permission.RESPOND_CATERING,
  ],

  [AdminRole.MODERATOR]: [
    // Content review and moderation only
    Permission.VIEW_MEALS,
    Permission.VIEW_BOOKINGS,
    Permission.VIEW_SETTINGS,
    Permission.VIEW_PROMO_CODES,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_STATS,
    Permission.VIEW_CATERING,
    Permission.RESPOND_CATERING,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: AdminRole | null | undefined,
  permission: Permission
): boolean {
  if (!role || !rolePermissions[role]) {
    return false;
  }

  return rolePermissions[role].includes(permission);
}

/**
 * Check if a role has any of the given permissions
 */
export function hasAnyPermission(
  role: AdminRole | null | undefined,
  permissions: Permission[]
): boolean {
  if (!role) return false;

  return permissions.some((perm) => hasPermission(role, perm));
}

/**
 * Check if a role has all of the given permissions
 */
export function hasAllPermissions(
  role: AdminRole | null | undefined,
  permissions: Permission[]
): boolean {
  if (!role) return false;

  return permissions.every((perm) => hasPermission(role, perm));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: AdminRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if one role can manage another role
 * SUPER_ADMIN can manage all roles
 * ADMIN can manage MODERATOR only
 * MODERATOR cannot manage any roles
 */
export function canManageRole(
  managerRole: AdminRole | null | undefined,
  targetRole: AdminRole | null | undefined
): boolean {
  if (!managerRole || !targetRole) return false;

  if (managerRole === AdminRole.SUPER_ADMIN) {
    return true; // SUPER_ADMIN can manage anyone
  }

  if (managerRole === AdminRole.ADMIN) {
    return targetRole === AdminRole.MODERATOR; // ADMIN can manage MODERATOR only
  }

  return false; // MODERATOR cannot manage anyone
}

/**
 * Validate role hierarchy
 * Ensures a user cannot be assigned a role higher than their own
 */
export function isRoleHigherThan(
  role1: AdminRole | null | undefined,
  role2: AdminRole | null | undefined
): boolean {
  const hierarchy = {
    [AdminRole.SUPER_ADMIN]: 3,
    [AdminRole.ADMIN]: 2,
    [AdminRole.MODERATOR]: 1,
  };

  if (!role1 || !role2) return false;

  return (hierarchy[role1] || 0) > (hierarchy[role2] || 0);
}
