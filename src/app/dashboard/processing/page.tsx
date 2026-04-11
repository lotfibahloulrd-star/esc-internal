"use client";

import React, { useEffect, useState } from "react";
import { orderService, Order, getRoleLabel } from "@/lib/orderService";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ProcessingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
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
    if (!confirm("Marquer cette commande comme traitée ?")) return;
    
    try {
      const user = auth.currentUser;
      const handlerName = user?.displayName || user?.email?.split('@')[0] || "Gestionnaire";
      await orderService.updateOrderStatus(orderId, "Traitée", "Commande traitée et finalisée.", handlerName);
      setOrders(orders.filter(o => o.id !== orderId));
    } catch (err) {
      alert("Erreur lors du traitement");
    }
  };

  return (
    <div className="processing-page">
      <style jsx>{`
        .header {
          margin-bottom: 32px;
        }
        .order-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: var(--transition);
        }
        .order-card:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
        }
        .badge {
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 700;
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary);
        }
        .btn-process {
          background: var(--success);
          color: white;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: var(--transition);
        }
        .btn-process:hover {
          background: #059669;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
      `}</style>

      <div className="header">
        <h1 className="text-gradient">Traitement des Commandes</h1>
        <p className="text-muted">Commandes validées en attente de traitement par votre service.</p>
      </div>

      <div className="orders-list">
        {isLoading ? (
          <div className="text-center py-10">Chargement...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 text-muted">Aucune commande en attente de traitement.</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="badge">{order.type}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Par {order.user_name} • {new Date(order.created_at?.toDate?.() || order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{order.description}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Quantité: {order.quantity} • Urgence: {order.urgency}</p>
              </div>
              <button className="btn-process" onClick={() => handleProcess(order.id!)}>
                Marquer comme Traitée
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
