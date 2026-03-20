const pool = require("../config/db");

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
           updated_at = NOW()
       WHERE id = $8
       RETURNING id, full_name, email, role, profile_photo_url, phone, address, dob, gender, whatsapp_number, emergency_contact`,
      [
        fullName,
        phone || null,
        address || null,
        dob === "" ? null : (dob || null),
        gender === "" ? null : (gender || null),
        whatsappNumber || null,
        emergencyContact || null,
        userId
      ]
    );

    const user = result.rows[0];
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

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

module.exports = { updateProfile };
