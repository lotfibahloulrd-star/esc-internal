import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  updateDoc, 
  doc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

export interface Order {
  id?: string;
  created_at?: any;
  user_email: string;
  user_name: string;
  type: string;
  description: string;
  quantity: string;
  urgency: string;
  status: string;
  comment?: string;
  processed_at?: any;
}

export const SUPER_ADMINS = [
  "l.bahloul@esclab-algerie.com"
];

export const VALIDATORS = [
  "a.ouali@esclab-algerie.com",
  "l.bahloul@esclab-algerie.com", // Also a validator
  "l.naitsidous@esclab-algerie.com",
  "s.ouatmani@esclab-algerie.com"
];

export const isAdmin = (email: string | null | undefined) => {
  if (!email) return false;
  const e = email.toLowerCase();
  return VALIDATORS.includes(e) || SUPER_ADMINS.includes(e);
};

export const getRoleLabel = (email: string | null | undefined) => {
  if (!email) return "Utilisateur";
  const e = email.toLowerCase();
  if (SUPER_ADMINS.includes(e)) return "Super Administrateur";
  if (VALIDATORS.includes(e)) return "Validateur";
  return "Utilisateur";
};

export const orderService = {
  async getMyOrders() {
    const user = auth.currentUser;
    if (!user) throw new Error("Non authentifié");

    const q = query(
      collection(db, "orders"), 
      where("user_email", "==", user.email),
      orderBy("created_at", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
  },

  async getAllOrders() {
    const q = query(
      collection(db, "orders"), 
      orderBy("created_at", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
  },

  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'status'>) {
    const docRef = await addDoc(collection(db, "orders"), {
      ...order,
      status: 'En attente',
      created_at: serverTimestamp()
    });
    return docRef.id;
  },

  async updateOrderStatus(orderId: string, status: string, comment: string) {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status,
      comment,
      processed_at: serverTimestamp()
    });
  }
};
