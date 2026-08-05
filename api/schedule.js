// pages/api/schedule.js
import { db } from "./_firebase.js";

export default async function handler(req, res) {
  const { grade, subject } = req.query;

  if (!grade) {
    return res.status(400).json({ error: "Missing grade" });
  }

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

    // ─── MODE 1: Fetch a specific subject's link (NOT cached, private) ───
    if (subject) {
      const found = gradeData.subjects.find(
        (s) => s.subject === subject && s.link
      );

      if (!found) {
        return res.status(404).json({ error: "Subject or link not found" });
      }

      // ❌ NO Cache-Control header — this must be fresh every time
      return res.status(200).json({ link: found.link });
    }

    // ─── MODE 2: Return schedule list (cached, public-safe) ───
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