// Public schedule (no exam links). Served from Vercel's CDN cache.
import { getExamsDoc, CACHE_SECONDS } from "./exam-data.js";

export default async function handler(req, res) {
  try {
    const data = await getExamsDoc(req);

    // Strip links so students can't grab them before the exam opens.
    const grades = {};
    for (const [name, g] of Object.entries(data.grades || {})) {
      grades[name] = {
        ...g,
        subjects: (g.subjects || []).map(({ link, ...rest }) => rest),
      };
    }

    res.setHeader(
      "Vercel-CDN-Cache-Control",
      `s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`
    );
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ grades });
  } catch (err) {
    console.error("schedule-all error:", err);
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json({ error: "Server error" });
  }
}
