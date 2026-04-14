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
import { notificationService } from './notificationService';

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
  price?: string; // Nouveau champ Prix
}

export const SUPER_ADMINS = [
  "l.bahloul@esclab-algerie.com",
  "s.ouatmani@esclab-algerie.com"
];

export const VALIDATORS = [
  "a.ouali@esclab-algerie.com",
  "l.bahloul@esclab-algerie.com",
  "s.ouatmani@esclab-algerie.com"
];

export const MASTER_ADMINS = [
  "l.bahloul@esclab-algerie.com",
  "s.ouatmani@esclab-algerie.com",
  "a.ouali@esclab-algerie.com"
];

export const HANDLERS = {
  IT: "l.naitsidous@esclab-algerie.com",
  OFFICE: "boumedjmadjen.amina@esclab-algerie.com"
};

export const isMasterAdmin = (email: string | null | undefined) => {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return MASTER_ADMINS.map(v => v.toLowerCase().trim()).includes(e);
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

  async getDomainOrders(handlerEmail: string) {
    const allOrders = await this.getAllOrders();
    const email = handlerEmail.toLowerCase().trim();
    
    if (isAdmin(email)) return allOrders;

    const handlerType = Object.keys(HANDLERS).find(key => HANDLERS[key as keyof typeof HANDLERS] === email);
    if (!handlerType) return [];

    return allOrders.filter(order => 
      getCategoryAssignment(order.type) === handlerType && 
      order.status !== 'En attente'
    );
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

    const email = handlerEmail.toLowerCase().trim();
    
    // Si l'utilisateur est un superviseur (Bahloul, Ouali, Belhocine), il voit TOUT
    if (isAdmin(email)) return allValid;

    // Sinon, c'est un traitant spécifique (Lamine, Amina)
    const handlerType = Object.keys(HANDLERS).find(key => HANDLERS[key as keyof typeof HANDLERS] === email);
    
    if (!handlerType) return [];

    return allValid.filter(order => getCategoryAssignment(order.type) === handlerType);
  },

  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'status'>) {
    const docRef = await addDoc(collection(db, "orders"), {
      ...order,
      status: 'En attente',
      created_at: serverTimestamp()
    });
    
    // Notification mail aux validateurs
    notificationService.notifyNewOrder({ id: docRef.id, ...order, status: 'En attente' });
    
    return docRef.id;
  },

  async updateOrderStatus(orderId: string, status: string, comment: string, validatorName: string, price: string = "") {
    const orderRef = doc(db, "orders", orderId);
    const updateData: any = {
      status,
      comment,
      validator_name: validatorName,
      processed_at: serverTimestamp()
    };
    
    if (price) updateData.price = price;
    
    await updateDoc(orderRef, updateData);

    // Récupérer l'objet complet pour la notification
    const orderData = (await (await getDocs(query(collection(db, 'orders'), where('__name__', '==', orderId)))).docs[0]?.data()) as Order;

    // Notification à l'employé
    notificationService.notifyStatusChange({ id: orderId, ...orderData }, status, comment);

    // Si validée, aiguillage vers les traitants (Lamine/Amel)
    if (status === 'Validée') {
      notificationService.notifyAssignment({ id: orderId, ...orderData });
    }
  },

  async masterUpdateOrder(orderId: string, data: Partial<Order>) {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
        ...data,
        master_edited_at: serverTimestamp()
    });

    // Optionnel: Notifier l'employé de la modification maître
    notificationService.notifyStatusChange({ id: orderId, ...data } as Order, data.status || "Modifiée", "Modification administrative globale.");
  },

  async getProfiles() {
    const q = query(collection(db, "profiles"), orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as { id: string, email: string, name: string, active: boolean }[];
  },

  async toggleProfileStatus(profileId: string, currentStatus: boolean) {
    const profileRef = doc(db, "profiles", profileId);
    await updateDoc(profileRef, {
      active: !currentStatus
    });
  }
};
