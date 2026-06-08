import { db } from "./_firebase.js";

export default async function handler(req, res) {
  const grade = req.query.grade;
  if (!grade) return res.status(400).json({ error: "Missing grade" });

  try {
    const snap = await db.collection("exams").doc("all").get();

    if (!snap.exists) {
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      return res.status(200).json({ level: null, subjects: [] });
    }

    const grades = snap.data().grades || {};
    const gradeData = grades[`Grade ${grade}`];

    if (!gradeData || !Array.isArray(gradeData.subjects)) {
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      return res.status(200).json({ level: gradeData?.level ?? null, subjects: [] });
    }


    const subjects = gradeData.subjects
      .filter((s) => s.start != null && s.end != null)
      .map((s) => ({
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