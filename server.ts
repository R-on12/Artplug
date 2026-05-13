import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import Stripe from "stripe";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

dotenv.config();

// Initialize Firebase Admin-like behavior (but using client SDK with restricted rules)
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Note: In a real app, these would be provided by the user in the Secrets panel
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Stripe Checkout Simulation
  app.post("/api/create-checkout-session", async (req, res) => {
    const { artworkId, title, artist, artistId, price, userId, userEmail } = req.body;
    
    // Simulate payment logic and log to Firestore
    try {
      if (userId && userEmail) {
        await addDoc(collection(db, "sales"), {
          artworkId,
          title,
          artist,
          artistId: artistId || "anonymous",
          price,
          buyerId: userId,
          buyerEmail: userEmail,
          createdAt: serverTimestamp()
        });
        console.log(`Sale logged for ${title} to ${userEmail}`);
      }
    } catch (e) {
      console.error("Failed to log sale:", e);
    }
    
    console.log(`Processing split payment for Artwork ${artworkId}. Artist ${artist} receives 85%.`);
    
    res.json({ 
      success: true, 
      message: "Checkout session created",
      sessionId: "sim_123456789" 
    });
  });

  // Cloudinary Signature Simulation
  app.get("/api/cloudinary-signature", (req, res) => {
    // Generate a secure signature for client-side uploads
    res.json({ 
      signature: "sim_signature",
      timestamp: Math.round(new Date().getTime() / 1000)
    });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Artplug Backend running at http://localhost:${PORT}`);
  });
}

startServer();
