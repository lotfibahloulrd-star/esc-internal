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
  validator_name?: string;
}

export const SUPER_ADMINS = [
  "l.bahloul@esclab-algerie.com"
];

export const VALIDATORS = [
  "a.ouali@esclab-algerie.com",
  "l.bahloul@esclab-algerie.com"
];

export const HANDLERS = {
  IT: "l.naitsidous@esclab-algerie.com",
  OFFICE: "a.boumedjmadjen@esclab-algerie.com"
};

export const isAdmin = (email: string | null | undefined) => {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return VALIDATORS.map(v => v.toLowerCase().trim()).includes(e) || 
         SUPER_ADMINS.map(v => v.toLowerCase().trim()).includes(e);
};

export const isHandler = (email: string | null | undefined) => {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return Object.values(HANDLERS).map(v => v.toLowerCase().trim()).includes(e);
};

export const getRoleLabel = (email: string | null | undefined) => {
  if (!email) return "Utilisateur";
  const e = email.toLowerCase().trim();
  if (SUPER_ADMINS.map(v => v.toLowerCase().trim()).includes(e)) return "Super Administrateur";
  if (VALIDATORS.map(v => v.toLowerCase().trim()).includes(e)) return "Validateur";
  if (Object.values(HANDLERS).map(v => v.toLowerCase().trim()).includes(e)) return "Service Traitement";
  return "Utilisateur";
};

export const getCategoryAssignment = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('informatique') || t.includes('équipement')) return 'IT';
  if (t.includes('bureau') || t.includes('détergent') || t.includes('papeterie') || t.includes('ménage')) return 'OFFICE';
  return 'OTHER';
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

  async getProcessingOrders(handlerEmail: string) {
    const q = query(
      collection(db, "orders"), 
      where("status", "==", "Validée"),
      orderBy("created_at", "desc")
    );

    const querySnapshot = await getDocs(q);
    const allValid = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];

    // Filtrage par catégorie selon le handler
    const handlerType = Object.keys(HANDLERS).find(key => HANDLERS[key as keyof typeof HANDLERS] === handlerEmail.toLowerCase());
    
    if (!handlerType) return [];

    return allValid.filter(order => getCategoryAssignment(order.type) === handlerType);
  },

  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'status'>) {
    const docRef = await addDoc(collection(db, "orders"), {
      ...order,
      status: 'En attente',
      created_at: serverTimestamp()
    });
    return docRef.id;
  },

  async updateOrderStatus(orderId: string, status: string, comment: string, validatorName: string) {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status,
      comment,
      validator_name: validatorName,
      processed_at: serverTimestamp()
    });
  }
};
