const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

router.post('/daily-fines', async (req, res) => {
  // Simple protection so random people don't trigger the cron job
  const { cron_secret } = req.headers;
  if (cron_secret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const db = admin.firestore();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueBooksSnapshot = await db.collection("due_books").get();
    let processed = 0;
    
    for (const doc of dueBooksSnapshot.docs) {
      const dueBook = doc.data();
      const dueDate = dueBook.dueDate.toDate();
      dueDate.setHours(0, 0, 0, 0);

      if (today > dueDate) {
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / msPerDay);
        
        const bookDoc = await db.collection("books").doc(dueBook.bookId).get();
        const bookCost = bookDoc.exists ? (bookDoc.data().cost || bookDoc.data().price || 0) : 0;
        const dailyPenalty = bookCost > 0 ? bookCost * 0.05 : 35;
        
        const newFine = daysOverdue * dailyPenalty;
        const shouldBlacklist = daysOverdue >= 7;

        await doc.ref.update({ fine: newFine });

        if (dueBook.borrowRecordId) {
            await db.collection("borrow_records").doc(dueBook.borrowRecordId).update({
                fine: newFine,
                status: shouldBlacklist ? "BLOCKED" : "OVERDUE"
            });
        }

        if (shouldBlacklist) {
            await db.collection("students").doc(dueBook.studentId).update({
                isBlacklisted: true
            });

            await db.collection("notifications").add({
                userId: dueBook.studentId,
                type: "fine_update",
                message: `You have been blacklisted. Your book is ${daysOverdue} days overdue.`,
                isRead: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        
        processed++;
      }
    }
    
    return res.json({ success: true, message: `Processed ${processed} overdue records.` });

  } catch (error) {
    console.error("Cron Error:", error);
    return res.status(500).json({ error: "Failed to run cron job." });
  }
});

module.exports = router;
