import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  setLogLevel,
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Order, OrderStatus, StoreSettings, CustomerProfile, Product } from '../types';

// Desativa logs internos de fallback/timeout do Firestore no console
setLogLevel('silent');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);

// Operation types for strict error logging
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  console.log('✅ Conexão Firestore inicializada no projeto:', firebaseConfig.projectId);
  return true;
}

// Helper to remove any undefined fields before writing to Firestore
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data));
}

// 1. Orders Real-time Sync
export function subscribeToOrders(
  onOrdersUpdate: (orders: Order[]) => void,
  onError?: (err: any) => void
) {
  const path = 'orders';
  return onSnapshot(
    collection(db, path),
    snapshot => {
      const ordersList: Order[] = [];
      snapshot.forEach(docSnap => {
        ordersList.push(docSnap.data() as Order);
      });
      // Sort orders by timestamp / id descending
      ordersList.sort((a, b) => (b.createdAt || b.id || '').localeCompare(a.createdAt || a.id || ''));
      onOrdersUpdate(ordersList);
    },
    error => {
      console.error('Erro ao escutar pedidos no Firestore:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveOrderToFirestore(order: Order): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    const cleanData = sanitizeForFirestore(order);
    await setDoc(doc(db, 'orders', order.id), cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateOrderStatusInFirestore(orderId: string, status: OrderStatus): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateOrderInFirestore(orderId: string, partial: Partial<Order>): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const cleanData = sanitizeForFirestore(partial);
    await updateDoc(doc(db, 'orders', orderId), cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 2. Store Settings Sync
export function subscribeToStoreSettings(
  onSettingsUpdate: (settings: StoreSettings) => void
) {
  const path = 'settings/store';
  return onSnapshot(
    doc(db, 'settings', 'store'),
    docSnap => {
      if (docSnap.exists()) {
        onSettingsUpdate(docSnap.data() as StoreSettings);
      }
    },
    error => {
      console.warn('Configurações no Firestore ainda não criadas ou sem permissão:', error);
    }
  );
}

export async function saveStoreSettingsToFirestore(settings: StoreSettings): Promise<void> {
  const path = 'settings/store';
  try {
    const cleanSettings = sanitizeForFirestore(settings);
    await setDoc(doc(db, 'settings', 'store'), cleanSettings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 3. Expenses Sync
export function subscribeToExpenses(onExpensesUpdate: (expenses: any[]) => void) {
  const path = 'expenses';
  return onSnapshot(
    collection(db, path),
    snapshot => {
      const expenses: any[] = [];
      snapshot.forEach(d => expenses.push(d.data()));
      onExpensesUpdate(expenses);
    },
    error => {
      console.warn('Erro ao escutar despesas no Firestore:', error);
    }
  );
}

export async function saveExpenseToFirestore(expense: any): Promise<void> {
  const path = `expenses/${expense.id}`;
  try {
    const cleanExpense = sanitizeForFirestore(expense);
    await setDoc(doc(db, 'expenses', expense.id), cleanExpense);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 4. Customer Profile Sync
export async function saveCustomerProfileToFirestore(profile: CustomerProfile): Promise<void> {
  const phoneClean = profile.phone.replace(/\D/g, '') || `cust_${Date.now()}`;
  const path = `customers/${phoneClean}`;
  try {
    const cleanProfile = sanitizeForFirestore({
      ...profile,
      id: phoneClean,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'customers', phoneClean), cleanProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 5. Products / Menu Real-time Sync
export function subscribeToProducts(
  onProductsUpdate: (products: Product[]) => void,
  onError?: (err: any) => void
) {
  const path = 'products';
  return onSnapshot(
    collection(db, path),
    snapshot => {
      const list: Product[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Product);
      });
      onProductsUpdate(list);
    },
    error => {
      console.warn('Erro ao escutar produtos no Firestore:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  const path = `products/${product.id}`;
  try {
    const cleanProduct = sanitizeForFirestore({
      ...product,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'products', product.id), cleanProduct, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAllProductsToFirestore(products: Product[]): Promise<void> {
  try {
    for (const prod of products) {
      await saveProductToFirestore(prod);
    }
  } catch (err) {
    console.warn('Erro ao sincronizar lote de produtos no Firestore:', err);
  }
}
