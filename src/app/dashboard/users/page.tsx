"use client";

import React, { useEffect, useState } from "react";
import { orderService, isAdmin, getRoleLabel } from "@/lib/orderService";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function UsersManagementPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [newRole, setNewRole] = useState("");

  const user = auth.currentUser;
  const isAdminUser = isAdmin(user?.email);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u || !isAdmin(u.email)) {
        router.push("/dashboard");
        return;
      }
      fetchProfiles();
    });

    return () => unsubscribe();
  }, [router]);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const data = await orderService.getProfiles();
      setProfiles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (email: string, role: string) => {
      try {
          await orderService.updateUserProfile(email, { role });
          fetchProfiles();
          alert("Permissions mises à jour !");
      } catch (err) {
          alert("Erreur lors de la mise à jour");
      }
  };

  const handleResetPassword = async (email: string) => {
    if (!confirm(`Envoyer un e-mail de réinitialisation de mot de passe à ${email} ?`)) return;
    try {
      await sendPasswordResetEmail(auth, email);
      alert("E-mail envoyé avec succès !");
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const handleToggleStatus = async (profile: any) => {
    try {
      await orderService.toggleProfileStatus(profile.email, profile.active);
      fetchProfiles();
    } catch (err) {
      alert("Erreur lors de la modification du statut");
    }
  };

  const availableRoles = [
      "Super Administrateur",
      "Validateur",
      "Service Traitement",
      "Utilisateur"
  ];

  return (
    <div className="users-page animate-fade-in">
      <style jsx>{`
        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
          margin-top: 32px;
        }
        .user-card {
          padding: 32px;
          border-radius: 28px;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: var(--transition);
          position: relative;
          overflow: hidden;
        }
        .user-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; width: 100%; height: 4px;
          background: linear-gradient(90deg, var(--primary), var(--accent));
          opacity: 0;
          transition: var(--transition);
        }
        .user-card:hover {
          transform: translateY(-8px);
          background: rgba(15, 23, 42, 0.6);
          border-color: var(--primary);
        }
        .user-card:hover::before { opacity: 1; }
        
        .avatar-lg {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 20px;
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
        }

        .role-selector {
            margin-top: 16px;
            padding: 8px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            color: white;
            font-size: 0.8rem;
            width: 100%;
        }

        .actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        .btn-action {
          flex: 1;
          padding: 10px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          transition: var(--transition);
          color: white;
        }
        .btn-action:hover {
          background: rgba(255,255,255,0.08);
          border-color: var(--primary);
        }
        .btn-danger-soft:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: var(--danger);
          color: var(--danger);
        }
      `}</style>

      <div className="header flex justify-between">
        <div>
          <h1 className="text-gradient">Gestion des Utilisateurs</h1>
          <p className="text-muted">Gérez les accès et les comptes de l'équipe.</p>
        </div>
        <div style={{ padding: '8px 20px', borderRadius: '50px', background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', height: 'fit-content', fontWeight: 700, fontSize: '0.8rem' }}>
          {profiles.length} Comptes Enregistrés
        </div>
      </div>

      <div className="users-grid">
        {isLoading ? (
          <div>Chargement des utilisateurs...</div>
        ) : (
          profiles.map((p) => (
            <div key={p.id} className="user-card">
              <div className="avatar-lg">{p.name.charAt(0)}</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{p.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>{p.email}</p>
              
              <div className="flex flex-col gap-3">
                <span style={{ 
                  padding: '4px 10px', 
                  borderRadius: '50px', 
                  fontSize: '0.65rem', 
                  fontWeight: 800, 
                  background: p.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: p.active ? '#10b981' : '#ef4444',
                  width: 'fit-content'
                }}>
                  {p.active ? "● COMPTE ACTIF" : "○ COMPTE DÉSACTIVÉ"}
                </span>

                <div className="flex flex-col gap-1">
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Attribuer Permission / Rôle</label>
                    <select 
                        className="role-selector" 
                        value={p.role || getRoleLabel(p.email)} 
                        onChange={(e) => handleUpdateRole(p.email, e.target.value)}
                    >
                        {availableRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
              </div>

              <div className="actions">
                <button className="btn-action" onClick={() => handleResetPassword(p.email)}>
                  🔑 Reset PWD
                </button>
                <button className={`btn-action ${p.active ? 'btn-danger-soft' : ''}`} onClick={() => handleToggleStatus(p)}>
                  {p.active ? "🚫 Suspendre" : "✅ Activer"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
