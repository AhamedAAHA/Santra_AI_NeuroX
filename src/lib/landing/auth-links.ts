/** Primary workspace entry after sign-in. */
export const SANTRA_HOME = "/dashboard";

export function signInFor(path: string) {
  return `/sign-in?next=${encodeURIComponent(path)}`;
}
