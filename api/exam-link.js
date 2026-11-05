import { getExamsDoc } from "./exam-data.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const { grade, subject } = req.query;
  if (!grade || !subject)
    return res.status(400).json({ error: "Missing grade or subject" });

  try {
    // Uses the CDN-cached doc (no Firestore read per click).
    const data = await getExamsDoc(req);

    const gradeData = (data.grades || {})[`Grade ${grade}`];
    const found = gradeData?.subjects?.find((s) => s.subject === subject);
    if (!found) return res.status(404).json({ error: "Subject not found" });

    if (!found.start || !found.end) {
      return res.status(403).json({ error: "Exam is not currently open" });
    }

    // The open/closed check always uses the current time; only the data is cached.
    const now = new Date();
    const isOpen = now >= new Date(found.start) && now <= new Date(found.end);
    if (!isOpen) {
      return res.status(403).json({ error: "Exam is not currently open" });
    }

    if (!found.link) {
      return res.status(404).json({ error: "This exam has no link yet. Please tell your teacher." });
    }

    return res.status(200).json({ link: found.link });
  } catch (err) {
    console.error("exam-link error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
