/**
 * @swagger
 * components:
 *   schemas:
 *     UserPublic:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address (primary key)
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         role:
 *           type: string
 *           enum: [admin, manager, user]
 *           description: User's role
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/** Input for creating a new user (registration) */
export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/** Public user representation (never includes password_hash) */
export interface UserPublic {
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'user';
  createdAt: string;
  updatedAt: string;
}

/** Internal user representation (includes password_hash for auth) */
export interface UserWithHash {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'user';
  createdAt: string;
  updatedAt: string;
}
