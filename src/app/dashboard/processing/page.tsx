"use client";

import React, { useEffect, useState } from "react";
import { orderService, Order, getRoleLabel } from "@/lib/orderService";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ProcessingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [prices, setPrices] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      
      const role = getRoleLabel(user.email);
      // Autoriser les traitants ET les validateurs/admins
      if (role !== "Service Traitement" && role !== "Validateur" && role !== "Super Administrateur") {
        router.push("/dashboard");
        return;
      }

      try {
        const data = await orderService.getProcessingOrders(user.email!);
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleProcess = async (orderId: string, status: "Traitée" | "Annulée") => {
    const price = prices[orderId];
    
    if (status === "Traitée") {
        if (!price || price.trim() === "") {
            alert("Le prix est obligatoire pour clôturer la commande.");
            return;
        }
        if (!confirm(`Clôturer cette commande avec un prix de ${price} DZD ?`)) return;
    } else {
        if (!confirm(`Voulez-vous vraiment ANNULER cette demande ?`)) return;
    }
    
    try {
      const user = auth.currentUser;
      const handlerName = user?.displayName || user?.email?.split('@')[0] || "Gestionnaire";
      const comment = status === "Traitée" ? "Commande traitée, valorisée et finalisée." : "Demande validée annulée ultérieurement.";
      
      await orderService.updateOrderStatus(orderId, status, comment, handlerName, price || "");
      setOrders(orders.filter(o => o.id !== orderId));
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="processing-page">
      <style jsx>{`
        .header { margin-bottom: 32px; }
        .order-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 32px;
          transition: var(--transition);
        }
        .order-card:hover { border-color: var(--primary); }
        .badge { padding: 4px 12px; border-radius: 50px; font-size: 0.7rem; font-weight: 800; background: rgba(59, 130, 246, 0.1); color: var(--primary); text-transform: uppercase; }
        
        .price-input-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-width: 280px;
        }

        input {
            background: var(--background);
            border: 1px solid var(--border);
            padding: 12px 16px;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            width: 100%;
        }

        .actions-row {
            display: flex;
            gap: 10px;
        }

        .btn-process {
          flex: 2;
          background: var(--success);
          color: white;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.85rem;
          transition: var(--transition);
        }
        .btn-cancel {
          flex: 1;
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.85rem;
          transition: var(--transition);
        }
        .btn-cancel:hover { background: var(--danger); color: white; }

        .btn-process:disabled {
            opacity: 0.3;
            cursor: not-allowed;
            filter: grayscale(1);
        }
        .valuation-alert {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
            padding: 12px 20px;
            border-radius: 12px;
            font-size: 0.85rem;
            margin-bottom: 24px;
            border-left: 4px solid var(--warning);
        }
      `}</style>

      <div className="header">
        <h1 className="text-gradient">Traitements & Décisions</h1>
        <p className="text-muted">Gérez les demandes validées : valorisez pour clôturer ou annulez si nécessaire.</p>
      </div>

      <div className="valuation-alert">
        ⚠️ <strong>Ouvrage Supervisé :</strong> Les validateurs (Bahloul, Ouali, Belhocine) et les traitants (Lamine, Amina) peuvent désormais clôturer ou annuler ces demandes.
      </div>

      <div className="orders-list">
        {isLoading ? (
          <div className="text-center py-10">Chargement...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 text-muted">Aucune demande validée en attente de décision finale.</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card">
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="badge">{order.type}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Demande de {order.user_name} • Approuvée par {order.validator_name || "Admin"}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>{order.description}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Quantité: <strong>{order.quantity}</strong></p>
              </div>

              <div className="price-input-container">
                <input 
                    type="number" 
                    placeholder="Saisir prix DZD..." 
                    value={prices[order.id!] || ""}
                    onChange={(e) => setPrices({...prices, [order.id!]: e.target.value})}
                />
                <div className="actions-row">
                    <button 
                        className="btn-cancel" 
                        onClick={() => handleProcess(order.id!, "Annulée")}
                    >
                        Annuler
                    </button>
                    <button 
                        className="btn-process" 
                        disabled={!prices[order.id!] || prices[order.id!].trim() === ""}
                        onClick={() => handleProcess(order.id!, "Traitée")}
                    >
                        Clôturer (Payée)
                    </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
