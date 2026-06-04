import { db } from "./_firebase.js";

// GET /api/schedule?grade=10
// Returns the exam schedule for a grade WITHOUT links.
// Cached at the edge so 3000 students collapse into very few Firestore reads.
export default async function handler(req, res) {
  const grade = req.query.grade; // e.g. "10"
  if (!grade) return res.status(400).json({ error: "Missing grade" });

  try {
    const snap = await db.collection("exams").doc("all").get();

    // No exams doc at all -> empty schedule (frontend shows "No exams today").
    if (!snap.exists) {
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      return res.status(200).json({ level: null, subjects: [] });
    }

    const grades = snap.data().grades || {};
    const gradeData = grades[`Grade ${grade}`];

    // Grade missing or has no subjects -> empty schedule.
    if (!gradeData || !Array.isArray(gradeData.subjects)) {
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      return res
        .status(200)
        .json({ level: gradeData?.level ?? null, subjects: [] });
    }

    // Strip links. Only schedule info (subject, times) leaves the server here.
    const subjects = gradeData.subjects.map((s) => ({
      subject: s.subject,
      start: s.start,
      end: s.end,
    }));

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ level: gradeData.level ?? null, subjects });
  } catch (err) {
    console.error("schedule error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}