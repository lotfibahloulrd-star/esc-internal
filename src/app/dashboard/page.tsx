"use client";

import React, { useEffect, useState } from "react";
import { orderService, Order, isAdmin } from "@/lib/orderService";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"All" | "En attente" | "Validée" | "Traitée" | "Rejetée">("All");

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

  const filteredOrders = activeFilter === "All" 
    ? orders 
    : orders.filter(o => o.status === activeFilter);

  const stats = [
    { type: "All", label: "Total Demandes", value: orders.length.toString(), icon: "📦", color: "#3b82f6" },
    { type: "En attente", label: "En Attente", value: orders.filter(o => o.status === "En attente").length.toString(), icon: "⏳", color: "#f59e0b" },
    { type: "Validée", label: "Validées", value: orders.filter(o => o.status === "Validée").length.toString(), icon: "✅", color: "#10b981" },
    { type: "Traitée", label: "Traitées", value: orders.filter(o => o.status === "Traitée").length.toString(), icon: "🚚", color: "#8b5cf6" },
    { type: "Rejetée", label: "Rejetées", value: orders.filter(o => o.status === "Rejetée").length.toString(), icon: "❌", color: "#ef4444" },
  ];

  return (
    <div className="dashboard-content animate-fade-in">
      <style jsx>{`
        .welcome-header { margin-bottom: 40px; }
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 20px; 
          margin-bottom: 48px; 
        }
        .stat-card {
          padding: 24px;
          border-radius: 24px;
          background: var(--surface);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: var(--transition);
          position: relative;
        }
        .stat-card:hover { 
          transform: translateY(-5px); 
          border-color: rgba(255,255,255,0.2);
          background: var(--surface-hover);
        }
        .stat-card.active {
          border-color: var(--primary);
          background: rgba(59, 130, 246, 0.1);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
        }
        .stat-icon { font-size: 1.8rem; margin-bottom: 12px; display: block; }
        .stat-label { color: var(--text-muted); font-size: 0.85rem; font-weight: 500; }
        .stat-value { font-size: 1.8rem; font-weight: 800; }

        .list-container {
          background: var(--surface);
          border-radius: 32px;
          border: 1px solid var(--border);
          padding: 32px;
          backdrop-filter: blur(10px);
        }
        .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 16px; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--border); }
        td { padding: 16px; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
        
        .user-info { display: flex; align-items: center; gap: 10px; }
        .avatar-sm { width: 28px; height: 28px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; }
        
        .status-tag {
          padding: 4px 10px;
          border-radius: 50px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
        }
      `}</style>

      <div className="welcome-header">
        <h1 className="text-gradient">Tableau de Bord</h1>
        <p className="text-muted">Cliquez sur une catégorie pour filtrer les demandes.</p>
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
            {activeFilter === stat.type && (
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', fontSize: '1rem' }}>🎯</div>
            )}
          </div>
        ))}
      </div>

      <div className="list-container">
        <div className="table-header">
          <h2 style={{ fontSize: '1.25rem' }}>
            {activeFilter === "All" ? "Toutes les demandes" : `Demandes : ${activeFilter}`}
          </h2>
          <div className="badge" style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: '50px', fontSize: '0.8rem' }}>
            {filteredOrders.length} résultat(s)
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Chargement des données...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Demandeur</th>
                  <th>Article / Description</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Validateur / Traitant</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Aucune donnée disponible.</td></tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="animate-fade-in">
                      <td>
                        <div className="user-info">
                          <div className="avatar-sm">{order.user_name.charAt(0)}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{order.user_name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{order.user_email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{order.description}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qté: {order.quantity}</div>
                      </td>
                      <td><span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{order.type}</span></td>
                      <td>
                        <span className="status-tag" style={{ 
                          background: order.status === "Validée" ? "rgba(16, 185, 129, 0.1)" : 
                                     order.status === "En attente" ? "rgba(245, 158, 11, 0.1)" : 
                                     order.status === "Traitée" ? "rgba(139, 92, 246, 0.1)" : "rgba(239, 68, 68, 0.1)",
                          color: order.status === "Validée" ? "#10b981" : 
                                 order.status === "En attente" ? "#f59e0b" : 
                                 order.status === "Traitée" ? "#8b5cf6" : "#ef4444"
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        {order.validator_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.9rem' }}>👤</span>
                            <span>{order.validator_name}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>Non traité</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {order.created_at ? (order.created_at.toDate?.().toLocaleDateString() || new Date(order.created_at).toLocaleDateString()) : '-'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: "40px", fontSize: "0.7rem", color: "var(--border)" }}>
        Version 1.3 - Dashboard Interactif & Traçabilité Active
      </div>
    </div>
  );
}
