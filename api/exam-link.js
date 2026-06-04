import { db } from "./_firebase.js";

// GET /api/exam-link?grade=10&subject=Filipino
// Returns the exam link ONLY if the exam is currently open.
// Never cached. The server clock is the authority.
export default async function handler(req, res) {
  const { grade, subject } = req.query;
  if (!grade || !subject)
    return res.status(400).json({ error: "Missing grade or subject" });

  try {
    const snap = await db.collection("exams").doc("all").get();
    if (!snap.exists) return res.status(404).json({ error: "Not found" });

    const gradeData = (snap.data().grades || {})[`Grade ${grade}`];
    const found = gradeData?.subjects?.find((s) => s.subject === subject);
    if (!found) return res.status(404).json({ error: "Subject not found" });

    const now = new Date();
    const isOpen = now >= new Date(found.start) && now <= new Date(found.end);

    res.setHeader("Cache-Control", "no-store");

    if (!isOpen) {
      return res.status(403).json({ error: "Exam is not currently open" });
    }

    // Only reached when the exam is genuinely open right now.
    return res.status(200).json({ link: found.link });
  } catch (err) {
    console.error("exam-link error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}