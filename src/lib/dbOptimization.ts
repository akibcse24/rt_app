import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  writeBatch,
  startAfter,
  onSnapshot,
  type CollectionReference,
  type DocumentData,
  type Query,
  type DocumentSnapshot
} from 'firebase/firestore';

// ============================================================================
// DATABASE OPTIMIZATION UTILITIES
// ============================================================================

interface QueryOptions {
  collectionName: string;
  conditions?: Array<{
    field: string;
    operator: '==' | '<' | '<=' | '>' | '>=' | '!=' | 'array-contains' | 'in' | 'not-in';
    value: unknown;
  }>;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
  userId?: string;
}

/**
 * Build an optimized Firestore query with proper indexing
 */
export function buildOptimizedQuery(options: QueryOptions): Query<DocumentData> {
  const { collectionName, conditions, orderByField, orderDirection, limitCount, userId } = options;

  // Build collection path
  const collectionPath = userId ? `users/${userId}/${collectionName}` : collectionName;
  const collectionRef = collection(db, collectionPath);

  let firestoreQuery: Query<DocumentData> = collectionRef;

  // Add where clauses
  if (conditions && conditions.length > 0) {
    conditions.forEach((condition) => {
      firestoreQuery = query(
        firestoreQuery,
        where(condition.field, condition.operator as '==' | '<' | '<=' | '>' | '>=' | '!=' | 'array-contains' | 'in' | 'not-in', condition.value)
      );
    });
  }

  // Add ordering
  if (orderByField) {
    firestoreQuery = query(firestoreQuery, orderBy(orderByField, orderDirection || 'desc'));
  }

  // Add limit
  if (limitCount) {
    firestoreQuery = query(firestoreQuery, limit(limitCount));
  }

  return firestoreQuery;
}

/**
 * Execute a query with error handling and logging
 */
export async function executeQuery<T extends DocumentData>(
  queryBuilder: Query<DocumentData>
): Promise<{ data: T[]; error?: string }> {
  try {
    const snapshot = await getDocs(queryBuilder);
    const data = snapshot.docs.map((doc) => {
      const docData = doc.data();
      return { id: doc.id, ...docData } as unknown as T;
    });

    return { data };
  } catch (error) {
    console.error('Query execution error:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Common query patterns for optimization
 */
export const queryPatterns = {
  // Get tasks for a user
  getUserTasks: (userId: string, timeBlock?: string, limitCount = 20) =>
    buildOptimizedQuery({
      collectionName: 'tasks',
      userId,
      conditions: timeBlock
        ? [{ field: 'timeBlock', operator: '==', value: timeBlock }]
        : [],
      orderByField: 'createdAt',
      orderDirection: 'desc',
      limitCount,
    }),

  // Get user's goals
  getUserGoals: (userId: string, limitCount = 20) =>
    buildOptimizedQuery({
      collectionName: 'goals',
      userId,
      orderByField: 'createdAt',
      orderDirection: 'desc',
      limitCount,
    }),

  // Get completed tasks for today
  getTodayCompletedTasks: (userId: string) =>
    buildOptimizedQuery({
      collectionName: 'tasks',
      userId,
      conditions: [{ field: 'isCompleted', operator: '==', value: true }],
      orderByField: 'updatedAt',
      orderDirection: 'desc',
      limitCount: 50,
    }),

  // Get leaderboard rankings
  getLeaderboard: (limitCount = 100) =>
    buildOptimizedQuery({
      collectionName: 'users',
      conditions: [{ field: 'score', operator: '>', value: 0 }],
      orderByField: 'score',
      orderDirection: 'desc',
      limitCount,
    }),

  // Get recent focus sessions
  getRecentFocusSessions: (userId: string, limitCount = 10) =>
    buildOptimizedQuery({
      collectionName: 'focusSessions',
      userId,
      orderByField: 'startTime',
      orderDirection: 'desc',
      limitCount,
    }),

  // Get achievements
  getUserAchievements: (userId: string, limitCount = 50) =>
    buildOptimizedQuery({
      collectionName: 'achievements',
      userId,
      orderByField: 'unlockedAt',
      orderDirection: 'desc',
      limitCount,
    }),
};

/**
 * Batch operation helpers for better performance
 */
export async function batchWrite<T extends { id: string }>(
  items: T[],
  operation: 'create' | 'update' | 'delete',
  collectionName: string,
  userId: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const firestoreBatch = writeBatch(db);
  const collectionRef = collection(db, `users/${userId}/${collectionName}`);
  const results = { success: 0, failed: 0, errors: [] as string[] };

  items.forEach((item) => {
    const docRef = doc(collectionRef, item.id);

    switch (operation) {
      case 'create':
        firestoreBatch.set(docRef, { ...item, createdAt: new Date().toISOString() });
        break;
      case 'update':
        firestoreBatch.update(docRef, { ...item, updatedAt: new Date().toISOString() });
        break;
      case 'delete':
        firestoreBatch.delete(docRef);
        break;
    }
  });

  try {
    await firestoreBatch.commit();
    results.success = items.length;
  } catch (error) {
    results.failed = items.length;
    results.errors.push(error instanceof Error ? error.message : 'Batch write failed');
  }

  return results;
}

/**
 * Pagination helper for Firestore queries
 */
export async function paginatedQuery<T extends DocumentData>(
  queryBuilder: Query<DocumentData>,
  page: number = 1,
  pageSize: number = 20,
  cursor?: string
): Promise<{
  data: T[];
  pagination: {
    hasMore: boolean;
    lastDoc?: string;
    total?: number;
  };
}> {
  let queryRef = query(queryBuilder, limit(pageSize + 1)); // Fetch one extra to check if there are more

  // If cursor is provided, start after it
  if (cursor) {
    const docRef = doc(db, cursor);
    const lastDoc = await getDoc(docRef);
    queryRef = query(queryRef, startAfter(lastDoc as DocumentSnapshot<DocumentData>));
  }

  const snapshot = await getDocs(queryRef);
  const docs = snapshot.docs;

  // Check if there are more results
  const hasMore = docs.length > pageSize;
  const data = hasMore ? docs.slice(0, pageSize) : docs;

  return {
    data: data.map((doc) => {
      const docData = doc.data();
      return { id: doc.id, ...docData } as unknown as T;
    }),
    pagination: {
      hasMore,
      lastDoc: hasMore ? data[data.length - 1].ref.path : undefined,
    },
  };
}

/**
 * Real-time subscription helper
 */
export function subscribeToQuery<T extends DocumentData>(
  queryBuilder: Query<DocumentData>,
  callback: (data: T[]) => void,
  onError?: (error: Error) => void
): () => void {
  const unsubscribe = onSnapshot(
    queryBuilder,
    (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return { id: doc.id, ...docData } as unknown as T;
      });
      callback(data);
    },
    (error) => {
      console.error('Subscription error:', error);
      onError?.(error);
    }
  );

  return unsubscribe;
}
