/**
 * Editorial imagery that isn't tied to a database record. Vehicle, stock and
 * journal images live in Postgres (see `packages/db/prisma/seed.ts`).
 *
 * All IDs resolve on images.unsplash.com — do not switch to
 * plus.unsplash.com URLs, which 401 in production.
 */
const unsplash = (id: string, w = 2400): string =>
  `https://images.unsplash.com/${id}?w=${w}&q=85&auto=format&fit=crop`;

export const HERO_IMAGE = unsplash("photo-1503376780353-7e6692767b70");
export const FINANCING_IMAGE = unsplash("photo-1556761175-5973dc0f32e7", 1600);
export const AUTH_IMAGE = unsplash("photo-1485291571150-772bcfc10da5", 1600);
export const SHOWROOM_IMAGE = unsplash("photo-1590362891991-f776e747a588", 2000);
export const SERVICE_IMAGE = unsplash("photo-1487754180451-c456f719a1fc", 2000);
export const ABOUT_IMAGE = unsplash("photo-1617814076367-b759c7d7e738", 2000);
export const ROAD_IMAGE = unsplash("photo-1562705841-c4934bb2b31b", 2000);
export const CABIN_IMAGE = unsplash("photo-1449965408869-eaa3f722e40d", 2000);
