"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { orderService, Order, isAdmin } from "@/lib/orderService";

export default function ValidationsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || !isAdmin(user.email)) {
        router.push("/dashboard");
      } else {
        fetchPendingOrders();
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchPendingOrders = async () => {
    setIsLoading(true);
    try {
      const data = await orderService.getAllOrders();
      setOrders(data.filter(o => o.status === "En attente"));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (status: "Validée" | "Rejetée") => {
    if (!selectedOrder?.id) return;
    setIsLoading(true);
    try {
      await orderService.updateOrderStatus(selectedOrder.id, status, comment);
      setSelectedOrder(null);
      setComment("");
      fetchPendingOrders();
    } catch (error) {
      alert("Erreur lors du traitement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="validations-page">
      <style jsx>{`
        .table-card {
          background: var(--surface);
          border-radius: 24px;
          border: 1px solid var(--border);
          overflow: hidden;
        }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 20px 32px; background: rgba(255, 255, 255, 0.02); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--border); }
        td { padding: 20px 32px; border-bottom: 1px solid var(--border); }
        .btn-action { padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; }
        .btn-validate { background: var(--success); color: white; }
        .btn-reject { background: var(--danger); color: white; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: var(--surface); width: 100%; max-width: 500px; padding: 40px; border-radius: 32px; border: 1px solid var(--border); }
        textarea { width: 100%; background: var(--background); border: 1px solid var(--border); padding: 12px; border-radius: 10px; color: white; margin-top: 10px; }
      `}</style>

      <div style={{ marginBottom: "32px" }}>
        <h1 className="text-gradient">Validations</h1>
        <p className="text-muted">Traitez les demandes de fournitures en attente.</p>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Demandeur</th>
              <th>Type</th>
              <th>Description</th>
              <th>Quantité</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: "center" }}>Chargement...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center" }}>Aucune demande en attente.</td></tr>
            ) : orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{order.user_name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{order.user_email}</div>
                </td>
                <td>{order.type}</td>
                <td>{order.description}</td>
                <td>{order.quantity}</td>
                <td>
                  <button className="btn-action btn-validate" onClick={() => setSelectedOrder(order)}>Traiter</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Décision : Commande #{selectedOrder.id?.slice(0,8)}</h2>
            <p style={{ marginTop: "16px", color: "var(--text-muted)" }}>
              {selectedOrder.user_name} demande {selectedOrder.quantity} de {selectedOrder.description}.
            </p>
            
            <div style={{ marginTop: "24px" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Commentaire / Motif (Optionnel)</label>
              <textarea 
                rows={3} 
                placeholder="Ex: Validé pour achat immédiat..." 
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>

            <div className="flex gap-4" style={{ marginTop: "32px" }}>
              <button className="btn-action btn-reject w-full" onClick={() => handleDecision("Rejetée")}>Refuser</button>
              <button className="btn-action btn-validate w-full" onClick={() => handleDecision("Validée")}>Approuver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
