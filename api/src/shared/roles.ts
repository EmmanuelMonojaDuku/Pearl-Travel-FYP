export const USER_ROLES = {
  TRAVELLER: 'traveller',
  ADMIN_STAFF: 'admin_staff',
  BORDER_OFFICER: 'border_officer',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ALL_USER_ROLES: readonly UserRole[] = [
  USER_ROLES.TRAVELLER,
  USER_ROLES.ADMIN_STAFF,
  USER_ROLES.BORDER_OFFICER,
];

export function isValidUserRole(value: string): value is UserRole {
  return (ALL_USER_ROLES as readonly string[]).includes(value);
}
