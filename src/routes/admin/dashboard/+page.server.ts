import type { PageServerLoad } from './$types';

// The layout server already loads auth + profile.
// This page load can be extended for dashboard-specific data.
export const load: PageServerLoad = async () => {
  return {};
};
