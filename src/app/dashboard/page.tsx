"use client";

import React, { useEffect, useState } from "react";
import { orderService, Order, isAdmin } from "@/lib/orderService";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const stats = [
    { label: "Total Demandes", value: orders.length.toString(), icon: "📦", color: "var(--primary)" },
    { label: "En Attente", value: orders.filter(o => o.status === "En attente").length.toString(), icon: "⏳", color: "var(--warning)" },
    { label: "Validées", value: orders.filter(o => o.status === "Validée").length.toString(), icon: "✅", color: "var(--success)" },
    { label: "Rejetées", value: orders.filter(o => o.status === "Rejetée").length.toString(), icon: "❌", color: "var(--danger)" },
  ];

  return (
    <div className="dashboard-content">
      <style jsx>{`
        .welcome-header {
          margin-bottom: 48px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .stat-card {
          padding: 32px;
          border-radius: 24px;
          background: var(--surface);
          border: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }

        .stat-icon {
          font-size: 2rem;
          margin-bottom: 16px;
          display: block;
        }

        .stat-label {
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 800;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .activity-card {
          background: var(--surface);
          border-radius: 24px;
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .activity-item {
          padding: 20px 32px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: var(--transition);
        }

        .activity-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 12px;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }
      `}</style>

      <div className="welcome-header">
        <h1 className="text-gradient">Tableau de Bord</h1>
        <p className="text-muted">Aperçu en temps réel des commandes internes d'ESC Algérie.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card shimmer-effect">
            <span className="stat-icon">{stat.icon}</span>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="recent-activity">
        <h3 className="section-title">
          <span>🕒</span> Activité Récente
        </h3>
        <div className="activity-card">
          {isLoading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>Chargement...</div>
          ) : orders.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center" }}>Aucune activité.</div>
          ) : orders.slice(0, 5).map((order) => (
            <div key={order.id} className="activity-item">
              <div className="flex">
                <span className="dot" style={{ 
                  background: order.status === "Validée" ? "var(--success)" : 
                             order.status === "En attente" ? "var(--primary)" : 
                             order.status === "Rejetée" ? "var(--danger)" : "var(--secondary)" 
                }}></span>
                <div>
                  <div style={{ fontWeight: 600 }}>{order.description}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Par {order.user_name} • {order.created_at ? (order.created_at.toDate ? order.created_at.toDate().toLocaleDateString() : new Date(order.created_at).toLocaleDateString()) : ""}
                  </div>
                </div>
              </div>
              <span className="status-badge" style={{ 
                background: order.status === "Validée" ? "rgba(16, 185, 129, 0.1)" : 
                           order.status === "En attente" ? "rgba(59, 130, 246, 0.1)" : "rgba(255,255,255,0.05)",
                color: order.status === "Validée" ? "var(--success)" : 
                       order.status === "En attente" ? "var(--primary)" : "var(--text-muted)"
              }}>{order.status}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: "40px", fontSize: "0.7rem", color: "var(--border)" }}>
        Version 1.2 - Déploiement Automatique Actif
      </div>
    </div>
  );
}
