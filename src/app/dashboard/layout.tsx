"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { isAdmin } from "@/lib/orderService";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{name: string, role: string, email: string} | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
      } else {
        const email = firebaseUser.email || "";
        setUser({
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Utilisateur",
          email: email,
          role: isAdmin(email) ? "Validateur" : "Utilisateur"
        });
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!user) return (
    <div className="flex items-center justify-center min-vh-100 bg-slate-950">
      <div className="loader" />
    </div>
  );

  const menuItems = [
    { name: "Tableau de Bord", icon: "📊", path: "/dashboard" },
    { name: "Mes Demandes", icon: "📝", path: "/dashboard/my-requests" },
    { name: "Validations", icon: "⚖️", path: "/dashboard/validations", roles: ["Validateur"] },
  ];

  return (
    <div className="dashboard-layout">
      <style jsx>{`
        .dashboard-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        .sidebar {
          width: 280px;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 32px 24px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 48px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: 12px;
          color: var(--text-muted);
          transition: var(--transition);
          margin-bottom: 8px;
          font-weight: 500;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.03);
          color: white;
        }

        .nav-link.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
        }

        .main-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          background: var(--background);
        }

        header {
          padding: 24px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
          background: rgba(2, 6, 23, 0.8);
          backdrop-filter: blur(8px);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .user-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 16px;
          border-radius: 50px;
          border: 1px solid var(--border);
          background: var(--surface);
          font-size: 0.9rem;
        }

        .avatar {
          width: 32px;
          height: 32px;
          background: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.8rem;
        }

        main {
          padding: 40px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .logout {
          margin-top: auto;
          color: var(--danger);
          opacity: 0.7;
        }

        .logout:hover {
          opacity: 1;
          background: rgba(239, 68, 68, 0.1);
        }
      `}</style>

      <aside className="sidebar">
        <div className="logo">
          <span style={{ color: "var(--primary)" }}>📦</span>
          <span className="text-gradient">ESC-Internal</span>
        </div>

        <nav>
          {menuItems.map((item) => (
            (!item.roles || item.roles.includes(user.role)) && (
              <Link key={item.path} href={item.path}>
                <div className={`nav-link ${pathname === item.path ? "active" : ""}`}>
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
              </Link>
            )
          ))}
        </nav>

        <div className="nav-link logout" onClick={async () => {
          await signOut(auth);
          router.push("/login");
        }}>
          <span>🚪</span>
          <span>Déconnexion</span>
        </div>
      </aside>

      <div className="main-container">
        <header>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Commandes Internes</h2>
          </div>
          <div className="user-pill">
            <div className="avatar">{user.name.charAt(0)}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 700 }}>{user.role}</div>
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
