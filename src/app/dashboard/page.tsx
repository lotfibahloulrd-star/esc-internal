"use client";

import React, { useEffect, useState } from "react";
import { orderService, Order, isAdmin } from "@/lib/orderService";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"All" | "En attente" | "Validée" | "Valorisation" | "Traitée" | "Rejetée" | "Annulée">("All");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState("");

  const user = auth.currentUser;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        fetchData(u.email);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (email: string | null) => {
    setIsLoading(true);
    try {
      const data = isAdmin(email) 
        ? await orderService.getAllOrders() 
        : await orderService.getMyOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderStatus = (order: Order) => {
      if (order.status === "Validée" && !order.price) return "Valorisation";
      return order.status;
  };

  const handleUpdatePrice = async (orderId: string) => {
      try {
          // Utilise updateOrderStatus pour mettre à jour le prix sans changer le statut
          await orderService.updateOrderStatus(orderId, "Traitée", "Prix rectifié par SuperAdmin.", "SuperAdmin", newPrice);
          setEditingPriceId(null);
          fetchData(user?.email || "");
      } catch (err) {
          alert("Erreur lors de la mise à jour");
      }
  };

  const filteredOrders = activeFilter === "All" 
    ? orders 
    : orders.filter(o => getOrderStatus(o) === activeFilter);

  const stats = [
    { type: "All", label: "Total demandes", value: orders.length.toString(), icon: "📦", color: "#3b82f6" },
    { type: "En attente", label: "En attente", value: orders.filter(o => o.status === "En attente").length.toString(), icon: "⏳", color: "#f59e0b" },
    { type: "Valorisation", label: "À valoriser", value: orders.filter(o => o.status === "Validée" && !o.price).length.toString(), icon: "💰", color: "#f97316" },
    { type: "Traitée", label: "Clôturées", value: orders.filter(o => o.status === "Traitée").length.toString(), icon: "🏁", color: "#10b981" },
    { type: "Annulée", label: "Annulées", value: orders.filter(o => o.status === "Annulée").length.toString(), icon: "🚫", color: "#ef4444" },
  ];

  return (
    <div className="dashboard-content animate-fade-in">
      <style jsx>{`
        .welcome-header { margin-bottom: 40px; }
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); 
          gap: 12px; 
          margin-bottom: 48px; 
        }
        .stat-card {
          padding: 24px;
          border-radius: 20px;
          background: white;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: var(--transition);
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: var(--primary); }
        .stat-card.active { border-color: var(--primary); background: rgba(59, 130, 246, 0.05); }
        .stat-icon { font-size: 1.5rem; margin-bottom: 12px; display: block; }
        .stat-label { color: #64748b; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .stat-value { font-size: 1.8rem; font-weight: 800; color: #0f172a; }

        .list-container {
          background: white;
          border-radius: 32px;
          border: 1px solid var(--border);
          padding: 32px;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
        }
        .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 16px; color: #64748b; font-size: 0.7rem; text-transform: uppercase; border-bottom: 1px solid var(--border); }
        td { padding: 16px; border-bottom: 1px solid var(--border); font-size: 0.85rem; color: #1e293b; }
        
        .status-tag {
          padding: 4px 10px;
          border-radius: 50px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .price-tag {
            background: rgba(37, 99, 235, 0.08);
            color: var(--primary);
            padding: 6px 12px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 0.85rem;
        }
        .btn-edit-price {
            border: none; background: none; color: var(--primary); font-size: 0.7rem; font-weight: 700; cursor: pointer; text-decoration: underline; margin-left: 10px;
        }
        .edit-input { width: 100px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--primary); font-size: 0.8rem; }
      `}</style>

      <div className="welcome-header">
        <h1 className="text-gradient">Supervision Totale</h1>
        <p className="text-muted">Bonjour {user?.displayName || 'Admin'}, vous avez les pleins pouvoirs sur le flux.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div 
            key={stat.type} 
            className={`stat-card ${activeFilter === stat.type ? 'active' : ''}`}
            onClick={() => setActiveFilter(stat.type as any)}
          >
            <span className="stat-icon">{stat.icon}</span>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="list-container animate-fade-in">
        <div className="table-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Liste Master : {activeFilter === "All" ? "Toutes les catégories" : activeFilter}</h2>
          <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{filteredOrders.length} demande(s) trouvée(s)</div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Chargement...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Demandeur</th>
                  <th>Article / Objet</th>
                  <th>Prix (DZD)</th>
                  <th>Statut du dossier</th>
                  <th>Validateur</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Aucune demande disponible.</td></tr>
                ) : (
                  filteredOrders.map((order) => {
                    const displayStatus = getOrderStatus(order);
                    return (
                      <tr key={order.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{order.user_name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{order.user_email}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{order.description}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Qté: {order.quantity} | {order.type}</div>
                        </td>
                        <td>
                          {editingPriceId === order.id ? (
                              <div className="flex gap-2">
                                  <input 
                                    className="edit-input" 
                                    type="number" 
                                    value={newPrice} 
                                    onChange={e => setNewPrice(e.target.value)} 
                                    autoFocus
                                  />
                                  <button onClick={() => handleUpdatePrice(order.id!)} style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 800 }}>✓</button>
                                  <button onClick={() => setEditingPriceId(null)} style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 800 }}>✕</button>
                              </div>
                          ) : (
                            <div className="flex items-center">
                                {order.price ? (
                                    <span className="price-tag">{order.price} DZD</span>
                                ) : (
                                    <span style={{ color: '#f97316', fontWeight: 800, fontSize: '0.7rem' }}>NON VALORISÉE</span>
                                )}
                                {isAdmin(user?.email) && order.status === "Traitée" && (
                                    <button className="btn-edit-price" onClick={() => {
                                        setEditingPriceId(order.id!);
                                        setNewPrice(order.price || "");
                                    }}>Rectifier</button>
                                )}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="status-tag" style={{ 
                            background: displayStatus === "Valorisation" ? "rgba(249, 115, 22, 0.1)" :
                                       displayStatus === "Traitée" ? "rgba(16, 185, 129, 0.1)" : 
                                       displayStatus === "Annulée" ? "rgba(239, 68, 68, 0.1)" : 
                                       displayStatus === "Validée" ? "rgba(37, 99, 235, 0.1)" : 
                                       displayStatus === "En attente" ? "rgba(100, 116, 139, 0.1)" : "rgba(100, 116, 139, 0.1)",
                            color: displayStatus === "Valorisation" ? "#f97316" :
                                   displayStatus === "Traitée" ? "#10b981" : 
                                   displayStatus === "Annulée" ? "#ef4444" : 
                                   displayStatus === "Validée" ? "#2563eb" : "#64748b"
                          }}>
                            {displayStatus === "Valorisation" ? "À valoriser" : displayStatus}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{order.validator_name || "---"}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            {order.created_at ? (order.created_at.toDate?.().toLocaleDateString() || new Date(order.created_at).toLocaleDateString()) : '-'}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: "40px", fontSize: "0.7rem", color: "#94a3b8" }}>
        Système de Supervision Intégrale ESC-Internal v1.8
      </div>
    </div>
  );
}
