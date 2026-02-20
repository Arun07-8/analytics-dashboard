import {
    doc,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../config';

/**
 * Subscribes to real-time metrics for a specific tenant.
 * Expects a document in 'metrics' collection with tenantId as the document ID,
 * or a specific path like 'tenants/{tenantId}/stats/v1'.
 * 
 * For this implementation, we assume a top-level 'metrics' collection where doc ID = tenantId.
 */
export const subscribeToTenantMetrics = (tenantId, callback) => {
    if (!tenantId) {
        console.error("tenantId is required for metrics subscription");
        return () => { };
    }

    // Listen to the metrics document for this tenant
    const docRef = doc(db, 'metrics', tenantId);

    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            // Return default empty metrics if doc doesn't exist yet
            callback({
                totalRevenue: 0,
                revenueGrowth: 0,
                customerCount: 0,
                staffCount: 0,
                retentionRate: 0,
                salesCount: 0
            });
        }
    }, (error) => {
        console.error("Error subscribing to tenant metrics:", error);
    });
};
