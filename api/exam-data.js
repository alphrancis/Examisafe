// Internal endpoint: the ONLY place that reads the exams doc from Firestore.
// Vercel's CDN caches this response, so Firestore is read at most about once
// every CACHE_SECONDS per region, no matter how many students are online.
// Teacher edits show up within ~CACHE_SECONDS.
import { db } from "./_firebase.js";

export const CACHE_SECONDS = 20;

export default async function handler(req, res) {
  if (req.query.key !== process.env.INTERNAL_KEY) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const snap = await db.collection("exams").doc("all").get();
    const data = snap.exists ? snap.data() : {};
    res.setHeader(
      "Vercel-CDN-Cache-Control",
      `s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`
    );
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(data);
  } catch (err) {
    console.error("exam-data error:", err);
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json({ error: "Server error" });
  }
}

// Helper used by the other API routes: goes through the CDN cache above
// instead of hitting Firestore directly.
export async function getExamsDoc(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const url = `${proto}://${req.headers.host}/api/exam-data?key=${encodeURIComponent(
    process.env.INTERNAL_KEY
  )}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`exam-data responded ${r.status}`);
  return r.json();
}
