"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (error: any) {
      alert("Erreur de connexion : " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <style jsx>{`
        .login-container {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
          position: relative;
          overflow: hidden;
        }

        .login-container::before {
          content: "";
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
          top: -200px;
          right: -100px;
          opacity: 0.5;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 48px;
          border-radius: 32px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .logo-box {
          text-align: center;
          margin-bottom: 40px;
        }

        .logo-icon {
          width: 64px;
          height: 64px;
          background: var(--primary);
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin-bottom: 16px;
          box-shadow: 0 0 20px var(--primary-glow);
        }

        h1 {
          font-size: 1.75rem;
          margin-bottom: 8px;
        }

        p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .form-group {
          margin-bottom: 24px;
        }

        label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 8px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          padding: 14px 18px;
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          transition: var(--transition);
        }

        input:focus {
          outline: none;
          border-color: var(--primary);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .btn-login {
          width: 100%;
          background: var(--primary);
          color: white;
          padding: 16px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: var(--transition);
          margin-top: 32px;
        }

        .btn-login:hover {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
        }

        .btn-login:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loader {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .footer {
          text-align: center;
          margin-top: 32px;
          font-size: 0.8rem;
          color: #475569;
        }
      `}</style>

      <div className="login-card">
        <div className="logo-box">
          <div className="logo-icon">📦</div>
          <h1 className="text-gradient">ESC-Internal</h1>
          <p>Commandes Internes</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Professionnel</label>
            <input 
              type="email" 
              placeholder="ex: l.bahloul@esclab-algerie.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Mot de Passe</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn-login" type="submit" disabled={isLoading}>
            {isLoading ? <div className="loader" /> : "Se connecter"}
          </button>
        </form>

        <div className="footer">
          &copy; 2026 ESC Algérie. Tous droits réservés.<br/>
          <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>v1.2</span>
        </div>
      </div>
    </div>
  );
}
