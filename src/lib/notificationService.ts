import { Order, VALIDATORS, MASTER_ADMINS } from "./orderService";

// Note: Pour activer l'envoi réel, nous utiliserons EmailJS (gratuit et simple)
// ou un appel API vers votre serveur de mail.

const EMAILJS_SERVICE_ID = "service_esclab"; // À configurer
const EMAILJS_TEMPLATE_ID = "template_orders"; // À configurer
const EMAILJS_PUBLIC_KEY = "user_xxxx"; // À configurer

export const notificationService = {
  
  // 1. Notifier les validateurs d'une nouvelle demande
  async notifyNewOrder(order: Order) {
    console.log("Notification: Nouvelle commande envoyée aux validateurs", VALIDATORS);
    const subject = `📥 Nouvelle Demande Interne de ${order.user_name}`;
    const body = `Une nouvelle demande (${order.description}) est en attente de validation.\nLien : https://votre-portail.com/dashboard/validations`;
    
    // Logique d'envoi (Simulée pour le moment jusqu'à configuration des clés)
    this.sendEmail(VALIDATORS, subject, body);
  },

  // 2. Notifier l'employé du changement de statut
  async notifyStatusChange(order: Order, newStatus: string, comment: string) {
    console.log(`Notification: Statut de la commande #${order.id} passé à ${newStatus}`);
    const subject = `🔄 Mise à jour de votre demande : ${newStatus}`;
    const body = `Votre demande (${order.description}) a changé de statut.\nNouveau statut : ${newStatus}\nCommentaire : ${comment || 'Aucun'}`;
    
    this.sendEmail([order.user_email], subject, body);
  },

  // 3. Aiguillage intelligent vers les traitants (Lamine / Amel)
  async notifyAssignment(order: Order) {
    const lamine = "l.naitsidous@esclab-algerie.com";
    const boumedjmadjen = "a.boumedjmadjen@esclab-algerie.com";
    const belhocine = "belhocine@esclab-algerie.com";

    let recipients: string[] = [belhocine]; // Belhocine reçoit toujours une copie info
    
    const type = order.type.toLowerCase();
    const isIT = type.includes("informatique") || type.includes("équipement");
    const isOffice = type.includes("bureau") || type.includes("détergents") || type.includes("papeterie") || type.includes("hygiène");
    const isOther = type.includes("autre");

    if (isOther) {
        recipients.push(lamine, boumedjmadjen);
    } else if (isIT) {
        recipients.push(lamine);
    } else if (isOffice) {
        recipients.push(boumedjmadjen);
    } else {
        // Par précaution si rien ne match, on envoie aux deux
        recipients.push(lamine, boumedjmadjen);
    }

    const subject = `📦 Commande VALIDÉE à Traiter : ${order.description}`;
    const body = `La commande de ${order.user_name} a été validée et vous est attribuée pour traitement final.\nQuantité : ${order.quantity}\nLien : https://votre-portail.com/dashboard/processing`;

    this.sendEmail(recipients, subject, body);
  },

  // Fonction générique d'envoi (Interface avec EmailJS ou SMTP)
  async sendEmail(to: string[], subject: string, body: string) {
    // Dans une version réelle (EmailJS) :
    // emailjs.send(SERVICE_ID, TEMPLATE_ID, { to_email: to.join(','), subject, message: body }, PUBLIC_KEY);
    
    console.log(`--- SIMULATION ENVOI MAIL ---`);
    console.log(`Destinataires: ${to.join(", ")}`);
    console.log(`Sujet: ${subject}`);
    console.log(`Corps: ${body}`);
    console.log(`-----------------------------`);
  }
};
