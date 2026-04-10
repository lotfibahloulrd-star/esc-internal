import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import fs from "fs";
import { parse } from "csv-parse/sync";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  let fileContent = fs.readFileSync("commandes.csv", "utf-8");
  
  // Correction spécifique : On enlève les guillemets qui entourent parfois toute la ligne
  const lines = fileContent.split(/\r?\n/);
  const cleanedLines = lines.map(line => {
    if (line.startsWith('"') && line.endsWith('"')) {
      return line.substring(1, line.length - 1).replace(/""/g, '"');
    }
    return line;
  });
  fileContent = cleanedLines.join("\n");

  const records = parse(fileContent, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });

  console.log(`Début de l'import de ${records.length - 1} commandes...`);

  for (let i = 1; i < records.length; i++) {
    const row = records[i];
    if (row.length < 5) continue;

    const orderData = {
      created_at: row[0] ? parseDate(row[0]) : new Date(),
      user_email: row[3] || row[1] || "inconnu@esclab.dz",
      user_name: row[2] || "Anonyme",
      type: row[4] || "Autre",
      description: row[5] || "",
      quantity: row[6] || "1",
      urgency: row[7] || "Normale",
      status: row[9] || "En attente",
      comment: row[11] || "",
      processed_at: row[12] ? parseDate(row[12]) : null
    };

    try {
      await addDoc(collection(db, "orders"), orderData);
      console.log(`[${i}/${records.length - 1}] Importé : ${orderData.description.substring(0, 30)}...`);
    } catch (error) {
      console.error(`Erreur ligne ${i}:`, error);
    }
  }
  console.log("\nMigration terminée !");
}

function parseDate(dateStr) {
  try {
    const parts = dateStr.split(' ');
    const dateParts = parts[0].split('/');
    const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    return new Date(parts[1] ? `${isoDate}T${parts[1]}` : isoDate);
  } catch (e) {
    return new Date();
  }
}

migrate();
