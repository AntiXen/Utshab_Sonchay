import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { auth, db, firebaseConfigured } from '../firebase';
import type { Income, Bill, User, IncomeType, PaymentMethod, IncomeStatus } from '../App';

export const isLiveBackend = (): boolean => {
  return Boolean(firebaseConfigured && db);
};

export const initCloudSession = async (): Promise<void> => {
  if (firebaseConfigured && auth && !auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      // Anonymous auth fallback
    }
  }
};

// ==========================================
// 1. REAL-TIME INCOME (CHADA & PRONAMI) SYNC
// ==========================================
export const subscribeToIncome = (
  onData: (incomes: Income[]) => void,
  onError?: (err: Error) => void
) => {
  if (!isLiveBackend() || !db) return () => {};

  const q = query(collection(db, 'income'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    snapshot => {
      const liveData: Income[] = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        const type: IncomeType = d.type === 'pronami' ? 'pronami' : 'contribution';
        const status: IncomeStatus = d.status === 'confirmed' ? 'Confirmed' : d.status === 'rejected' ? 'Rejected' : 'Pending';
        const method: PaymentMethod = (d.method as PaymentMethod) || 'bKash';
        return {
          id: typeof d.id === 'number' ? d.id : Number(docSnap.id.replace(/\D/g, '').slice(0, 8)) || Date.now(),
          type,
          name: d.giverName || d.name || 'বেনামী',
          amount: Number(d.amount) || 0,
          day: d.day || '—',
          method,
          status,
          date: d.date || new Date().toISOString().split('T')[0],
          publicName: d.publicName ?? true,
          createdBy: d.createdBy || d.memberUid || 'System',
          trxId: d.providerTransactionId || d.trxId || '',
          senderPhone: d.senderNumber || d.senderPhone || '',
          month: d.month || '',
          rejectReason: d.rejectionReason || d.rejectReason || '',
        };
      });
      if (liveData.length > 0) {
        onData(liveData);
      }
    },
    err => {
      console.warn('Firestore income subscription fallback to local state:', err);
      if (onError) onError(err);
    }
  );
};

