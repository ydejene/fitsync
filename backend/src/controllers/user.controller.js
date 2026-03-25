const pool = require("../config/db");
const jwt = require("jsonwebtoken");

// PUT /api/users/profile
async function updateProfile(req, res) {
  try {
    const { fullName, phone, address, dob, gender, whatsappNumber, emergencyContact } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE users 
       SET full_name = $1, 
           phone = $2, 
           address = $3, 
           dob = $4, 
           gender = $5, 
           whatsapp_number = $6, 
           emergency_contact = $7,
           profile_photo_url = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING id, full_name, email, role, profile_photo_url, phone, address, dob, gender, whatsapp_number, emergency_contact`,
      [
        fullName,
        phone || null,
        address || null,
        dob === "" ? null : (dob || null),
        gender === "" ? null : (gender || null),
        whatsappNumber || null,
        emergencyContact || null,
        req.body.profilePhotoUrl || null,
        userId
      ]
    );

    const user = result.rows[0];
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Regenerate JWT to keep session in sync
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        fullName: user.full_name,
        profilePhotoUrl: user.profile_photo_url
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("fitsync_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          profilePhotoUrl: user.profile_photo_url,
          phone: user.phone,
          address: user.address,
          dob: user.dob,
          gender: user.gender,
          whatsappNumber: user.whatsapp_number,
          emergencyContact: user.emergency_contact
        }
      }
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    console.error("Request Body:", req.body);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
}

async function uploadProfilePhoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const userId = req.user.id;
    const profilePhotoUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/uploads/${req.file.filename}`;

    const { rows } = await pool.query(
      "UPDATE users SET profile_photo_url = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, role, full_name, profile_photo_url",
      [profilePhotoUrl, userId]
    );

    const user = rows[0];

    // Regenerate JWT to keep session in sync
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        fullName: user.full_name,
        profilePhotoUrl: user.profile_photo_url
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("fitsync_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Photo uploaded successfully",
      data: { profilePhotoUrl: user.profile_photo_url }
    });
  } catch (err) {
    console.error("Upload Photo Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { updateProfile, uploadProfilePhoto };
