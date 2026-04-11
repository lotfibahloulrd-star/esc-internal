"use client";

import React, { useEffect, useState } from "react";
import { orderService, Order } from "@/lib/orderService";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function FinancePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const data = await orderService.getAllOrders();
        setOrders(data.filter(o => o.status === "Traitée"));
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyOrders = orders.filter(o => {
    const date = o.created_at?.toDate?.() || new Date(o.created_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalMonthly = monthlyOrders.reduce((sum, o) => sum + (parseFloat(o.price || "0")), 0);
  const totalGlobal = orders.reduce((sum, o) => sum + (parseFloat(o.price || "0")), 0);

  const categories = ["Equipment", "Consumable IT", "Office", "Cleaning"].reduce((acc, cat) => {
    acc[cat] = monthlyOrders.filter(o => o.type.includes(cat)).reduce((sum, o) => sum + (parseFloat(o.price || "0")), 0);
    return acc;
  }, {} as any);

  return (
    <div className="finance-page animate-fade-in">
      <style jsx>{`
        .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 40px; }
        .card { background: white; padding: 32px; border-radius: 28px; border: 1px solid var(--border); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        .amount { font-size: 2.5rem; font-weight: 800; color: var(--primary); margin: 12px 0; }
        .cat-list { margin-top: 24px; }
        .cat-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed var(--border); }
      `}</style>

      <div className="header mb-10">
        <h1 className="text-gradient">Analytique Financière</h1>
        <p className="text-muted">Suivi des dépenses et valorisations mensuelles.</p>
      </div>

      {isLoading ? (
        <div>Chargement du rapport...</div>
      ) : (
        <>
          <div className="stats-row">
            <div className="card">
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>DÉPENSES DU MOIS (DZD)</span>
              <div className="amount">{totalMonthly.toLocaleString()} </div>
              <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>↑ Volume: {monthlyOrders.length} commandes clôturées</p>
            </div>
            <div className="card">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>TOTAL GÉNÉRAL VALORISÉ</span>
                <div className="amount" style={{ color: '#0f172a' }}>{totalGlobal.toLocaleString()} </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Période: Année 2026</p>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Répartition par Catégorie (Mois en cours)</h2>
            <div className="cat-list">
              {Object.entries(categories).map(([cat, val]: any) => (
                <div key={cat} className="cat-item">
                  <span style={{ fontWeight: 600 }}>{cat}</span>
                  <span style={{ fontWeight: 800 }}>{val.toLocaleString()} DZD</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginTop: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Historique de Valorisation</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', fontSize: '0.75rem', color: '#64748b' }}>
                  <th style={{ padding: '12px' }}>DATE</th>
                  <th>ARTICLE</th>
                  <th>DEMANDEUR</th>
                  <th>TRAITANT</th>
                  <th style={{ textAlign: 'right' }}>MONTANT (DZD)</th>
                </tr>
              </thead>
              <tbody>
                {monthlyOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '12px' }}>{new Date(o.created_at?.toDate?.() || o.created_at).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>{o.description}</td>
                    <td>{o.user_name}</td>
                    <td style={{ fontStyle: 'italic', color: '#64748b' }}>{o.validator_name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>{parseFloat(o.price || "0").toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
