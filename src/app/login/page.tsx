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
          background: #f1f5f9;
          background-image: 
            radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.1) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(124, 58, 237, 0.1) 0px, transparent 50%);
          position: relative;
          overflow: hidden;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 64px 48px;
          border-radius: 40px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.1);
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
          width: 72px;
          height: 72px;
          background: var(--primary);
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          margin-bottom: 16px;
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
        }

        h1 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 8px;
          color: #0f172a;
        }

        p {
          color: var(--text-muted);
          font-size: 1rem;
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 24px;
        }

        label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        input {
          width: 100%;
          background: white;
          border: 1px solid var(--border);
          padding: 14px 18px;
          border-radius: 14px;
          color: #0f172a;
          font-size: 1rem;
          transition: var(--transition);
        }

        input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .btn-login {
          width: 100%;
          background: var(--primary);
          color: white;
          padding: 16px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: var(--transition);
          margin-top: 32px;
          border: none;
          cursor: pointer;
        }

        .btn-login:hover {
          background: #1e40af;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
        }

        .btn-login:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loader {
          width: 22px;
          height: 22px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .footer {
          text-align: center;
          margin-top: 40px;
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 500;
        }
      `}</style>

      <div className="login-card">
        <div className="logo-box">
          <div className="logo-icon">📦</div>
          <h1 className="text-gradient">ESC-Internal</h1>
          <p>Système de Commandes</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>E-mail Pro</label>
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
          <span style={{ opacity: 0.7, fontSize: '0.65rem' }}>Version 1.7 - Light Edition</span>
        </div>
      </div>
    </div>
  );
}
