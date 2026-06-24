const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const admin = require('firebase-admin');

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'projectpurpose695@gmail.com';
const SENDER_NAME = process.env.SENDER_NAME || 'BookHive Library';

// ────────────────────────────────────────────────────────────────────────────
// Helper: send email via Brevo HTTP API (NOT SMTP — bypasses Render block)
// ────────────────────────────────────────────────────────────────────────────
const sendEmail = async (to, subject, text) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to }],
        subject: subject,
        textContent: text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo error:', data);
      throw new Error(data.message || 'Email send failed');
    }

    console.log(`Email sent to ${to}:`, data.messageId);
    return data;
  } catch (err) {
    console.error('Email send error:', err.message);
    throw err;
  }
};

// ────────────────────────────────────────────────────────────────────────────
// 1. Request OTP for Registration
// ────────────────────────────────────────────────────────────────────────────
router.post('/request-otp', async (req, res) => {
  const { libraryCardNumber } = req.body;
  if (!libraryCardNumber) {
    return res.status(400).json({ error: "Library card number is required." });
  }

  try {
    const db = admin.firestore();
    const studentDoc = await db.collection("students").doc(libraryCardNumber).get();
    
    if (!studentDoc.exists) {
      return res.status(404).json({ error: "Following ID does not exist." });
    }

    const studentData = studentDoc.data();
    if (studentData.isActive) {
      return res.status(400).json({ error: "Account is already active. Please login." });
    }

    const email = studentData.college_id;
    if (!email) {
      return res.status(500).json({ error: "Student record has no associated email." });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000));

    await db.collection("otps").doc(libraryCardNumber).set({
      otp,
      expiresAt,
      attempts: 0,
    });

    await sendEmail(
      email,
      "BookHive - Registration OTP",
      `Your OTP for BookHive registration is: ${otp}\n\nIt will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`
    );

    return res.json({ success: true, message: "OTP sent to your college email." });

  } catch (error) {
    console.error("OTP Error:", error);
    return res.status(500).json({ error: error.message || "Failed to send OTP." });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// 2. Verify OTP
// ────────────────────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { libraryCardNumber, otp } = req.body;
  if (!libraryCardNumber || !otp) {
    return res.status(400).json({ error: "Missing arguments." });
  }

  try {
    const db = admin.firestore();
    const otpDocRef = db.collection("otps").doc(libraryCardNumber);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return res.status(404).json({ error: "No OTP found or it has expired." });
    }

    const otpData = otpDoc.data();
    if (otpData.expiresAt.toDate() < new Date()) {
      await otpDocRef.delete();
      return res.status(400).json({ error: "OTP has expired." });
    }

    if (otpData.attempts >= 3) {
      await otpDocRef.delete();
      return res.status(400).json({ error: "Too many failed attempts. Request a new OTP." });
    }

    if (otpData.otp !== otp) {
      await otpDocRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
      return res.status(400).json({ error: "Invalid OTP." });
    }

    await otpDocRef.delete();
    return res.json({ success: true, message: "OTP verified." });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// 3. Add Student (Admin creates student + sends welcome email)
// ────────────────────────────────────────────────────────────────────────────
router.post('/add-student', async (req, res) => {
  const { libraryCardNumber, email, usn, name } = req.body;
  if (!libraryCardNumber || !email) {
    return res.status(400).json({ error: "Missing library card number or email." });
  }

  try {
    const db = admin.firestore();
    const studentDocRef = db.collection("students").doc(libraryCardNumber);
    const existing = await studentDocRef.get();
    
    if (existing.exists) {
      return res.status(400).json({ error: "Student with this library card ID already exists." });
    }

    const studentData = {
      name: name || libraryCardNumber,
      library_card_id: libraryCardNumber,
      college_id: email,
      usn: usn || "",
      password: null,
      isActive: false,
      fineAmount: 0,
      isBlacklisted: false,
      createdAt: new Date().toISOString()
    };

    await studentDocRef.set(studentData);

    await sendEmail(
      email,
      "Welcome to BookHive - Your Library Card is Ready",
      `Hello${name ? ' ' + name : ''},\n\nYour library card has been generated!\n\nLibrary Card ID: ${libraryCardNumber}\n\nYou can now download the BookHive app and click on "Create Account" using your library card ID to set your password and start borrowing books.\n\nRegards,\nBookHive Admin`
    );

    return res.json({ success: true, message: "Student added and welcome email sent successfully!" });

  } catch (error) {
    console.error("Add Student Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error." });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// 4. Forgot Password — Send OTP
// ────────────────────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: "Email or Library Card Number is required." });
  }

  try {
    const db = admin.firestore();
    let email = null;
    let libraryCardId = null;

    // Resolve identifier to student record
    if (identifier.includes('@')) {
      // Identifier is an email
      const q = db.collection("students").where('college_id', '==', identifier);
      const snap = await q.get();
      if (snap.empty) {
        return res.status(404).json({ error: "No student found with this email." });
      }
      const doc = snap.docs[0];
      email = doc.data().college_id;
      libraryCardId = doc.id;
    } else {
      // Identifier is a library card number
      const studentDoc = await db.collection("students").doc(identifier).get();
      if (!studentDoc.exists) {
        return res.status(404).json({ error: "No student found with this library card." });
      }
      email = studentDoc.data().college_id;
      libraryCardId = identifier;
    }

    const studentData = (await db.collection("students").doc(libraryCardId).get()).data();
    if (!studentData.isActive) {
      return res.status(400).json({ error: "Account is not activated yet. Please create your account first." });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000));

    await db.collection("password_reset_otps").doc(libraryCardId).set({
      otp,
      expiresAt,
      email,
      attempts: 0,
    });

    await sendEmail(
      email,
      "BookHive - Password Reset OTP",
      `Your OTP for password reset is: ${otp}\n\nIt will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`
    );

    return res.json({ success: true, message: "Password reset OTP sent to your college email.", libraryCardId });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ error: error.message || "Failed to send reset OTP." });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// 5. Reset Password — Verify OTP & Update Password
// ────────────────────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { libraryCardId, otp, newPassword } = req.body;
  if (!libraryCardId || !otp || !newPassword) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    const db = admin.firestore();
    const otpDocRef = db.collection("password_reset_otps").doc(libraryCardId);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return res.status(404).json({ error: "No reset request found. Please request a new OTP." });
    }

    const otpData = otpDoc.data();
    if (otpData.expiresAt.toDate() < new Date()) {
      await otpDocRef.delete();
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (otpData.attempts >= 3) {
      await otpDocRef.delete();
      return res.status(400).json({ error: "Too many failed attempts. Request a new OTP." });
    }

    if (otpData.otp !== otp) {
      await otpDocRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
      return res.status(400).json({ error: "Invalid OTP." });
    }

    // OTP valid — update password via Firebase Admin Auth
    const studentDoc = await db.collection("students").doc(libraryCardId).get();
    const authUid = studentDoc.data()?.authUid;

    if (!authUid) {
      // Fallback: look up user by email
      const userRecord = await admin.auth().getUserByEmail(otpData.email);
      await admin.auth().updateUser(userRecord.uid, { password: newPassword });
    } else {
      await admin.auth().updateUser(authUid, { password: newPassword });
    }

    // Cleanup OTP
    await otpDocRef.delete();

    return res.json({ success: true, message: "Password reset successfully! You can now login." });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ error: error.message || "Failed to reset password." });
  }
});

module.exports = router;
