"use client";

import React, { useEffect, useState } from "react";
import { orderService, Order, isAdmin } from "@/lib/orderService";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"All" | "En attente" | "Validée" | "Valorisation" | "Traitée" | "Rejetée" | "Annulée">("All");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const data = isAdmin(user.email) 
            ? await orderService.getAllOrders() 
            : await orderService.getMyOrders();
          setOrders(data);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const getOrderStatus = (order: Order) => {
      if (order.status === "Validée" && !order.price) return "Valorisation";
      return order.status;
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
    { type: "Rejetée", label: "Rejetées", value: orders.filter(o => o.status === "Rejetée").length.toString(), icon: "❌", color: "#64748b" },
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
          padding: 20px;
          border-radius: 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: var(--transition);
          position: relative;
          text-align: center;
        }
        .stat-card:hover { transform: translateY(-3px); background: var(--surface-hover); }
        .stat-card.active { border-color: var(--primary); background: rgba(59, 130, 246, 0.1); }
        .stat-icon { font-size: 1.2rem; margin-bottom: 8px; display: block; }
        .stat-label { color: var(--text-muted); font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .stat-value { font-size: 1.5rem; font-weight: 800; }

        .list-container {
          background: var(--surface);
          border-radius: 32px;
          border: 1px solid var(--border);
          padding: 32px;
          backdrop-filter: blur(10px);
        }
        .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 16px; color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; border-bottom: 1px solid var(--border); }
        td { padding: 16px; border-bottom: 1px solid var(--border); font-size: 0.85rem; }
        
        .status-tag {
          padding: 4px 10px;
          border-radius: 50px;
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .price-tag {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 0.8rem;
        }
      `}</style>

      <div className="welcome-header">
        <h1 className="text-gradient">Supervision des Commandes</h1>
        <p className="text-muted">Vue d'ensemble et contrôle du flux de valorisation financière.</p>
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

      <div className="list-container">
        <div className="table-header">
          <h2 style={{ fontSize: '1.25rem' }}>聚焦 : {activeFilter === "All" ? "Toutes les demandes" : activeFilter}</h2>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Chargement...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Demandeur</th>
                  <th>Article</th>
                  <th>Prix (DZD)</th>
                  <th>Statut</th>
                  <th>Dernière Action</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Aucune donnée.</td></tr>
                ) : (
                  filteredOrders.map((order) => {
                    const displayStatus = getOrderStatus(order);
                    return (
                      <tr key={order.id} className="animate-fade-in">
                        <td>
                          <div style={{ fontWeight: 600 }}>{order.user_name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{order.user_email}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{order.description}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qté: {order.quantity}</div>
                        </td>
                        <td>
                          {order.price ? (
                            <span className="price-tag">{order.price} DZD</span>
                          ) : displayStatus === "Valorisation" ? (
                            <span style={{ color: '#f97316', fontSize: '0.7rem', fontWeight: 800 }}>À VALORISER</span>
                          ) : <span style={{ opacity: 0.3 }}>-</span>}
                        </td>
                        <td>
                          <span className="status-tag" style={{ 
                            background: displayStatus === "Valorisation" ? "rgba(249, 115, 22, 0.1)" :
                                       displayStatus === "Traitée" ? "rgba(16, 185, 129, 0.1)" : 
                                       displayStatus === "Annulée" ? "rgba(239, 68, 68, 0.1)" : 
                                       displayStatus === "Validée" ? "rgba(59, 130, 246, 0.1)" : 
                                       displayStatus === "En attente" ? "rgba(245, 158, 11, 0.1)" : "rgba(255,255,255,0.05)",
                            color: displayStatus === "Valorisation" ? "#f97316" :
                                   displayStatus === "Traitée" ? "#10b981" : 
                                   displayStatus === "Annulée" ? "#ef4444" : 
                                   displayStatus === "#3b82f6" ? "#3b82f6" : "#f59e0b"
                          }}>
                            {displayStatus === "Valorisation" ? "À valoriser" : displayStatus}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.8rem' }}>👤</span>
                            <span style={{ fontWeight: 500 }}>{order.validator_name || "En cours"}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem' }}>
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

      <div style={{ textAlign: "center", marginTop: "40px", fontSize: "0.7rem", color: "var(--border)" }}>
        Version 1.6 - Contrôle de Traitement Universel
      </div>
    </div>
  );
}
