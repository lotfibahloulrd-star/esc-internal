"use client";

import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { orderService, Order } from "@/lib/orderService";

export default function MyRequestsPage() {
  const [showModal, setShowModal] = useState(false);
  const [requests, setRequests] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [type, setType] = useState("Bureautique");
  const [desc, setDesc] = useState("");
  const [urgency, setUrgency] = useState("Normale");
  const [qty, setQty] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await orderService.getMyOrders();
      setRequests(data);
    } catch (error) {
      console.error("Erreur lors de la récupération:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      await orderService.createOrder({
        user_email: user.email!,
        user_name: user.displayName || user.email!,
        type,
        description: desc,
        quantity: qty,
        urgency,
      });

      setShowModal(false);
      setDesc("");
      setQty("");
      fetchRequests();
    } catch (error) {
      alert("Erreur lors de l'envoi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="requests-page">
      <style jsx>{`
        .header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .btn-new {
          background: var(--primary);
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: var(--transition);
        }

        .btn-new:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
        }

        .table-card {
          background: var(--surface);
          border-radius: 24px;
          border: 1px solid var(--border);
          overflow: hidden;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 20px 32px;
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-muted);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-bottom: 1px solid var(--border);
        }

        td {
          padding: 20px 32px;
          border-bottom: 1px solid var(--border);
          font-size: 0.95rem;
        }

        tr:last-child td {
          border-bottom: none;
        }

        .status-pill {
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: var(--surface);
          width: 100%;
          max-width: 500px;
          padding: 40px;
          border-radius: 32px;
          border: 1px solid var(--border);
          animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes zoomIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; color: var(--text-muted); font-size: 0.85rem; }
        input, select, textarea {
          width: 100%; background: var(--background); border: 1px solid var(--border);
          padding: 12px; border-radius: 10px; color: white;
        }
      `}</style>

      <div className="header-actions">
        <div>
          <h1 className="text-gradient">Mes Demandes</h1>
          <p className="text-muted">Suivez l'état de vos commandes de fournitures.</p>
        </div>
        <button className="btn-new" onClick={() => setShowModal(true)}>
          <span>➕</span> Nouvelle Demande
        </button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Urgence</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: "center" }}>Chargement...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center" }}>Aucune demande trouvée.</td></tr>
            ) : requests.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 700, color: "var(--primary)" }}>{r.id?.slice(0, 8)}</td>
                <td>{r.created_at ? (r.created_at.toDate ? r.created_at.toDate().toLocaleDateString() : new Date(r.created_at).toLocaleDateString()) : "-"}</td>
                <td>{r.type}</td>
                <td>{r.description}</td>
                <td>
                  <span style={{ color: r.urgency === "Haute" ? "var(--warning)" : "inherit" }}>
                    {r.urgency === "Haute" ? "🔥 " : r.urgency === "Critique" ? "🚨 " : "⚪ "}{r.urgency}
                  </span>
                </td>
                <td>
                  <span className="status-pill" style={{ 
                    background: r.status === "Validée" ? "rgba(16, 185, 129, 0.1)" : 
                                r.status === "En attente" ? "rgba(59, 130, 246, 0.1)" : "rgba(255,255,255,0.05)",
                    color: r.status === "Validée" ? "var(--success)" : 
                           r.status === "En attente" ? "var(--primary)" : "var(--text-muted)"
                  }}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: "24px" }}>Nouvelle Demande</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type de fourniture</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  <option value="Bureautique">Bureautique</option>
                  <option value="Informatique">Informatique</option>
                  <option value="Consommable">Consommable</option>
                  <option value="Détergents">Détergents</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label>Détails du besoin</label>
                <textarea 
                  rows={3} 
                  placeholder="Détaillez votre besoin ici..." 
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Quantité</label>
                <input 
                  type="text"
                  placeholder="Ex: 5 rames" 
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Urgence</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                >
                  <option value="Normale">⚡ Normale</option>
                  <option value="Haute">🔥 Haute</option>
                  <option value="Critique">🚨 Critique</option>
                </select>
              </div>
              <div className="flex gap-4" style={{ marginTop: "32px" }}>
                <button type="button" className="nav-link w-full" style={{ textAlign: "center", border: "1px solid var(--border)" }} onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-new w-full" style={{ justifyContent: "center" }} disabled={isLoading}>
                  {isLoading ? "Envoi..." : "Soumettre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
