"use client";

import React, { useEffect, useState } from "react";
import { orderService, Order, isAdmin, isMasterAdmin } from "@/lib/orderService";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"All" | "En attente" | "Validée" | "Valorisation" | "Traitée" | "Rejetée" | "Annulée">("All");
  
  // Master Edit State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState<Partial<Order>>({});

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
      
      // Tri intelligent par statut
      const statusPriority: {[key: string]: number} = {
          "En attente": 1,
          "Validée": 2, // Sera subdivisé en Valorisation/Validée
          "Traitée": 3,
          "Annulée": 4,
          "Rejetée": 5
      };

      const sortedData = [...data].sort((a, b) => {
          const pA = statusPriority[a.status] || 99;
          const pB = statusPriority[b.status] || 99;
          if (pA !== pB) return pA - pB;
          // Si même statut, tri par date (plus récent en haut)
          const dateA = a.created_at?.toDate?.() || new Date(a.created_at);
          const dateB = b.created_at?.toDate?.() || new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
      });

      setOrders(sortedData);
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

  const openMasterEdit = (order: Order) => {
      if (!isMasterAdmin(user?.email)) return;
      setSelectedOrder(order);
      setEditForm({ ...order });
  };

  const handleMasterSave = async () => {
      if (!selectedOrder?.id) return;
      try {
          await orderService.masterUpdateOrder(selectedOrder.id, editForm);
          setSelectedOrder(null);
          fetchData(user?.email || "");
          alert("Modification maître réussie !");
      } catch (err) {
          alert("Erreur lors de la modification maître");
      }
  };

  const filteredOrders = activeFilter === "All" 
    ? orders 
    : orders.filter(o => getOrderStatus(o) === activeFilter);

  const stats = [
    { type: "All", label: "Toutes", value: orders.length.toString(), icon: "📦", color: "#3b82f6" },
    { type: "En attente", label: "En attente", value: orders.filter(o => o.status === "En attente").length.toString(), icon: "⏳", color: "#f59e0b" },
    { type: "Valorisation", label: "Valorisation", value: orders.filter(o => o.status === "Validée" && !o.price).length.toString(), icon: "💰", color: "#f97316" },
    { type: "Traitée", label: "Traitées", value: orders.filter(o => o.status === "Traitée").length.toString(), icon: "🏁", color: "#10b981" },
    { type: "Rejetée", label: "Rejetées", value: orders.filter(o => o.status === "Rejetée").length.toString(), icon: "❌", color: "#64748b" },
    { type: "Annulée", label: "Annulées", value: orders.filter(o => o.status === "Annulée").length.toString(), icon: "🚫", color: "#ef4444" },
  ];

  return (
    <div className="dashboard-content animate-fade-in">
      <style jsx>{`
        .welcome-header { margin-bottom: 32px; }
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); 
          gap: 12px; 
          margin-bottom: 40px; 
        }
        .stat-card {
          padding: 20px;
          border-radius: 20px;
          background: white;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: var(--transition);
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
        }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); border-color: var(--primary); }
        .stat-card.active { border-color: var(--primary); background: rgba(37, 99, 235, 0.05); }
        .stat-icon { font-size: 1.3rem; margin-bottom: 8px; display: block; }
        .stat-label { color: #64748b; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; }

        .list-container {
          background: white;
          border-radius: 32px;
          border: 1px solid var(--border);
          padding: 32px;
        }
        
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 16px; color: #64748b; font-size: 0.7rem; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
        td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; color: #1e293b; }
        
        tr.clickable { cursor: pointer; }
        tr.clickable:hover { background: #f8fafc; }

        .status-tag {
          padding: 4px 10px;
          border-radius: 50px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        /* Modal Styles */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: white; width: 100%; max-width: 600px; padding: 40px; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); }
        .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        label { font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
        input, select, textarea { padding: 12px; border: 1px solid var(--border); border-radius: 12px; font-size: 0.9rem; }
      `}</style>

      <div className="welcome-header flex justify-between">
        <div>
          <h1 className="text-gradient">Pilotage des Commandes</h1>
          <p className="text-muted">Bonjour {user?.displayName || 'Admin'}. {isMasterAdmin(user?.email) && "Cliquez sur une ligne pour l'éditer."}</p>
        </div>
        <div style={{ background: '#f1f5f9', padding: '8px 20px', borderRadius: '50px', height: 'fit-content', fontSize: '0.8rem', fontWeight: 600 }}>
          {orders.filter(o => o.status === 'En attente').length} Dossiers Urgents ⏳
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.type} className={`stat-card ${activeFilter === stat.type ? 'active' : ''}`} onClick={() => setActiveFilter(stat.type as any)}>
            <span className="stat-icon">{stat.icon}</span>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="list-container animate-fade-in">
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Masteur Flux : {activeFilter === "All" ? "Global (Trié par priorité)" : activeFilter}</h2>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Chargement...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Demandeur</th>
                  <th>Désignation</th>
                  <th>Prix</th>
                  <th>Statut</th>
                  <th>Aiguillage</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Aucune demande trouvée.</td></tr>
                ) : (
                  filteredOrders.map((order) => {
                    const displayStatus = getOrderStatus(order);
                    return (
                      <tr key={order.id} className={isMasterAdmin(user?.email) ? "clickable" : ""} onClick={() => openMasterEdit(order)}>
                        <td style={{ width: '200px' }}>
                          <div style={{ fontWeight: 700 }}>{order.user_name}</div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{order.user_email}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{order.description}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Qté: {order.quantity} | {order.type}</div>
                        </td>
                        <td>
                          {order.price ? <span style={{ fontWeight: 800, color: '#059669' }}>{order.price} DZD</span> : <span style={{ opacity: 0.2 }}>-</span>}
                        </td>
                        <td>
                          <span className="status-tag" style={{ 
                            background: displayStatus === "Valorisation" ? "rgba(249, 115, 22, 0.1)" :
                                       displayStatus === "Traitée" ? "rgba(16, 185, 129, 0.1)" : 
                                       displayStatus === "Annulée" ? "rgba(239, 68, 68, 0.1)" : 
                                       displayStatus === "Rejetée" ? "rgba(100, 116, 139, 0.1)" :
                                       displayStatus === "Validée" ? "rgba(37, 99, 235, 0.1)" : "rgba(245, 158, 11, 0.1)",
                            color: displayStatus === "Valorisation" ? "#f97316" :
                                   displayStatus === "Traitée" ? "#10b981" : 
                                   displayStatus === "Annulée" ? "#ef4444" : 
                                   displayStatus === "Rejetée" ? "#64748b" : "#2563eb"
                          }}>{displayStatus}</span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          {displayStatus === "Valorisation" && isAdmin(user?.email) && (
                              <button onClick={() => router.push('/dashboard/processing')} style={{ background: '#f97316', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>VALORISER</button>
                          )}
                          {displayStatus === "En attente" && isAdmin(user?.email) && (
                              <button onClick={() => router.push('/dashboard/validations')} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>DÉCIDER</button>
                          )}
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

      {/* Master Edit Modal */}
      {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
              <div className="modal animate-fade-in" onClick={e => e.stopPropagation()}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Contrôle Maître</h2>
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Modification de la demande #{selectedOrder.id?.slice(0,6)}</p>
                  
                  <div className="modal-grid">
                      <div className="form-group">
                          <label>Désignation Article</label>
                          <input type="text" value={editForm.description || ""} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                      </div>
                      <div className="form-group">
                          <label>Quantité</label>
                          <input type="text" value={editForm.quantity || ""} onChange={e => setEditForm({...editForm, quantity: e.target.value})} />
                      </div>
                      <div className="form-group">
                          <label>Catégorie</label>
                          <select value={editForm.type || ""} onChange={e => setEditForm({...editForm, type: e.target.value})}>
                              <option>Equipment</option>
                              <option>Consumable IT</option>
                              <option>Office</option>
                              <option>Cleaning</option>
                              <option>Autre</option>
                          </select>
                      </div>
                      <div className="form-group">
                          <label>Statut</label>
                          <select value={editForm.status || ""} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                              <option value="En attente">En attente</option>
                              <option value="Validée">Validée / À Valoriser</option>
                              <option value="Traitée">Traitée (Clôturée)</option>
                              <option value="Annulée">Annulée</option>
                              <option value="Rejetée">Rejetée</option>
                          </select>
                      </div>
                      <div className="form-group">
                          <label>Prix DZD</label>
                          <input type="number" value={editForm.price || ""} onChange={e => setEditForm({...editForm, price: e.target.value})} />
                      </div>
                      <div className="form-group">
                          <label>Validateur</label>
                          <input type="text" value={editForm.validator_name || ""} onChange={e => setEditForm({...editForm, validator_name: e.target.value})} />
                      </div>
                  </div>

                  <div className="flex gap-4" style={{ marginTop: '40px' }}>
                      <button className="btn-primary w-full" onClick={handleMasterSave}>Enregistrer</button>
                      <button style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 700, flex: 1 }} onClick={() => setSelectedOrder(null)}>Annuler</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