// Save a new Income submission (Manual bKash/Nagad/Cash)
export const saveIncomeToFirestore = async (income: Income): Promise<void> => {
  if (!isLiveBackend() || !db) return;
  const docId = `inc_${income.id}_${Date.now()}`;
  const incomeDocRef = doc(db, 'income', docId);
  await setDoc(incomeDocRef, {
    id: income.id,
    festivalId: 'durga-2026',
    type: income.type,
    giverName: income.name,
    amount: income.amount,
    day: income.day,
    method: income.method,
    status: income.status === 'Confirmed' ? 'confirmed' : income.status === 'Rejected' ? 'rejected' : 'pending',
    date: income.date,
    publicName: income.publicName ?? true,
    createdBy: income.createdBy,
    providerTransactionId: income.trxId || null,
    senderNumber: income.senderPhone || null,
    month: income.month || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// Admin decision on pending Income (Confirm / Reject)
export const updateIncomeStatusInFirestore = async (
  incomeId: number,
  status: 'Confirmed' | 'Rejected',
  reason?: string,
  decidedBy?: string
): Promise<void> => {
  if (!isLiveBackend() || !db) return;
  const q = query(collection(db, 'income'));
  const snap = await getDocs(q);
  const target = snap.docs.find(d => d.data().id === incomeId);
  if (target) {
    await updateDoc(doc(db, 'income', target.id), {
      status: status === 'Confirmed' ? 'confirmed' : 'rejected',
      rejectionReason: reason || null,
      decidedBy: decidedBy || 'Admin',
      decidedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

// ==========================================
// 2. REAL-TIME BILLS & EXPENSES SYNC
// ==========================================
export const subscribeToBills = (
  onData: (bills: Bill[]) => void,
  onError?: (err: Error) => void
) => {
  if (!isLiveBackend() || !db) return () => {};

  const q = query(collection(db, 'bills'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    snapshot => {
      const liveData: Bill[] = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: typeof d.id === 'number' ? d.id : Number(docSnap.id.replace(/\D/g, '').slice(0, 8)) || Date.now(),
          vendor: d.vendor || '',
          description: d.description || '',
          category: d.category || 'অন্যান্য',
          total: Number(d.total) || 0,
          paid: Number(d.paid) || 0,
          status: (d.status as 'Pending' | 'Approved' | 'Rejected') || 'Pending',
          requester: d.requester || '',
          type: (d.type as 'Advance' | 'Reimbursement') || 'Reimbursement',
          dueDate: d.dueDate || '',
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString().split('T')[0] : d.createdAt || '',
          rejectReason: d.rejectReason || '',
        };
      });
      if (liveData.length > 0) {
        onData(liveData);
      }
    },
    err => {
      console.warn('Firestore bills subscription fallback to local state:', err);
      if (onError) onError(err);
    }
  );
};

// Save a new bill expense application
export const saveBillToFirestore = async (bill: Bill): Promise<void> => {
  if (!isLiveBackend() || !db) return;
  const docId = `bill_${bill.id}_${Date.now()}`;
  const billDocRef = doc(db, 'bills', docId);
  await setDoc(billDocRef, {
    id: bill.id,
    festivalId: 'durga-2026',
    vendor: bill.vendor,
    description: bill.description,
    category: bill.category,
    total: bill.total,
    paid: bill.paid,
    status: bill.status,
    requester: bill.requester,
    type: bill.type,
    dueDate: bill.dueDate || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// Admin approve or reject a bill
export const updateBillStatusInFirestore = async (
  billId: number,
  status: 'Approved' | 'Pending' | 'Rejected',
  reason?: string
): Promise<void> => {
  if (!isLiveBackend() || !db) return;
  const q = query(collection(db, 'bills'));
  const snap = await getDocs(q);
  const target = snap.docs.find(d => d.data().id === billId);
  if (target) {
    await updateDoc(doc(db, 'bills', target.id), {
      status,
      rejectReason: reason || null,
      updatedAt: serverTimestamp(),
    });
  }
};

// Record payment towards an approved bill (reducing due)
export const payBillInFirestore = async (
  billId: number,
  additionalPayment: number
): Promise<void> => {
  if (!isLiveBackend() || !db) return;
  const q = query(collection(db, 'bills'));
  const snap = await getDocs(q);
  const target = snap.docs.find(d => d.data().id === billId);
  if (target) {
    const curPaid = Number(target.data().paid) || 0;
    const newPaid = curPaid + additionalPayment;
    await updateDoc(doc(db, 'bills', target.id), {
      paid: newPaid,
      updatedAt: serverTimestamp(),
    });
  }
};

// ==========================================
// 3. REAL-TIME USERS & AUDIT TRAIL SYNC
// ==========================================
export const subscribeToUsers = (
  onData: (users: User[]) => void,
  onError?: (err: Error) => void
) => {
  if (!isLiveBackend() || !db) return () => {};

  return onSnapshot(
    collection(db, 'users'),
    snapshot => {
      const liveUsers: User[] = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: typeof d.id === 'number' ? d.id : Number(docSnap.id.replace(/\D/g, '').slice(0, 8)) || Date.now(),
          name: d.displayName || d.name || 'সদস্য',
          phone: d.phone || '',
          role: d.role === 'admin' ? 'Admin' : 'Member',
          paid: Boolean(d.paid),
          active: d.active !== false,
        };
      });
      if (liveUsers.length > 0) {
        onData(liveUsers);
      }
    },
    err => {
      console.warn('Firestore users subscription fallback to local state:', err);
      if (onError) onError(err);
    }
  );
};

// Record audit log entry in cloud
export const saveUserToFirestore = async (user: User): Promise<void> => {
  if (!isLiveBackend() || !db) return;
  const userDocRef = doc(db, 'users', `user_${user.id}`);
  await setDoc(userDocRef, {
    id: user.id,
    displayName: user.name,
    name: user.name,
    phone: user.phone,
    role: user.role === 'Admin' ? 'admin' : 'member',
    paid: user.paid,
    active: user.active,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const logCloudAudit = async (
  actor: string,
  action: string,
  entityType: string,
  entityId: string | number,
  details: Record<string, unknown> = {}
): Promise<void> => {
  if (!isLiveBackend() || !db) return;
  const auditDocRef = doc(collection(db, 'auditLog'));
  await setDoc(auditDocRef, {
    actor,
    action,
    entityType,
    entityId: String(entityId),
    details,
    timestamp: serverTimestamp(),
  });
};
