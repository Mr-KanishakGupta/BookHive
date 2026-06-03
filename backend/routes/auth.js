const express = require('express');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL || "projectpurpose695@gmail.com",
    pass: process.env.GMAIL_PASSWORD, 
  },
});

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

    const mailOptions = {
      from: `"BookHive Library" <${process.env.GMAIL_EMAIL || 'projectpurpose695@gmail.com'}>`,
      to: email,
      subject: "BookHive - Registration OTP",
      text: `Your OTP for BookHive registration is: ${otp}. It will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: "OTP sent to your college email." });

  } catch (error) {
    console.error("OTP Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

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

module.exports = router;
