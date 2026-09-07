// pages/api/schedule-all.js
import { db } from "./_firebase.js";

let cache = null;
let cacheTime = 0;
const TTL = 10 * 60 * 1000;

export default async function handler(req, res) {
    const now = Date.now();

    const { purge } = req.query;
    if (purge === process.env.PURGE_SECRET) {
        cache = null;
        cacheTime = 0;
    }

    if (cache && now - cacheTime < TTL) {
        res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=300");
        return res.status(200).json(cache);
    }

    try {
        const snap = await db.collection("exams").doc("all").get();
        cache = snap.exists ? snap.data() : {};
        cacheTime = now;

        res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=300");
        return res.status(200).json(cache);
    } catch (err) {
        console.error("schedule-all error:", err);
        if (cache) return res.status(200).json(cache);
        return res.status(500).json({ error: "Server error" });
    }
}