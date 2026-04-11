import { Order, VALIDATORS } from "./orderService";

export const notificationService = {
  
  // 1. Notifier les validateurs d'une nouvelle demande
  async notifyNewOrder(order: Order) {
    const subject = `📥 Nouvelle Demande Interne de ${order.user_name}`;
    const body = `Une nouvelle demande (${order.description}) est en attente de validation.\n\n` +
                 `Demandeur: ${order.user_name}\n` +
                 `Détail: ${order.description}\n` +
                 `Quantité: ${order.quantity}\n\n` +
                 `Veuillez vous connecter pour décider : https://esclab-orders.esclab-academy.com/dashboard/validations`;
    
    this.sendEmail(VALIDATORS, subject, body);
  },

  // 2. Notifier l'employé du changement de statut
  async notifyStatusChange(order: Order, newStatus: string, comment: string) {
    const subject = `🔄 Statut de votre demande : ${newStatus}`;
    const body = `La direction a mis à jour votre demande (${order.description}).\n\n` +
                 `Nouveau statut: ${newStatus}\n` +
                 `Commentaire: ${comment || 'Aucun'}\n\n` +
                 `Suivi : https://esclab-orders.esclab-academy.com/dashboard/my-requests`;
    
    this.sendEmail([order.user_email], subject, body);
  },

  // 3. Aiguillage intelligent vers les traitants (Lamine / Amel)
  async notifyAssignment(order: Order) {
    const lamine = "l.naitsidous@esclab-algerie.com";
    const boumedjmadjen = "a.boumedjmadjen@esclab-algerie.com";
    const belhocine = "belhocine@esclab-algerie.com";

    let recipients: string[] = [belhocine];
    const type = order.type.toLowerCase();
    
    if (type.includes("autre")) {
        recipients.push(lamine, boumedjmadjen);
    } else if (type.includes("informatique") || type.includes("équipement")) {
        recipients.push(lamine);
    } else {
        recipients.push(boumedjmadjen);
    }

    const subject = `📦 Commande VALIDÉE : ${order.description} (À traiter)`;
    const body = `Une demande a été approuvée et nécessite votre intervention pour clôture/valorisation.\n\n` +
                 `Demandeur: ${order.user_name}\n` +
                 `Article: ${order.description}\n` +
                 `Quantité: ${order.quantity}\n\n` +
                 `Lien Traitement: https://esclab-orders.esclab-academy.com/dashboard/processing`;

    this.sendEmail(recipients, subject, body);
  },

  // Appels vers le pont PHP sécurisé
  async sendEmail(to: string[], subject: string, body: string) {
    try {
        const response = await fetch('/api/send_email.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, body })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            console.log("Email envoyé avec succès !");
        } else {
            console.error("Détails technique de l'échec mail:", result);
            alert("Erreur technique d'envoi mail (Voir console): " + result.message);
        }
    } catch (err) {
        console.error("Erreur réseau mail:", err);
    }
  }
};
