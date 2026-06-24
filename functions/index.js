const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// Configure Nodemailer transporter (replace with your actual Gmail credentials)
// Important: For Gmail, use an App Password instead of your regular password.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL || "projectpurpose695@gmail.com", 
    pass: process.env.GMAIL_PASSWORD || "YOUR_APP_PASSWORD", 
  },
});

// ----------------------------------------------------------------------------
// 1. Send OTP for First-Time Registration
// ----------------------------------------------------------------------------
exports.requestRegistrationOTP = functions.https.onCall(async (data, context) => {
  const { libraryCardNumber } = data;
  if (!libraryCardNumber) {
    throw new functions.https.HttpsError("invalid-argument", "Library card number is required.");
  }

  // Check if student exists
  const studentDoc = await db.collection("students").doc(libraryCardNumber).get();
  if (!studentDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Following ID does not exist.");
  }

  const studentData = studentDoc.data();
  if (studentData.isActive) {
    throw new functions.https.HttpsError("failed-precondition", "Account is already active. Please login.");
  }

  const email = studentData.college_id;
  if (!email) {
    throw new functions.https.HttpsError("internal", "Student record has no associated email.");
  }

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)); // 10 mins

  // Store OTP in a subcollection or separate collection
  await db.collection("otps").doc(libraryCardNumber).set({
    otp,
    expiresAt,
    attempts: 0,
  });

  // Send Email
  const mailOptions = {
    from: "BookHive Library <projectpurpose695@gmail.com>",
    to: email,
    subject: "BookHive - Registration OTP",
    text: `Your OTP for BookHive registration is: ${otp}. It will expire in 10 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "OTP sent to your college email." };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new functions.https.HttpsError("internal", "Failed to send OTP email.");
  }
});

// ----------------------------------------------------------------------------
// 2. Verify OTP
// ----------------------------------------------------------------------------
exports.verifyRegistrationOTP = functions.https.onCall(async (data, context) => {
  const { libraryCardNumber, otp } = data;
  if (!libraryCardNumber || !otp) {
    throw new functions.https.HttpsError("invalid-argument", "Missing arguments.");
  }

  const otpDocRef = db.collection("otps").doc(libraryCardNumber);
  const otpDoc = await otpDocRef.get();

  if (!otpDoc.exists) {
    throw new functions.https.HttpsError("not-found", "No OTP found or it has expired.");
  }

  const otpData = otpDoc.data();
  if (otpData.expiresAt.toDate() < new Date()) {
    await otpDocRef.delete();
    throw new functions.https.HttpsError("failed-precondition", "OTP has expired.");
  }

  if (otpData.attempts >= 3) {
    await otpDocRef.delete();
    throw new functions.https.HttpsError("failed-precondition", "Too many failed attempts. Request a new OTP.");
  }

  if (otpData.otp !== otp) {
    await otpDocRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
    throw new functions.https.HttpsError("invalid-argument", "Invalid OTP.");
  }

  // OTP is valid
  await otpDocRef.delete();
  return { success: true, message: "OTP verified." };
});

// ----------------------------------------------------------------------------
// 3. Welcome Email on Student Creation (Workflow A)
// ----------------------------------------------------------------------------
exports.onStudentCreated = functions.firestore
  .document("students/{libraryCardId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const email = data.college_id;

    if (!email) return;

    const mailOptions = {
      from: "BookHive Library <projectpurpose695@gmail.com>",
      to: email,
      subject: "Welcome to BookHive!",
      text: `Hello,\n\nYour library card has been issued.\n\nDetails:\nLibrary Card ID: ${context.params.libraryCardId}\nUSN: ${data.usn}\nCollege ID: ${email}\n\nPlease download the BookHive app and complete your registration using your Library Card ID.\n\nBest regards,\nLibrary Admin`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }
  });

// ----------------------------------------------------------------------------
// 4. Daily Fine Calculation Engine (Workflow E)
// ----------------------------------------------------------------------------
exports.dailyFineCalculation = functions.pubsub
  .schedule("every day 00:00")
  .onRun(async (context) => {
    console.log("Starting daily fine calculation...");
    
    // Using UTC date for comparison, assuming dueDate is stored in UTC.
    const today = new Date();
    // Normalize today to start of day
    today.setHours(0, 0, 0, 0);

    const dueBooksSnapshot = await db.collection("due_books").get();
    
    let processed = 0;
    
    for (const doc of dueBooksSnapshot.docs) {
      const dueBook = doc.data();
      const dueDate = dueBook.dueDate.toDate();
      dueDate.setHours(0, 0, 0, 0);

      // Only process if the book is overdue
      if (today > dueDate) {
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / msPerDay);
        
        const bookDoc = await db.collection("books").doc(dueBook.bookId).get();
        const bookCost = bookDoc.exists ? (bookDoc.data().cost || bookDoc.data().price || 0) : 0;
        const dailyPenalty = bookCost > 0 ? bookCost * 0.05 : 35;
        
        const newFine = daysOverdue * dailyPenalty;
        const shouldBlacklist = daysOverdue >= 7;

        // Update due_books record
        await doc.ref.update({ fine: newFine });

        // Update borrow_records
        if (dueBook.borrowRecordId) {
            await db.collection("borrow_records").doc(dueBook.borrowRecordId).update({
                fine: newFine,
                status: shouldBlacklist ? "BLOCKED" : "OVERDUE"
            });
        }

        if (shouldBlacklist) {
            // Update student record
            await db.collection("students").doc(dueBook.studentId).update({
                isBlacklisted: true
            });

            // Create an admin notification (or student notification)
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
    
    console.log(`Daily fine calculation complete. Processed ${processed} overdue records.`);
    return null;
  });
