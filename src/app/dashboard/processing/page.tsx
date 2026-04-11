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
      if (role !== "Service Traitement" && role !== "Super Administrateur") {
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

  const handleProcess = async (orderId: string) => {
    const price = prices[orderId];
    if (!price || price.trim() === "") {
        alert("Le prix est obligatoire pour clôturer la commande.");
        return;
    }

    if (!confirm(`Clôturer cette commande avec un prix de ${price} DZD ?`)) return;
    
    try {
      const user = auth.currentUser;
      const handlerName = user?.displayName || user?.email?.split('@')[0] || "Gestionnaire";
      await orderService.updateOrderStatus(orderId, "Traitée", "Commande traitée, valorisée et finalisée.", handlerName, price);
      setOrders(orders.filter(o => o.id !== orderId));
    } catch (err) {
      alert("Erreur lors du traitement");
    }
  };

  return (
    <div className="processing-page animate-fade-in">
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
            gap: 8px;
            min-width: 250px;
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

        .btn-process {
          background: var(--success);
          color: white;
          padding: 14px 24px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.9rem;
          transition: var(--transition);
          white-space: nowrap;
        }
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
        <h1 className="text-gradient">Traitement & Valorisation</h1>
        <p className="text-muted">Saisissez obligatoirement le prix pour clôturer les demandes.</p>
      </div>

      <div className="valuation-alert">
        ⚠️ <strong>Important :</strong> Toutes les commandes ci-dessous sont en instance de valorisation financière. Lamine et Amina doivent renseigner le prix avant clôture.
      </div>

      <div className="orders-list">
        {isLoading ? (
          <div className="text-center py-10">Chargement...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 text-muted">Aucune commande en attente de valorisation.</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card">
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="badge">{order.type}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Demande de {order.user_name} • {new Date(order.created_at?.toDate?.() || order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>{order.description}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Quantité demandée: <strong>{order.quantity}</strong></p>
              </div>

              <div className="price-input-container">
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PRIX UNITAIRE (DZD)</label>
                <input 
                    type="number" 
                    placeholder="0.00" 
                    value={prices[order.id!] || ""}
                    onChange={(e) => setPrices({...prices, [order.id!]: e.target.value})}
                />
                <button 
                    className="btn-process" 
                    disabled={!prices[order.id!] || prices[order.id!].trim() === ""}
                    onClick={() => handleProcess(order.id!)}
                >
                    Clôturer & Valoriser
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
