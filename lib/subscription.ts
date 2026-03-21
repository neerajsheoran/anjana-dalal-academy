import { adminDb } from './firebase-admin';
import type { PlatformConfig, ContentAccessLevel } from './types';

const DEFAULT_CONFIG: PlatformConfig = {
  trialDays: 30,
  yearlyPriceINR: 999,
  commissionPercent: 10,
  razorpayEnabled: true,
};

/**
 * Fetch platform config from Firestore singleton.
 * Returns defaults if document doesn't exist.
 */
export async function getPlatformConfig(): Promise<PlatformConfig> {
  try {
    const doc = await adminDb.doc('platformConfig/settings').get();
    if (!doc.exists) return DEFAULT_CONFIG;
    const d = doc.data()!;
    return {
      trialDays: d.trialDays ?? DEFAULT_CONFIG.trialDays,
      yearlyPriceINR: d.yearlyPriceINR ?? DEFAULT_CONFIG.yearlyPriceINR,
      commissionPercent: d.commissionPercent ?? DEFAULT_CONFIG.commissionPercent,
      razorpayEnabled: d.razorpayEnabled ?? DEFAULT_CONFIG.razorpayEnabled,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Determine the content access level for a user.
 * Replaces the simple boolean `isLoggedIn` check.
 */
export async function getContentAccessLevel(uid: string): Promise<ContentAccessLevel> {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) return 'anonymous';

    const data = userDoc.data()!;
    const now = new Date();

    // Admin always has full access
    if (data.role === 'admin') return 'admin';

    // Admin-extended access overrides everything
    if (data.adminExtendedUntil) {
      const extendedUntil = data.adminExtendedUntil.toDate();
      if (extendedUntil > now) return 'subscribed';
    }

    // Active paid subscription
    if (data.subscriptionEndsAt) {
      const subEnd = data.subscriptionEndsAt.toDate();
      if (subEnd > now) return 'subscribed';
    }

    // Trial period
    if (data.trialEndsAt) {
      const trialEnd = data.trialEndsAt.toDate();
      if (trialEnd > now) return 'trial';
    }

    return 'expired';
  } catch {
    return 'anonymous';
  }
}

/**
 * Check if a content access level grants full content visibility.
 */
export function hasFullAccess(level: ContentAccessLevel): boolean {
  return level === 'trial' || level === 'subscribed' || level === 'admin';
}
