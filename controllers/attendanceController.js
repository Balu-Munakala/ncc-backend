// controllers/attendanceController.js

const pool = require('../config/db');

/**
 * List all fallins for the logged‐in ANO (admin).
 * GET /api/attendance/fallins
 */
exports.listFallinsForAttendance = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may view fallins for attendance.' });
  }

  const ano_id = req.user.ano_id;
  try {
    const [rows] = await pool.execute(
      `SELECT fallin_id, date, time, type, location 
         FROM fallin 
        WHERE ano_id = ?
        ORDER BY date DESC, time DESC`,
      [ano_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[List Fallins for Attendance Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching fallins.' });
  }
};

/**
 * Given a fallin_id, return all cadets (regimental_number + name)
 * who belong to the same ANO. (Cadets implicitly enrolled if under the ANO.)
 * GET /api/attendance/students/:fallinId
 */
exports.getEligibleCadetsForFallin = async (req, res) => {
  const fallinId = req.params.fallinId;

  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may take attendance.' });
  }

  const ano_id = req.user.ano_id;
  try {
    // 1) Verify that this fallin belongs to this ANO
    const [fallinRows] = await pool.execute(
      `SELECT ano_id FROM fallin WHERE fallin_id = ?`,
      [fallinId]
    );
    if (!fallinRows.length) {
      return res.status(404).json({ msg: 'Fallin not found.' });
    }
    if (fallinRows[0].ano_id !== ano_id) {
      return res.status(403).json({ msg: 'Not authorized for this fallin.' });
    }

    // 2) Fetch all cadets under this ANO
    const [cadets] = await pool.execute(
      `SELECT u.regimental_number, u.name
         FROM users u
        WHERE u.ano_id = ?
        ORDER BY u.name ASC`,
      [ano_id]
    );
    return res.json(cadets);
  } catch (err) {
    console.error('[Get Eligible Cadets Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching cadets.' });
  }
};

/**
 * Bulk upsert attendance for a given fallin_id.
 * POST /api/attendance/mark/:fallinId
 * Body: { records: [ { regimental_number, status, remarks? }, ... ] }
 */
exports.markAttendance = async (req, res) => {
  const fallinId = req.params.fallinId;
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may mark attendance.' });
  }
  const ano_id = req.user.ano_id;
  const records = req.body.records;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ msg: 'No attendance records provided.' });
  }

  try {
    // 1) Verify fallin belongs to this ANO
    const [fallinRows] = await pool.execute(
      `SELECT ano_id FROM fallin WHERE fallin_id = ?`,
      [fallinId]
    );
    if (!fallinRows.length || fallinRows[0].ano_id !== ano_id) {
      return res.status(403).json({ msg: 'Not authorized for this fallin.' });
    }

    // 2) Bulk upsert each record
    const upsertPromises = records.map(({ regimental_number, status, remarks }) => {
      return pool.execute(
        `INSERT INTO attendance 
            (fallin_id, regimental_number, ano_id, status, remarks)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           remarks = VALUES(remarks),
           updated_at = CURRENT_TIMESTAMP`,
        [fallinId, regimental_number, ano_id, status, remarks || null]
      );
    });

    await Promise.all(upsertPromises);
    return res.json({ msg: 'Attendance recorded successfully.' });
  } catch (err) {
    console.error('[Mark Attendance Error]', err);
    return res.status(500).json({ msg: 'Database error while marking attendance.' });
  }
};

/**
 * View all attendance records for a given fallin_id.
 * GET /api/attendance/view/:fallinId
 */
exports.viewAttendance = async (req, res) => {
  const fallinId = req.params.fallinId;
  const { userType, ano_id } = req.user;

  try {
    // 1) Verify fallin exists and get its ano_id
    const [fallinRows] = await pool.execute(
      `SELECT ano_id FROM fallin WHERE fallin_id = ?`,
      [fallinId]
    );
    if (!fallinRows.length) {
      return res.status(404).json({ msg: 'Fallin not found.' });
    }
    const fallinAno = fallinRows[0].ano_id;

    // 2) Authorization:
    //    - If admin, ano_id must match.
    //    - If cadet (user), ano_id must match.
    //    - Others forbidden.
    if (userType === 'admin' || userType === 'user') {
      if (ano_id !== fallinAno) {
        return res.status(403).json({ msg: 'Not authorized for this fallin.' });
      }
    } else {
      return res.status(403).json({ msg: 'Only cadets or ANOs may view attendance.' });
    }

    // 3) Fetch joined attendance + user name
    const [rows] = await pool.execute(
      `SELECT 
         a.attendance_id,
         a.regimental_number,
         u.name,
         a.status,
         a.remarks,
         a.recorded_at,
         a.updated_at
       FROM attendance a
       JOIN users u ON a.regimental_number = u.regimental_number
       WHERE a.fallin_id = ?
       ORDER BY u.name ASC`,
      [fallinId]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[View Attendance Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching attendance.' });
  }
};

/**
 * GET a single attendance record by attendance_id.
 * GET /api/attendance/:attendanceId
 */
exports.getAttendanceById = async (req, res) => {
  const attendanceId = req.params.attendanceId;
  const { userType, ano_id, regimental_number } = req.user;

  try {
    // 1) Fetch the record and join user + fallin for authorization
    const [rows] = await pool.execute(
      `SELECT 
         a.attendance_id,
         a.fallin_id,
         a.regimental_number,
         a.ano_id AS record_ano,
         a.status,
         a.remarks,
         a.recorded_at,
         a.updated_at,
         f.ano_id AS fallin_ano
       FROM attendance a
       JOIN fallin f ON a.fallin_id = f.fallin_id
       WHERE a.attendance_id = ?`,
      [attendanceId]
    );
    if (!rows.length) {
      return res.status(404).json({ msg: 'Attendance record not found.' });
    }
    const record = rows[0];

    // 2) Authorization:
    //    - If admin, record.fallin_ano must match req.user.ano_id
    //    - If cadet, record.regimental_number must match req.user.regimental_number
    if (userType === 'admin') {
      if (record.fallin_ano !== ano_id) {
        return res.status(403).json({ msg: 'Not authorized to view this record.' });
      }
    } else if (userType === 'user') {
      if (record.regimental_number !== regimental_number) {
        return res.status(403).json({ msg: 'Not authorized to view this record.' });
      }
    } else {
      return res.status(403).json({ msg: 'Not authorized to view attendance.' });
    }

    return res.json(record);
  } catch (err) {
    console.error('[Get Attendance By ID Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching attendance.' });
  }
};

/**
 * UPDATE a single attendance record by attendance_id.
 * PUT /api/attendance/:attendanceId
 * Body: { status, remarks? }
 */
exports.updateAttendanceById = async (req, res) => {
  const attendanceId = req.params.attendanceId;
  const { status, remarks } = req.body;
  const { userType, ano_id, regimental_number } = req.user;

  if (!status) {
    return res.status(400).json({ msg: 'Missing required field: status.' });
  }

  try {
    // 1) Fetch the record and join fallin for authorization
    const [rows] = await pool.execute(
      `SELECT 
         a.ano_id AS record_ano,
         a.fallin_id,
         f.ano_id AS fallin_ano,
         a.regimental_number
       FROM attendance a
       JOIN fallin f ON a.fallin_id = f.fallin_id
       WHERE a.attendance_id = ?`,
      [attendanceId]
    );
    if (!rows.length) {
      return res.status(404).json({ msg: 'Attendance record not found.' });
    }
    const record = rows[0];

    // 2) Authorization:
    //    - If admin, record.fallin_ano must match req.user.ano_id
    //    - If cadet, record.regimental_number must match req.user.regimental_number
    if (userType === 'admin') {
      if (record.fallin_ano !== ano_id) {
        return res.status(403).json({ msg: 'Not authorized to update this record.' });
      }
    } else if (userType === 'user') {
      if (record.regimental_number !== regimental_number) {
        return res.status(403).json({ msg: 'Not authorized to update this record.' });
      }
    } else {
      return res.status(403).json({ msg: 'Not authorized to update attendance.' });
    }

    // 3) Perform the update
    const [result] = await pool.execute(
      `UPDATE attendance
         SET status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
       WHERE attendance_id = ?`,
      [status, remarks || null, attendanceId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Attendance record not found.' });
    }
    return res.json({ msg: 'Attendance record updated.' });
  } catch (err) {
    console.error('[Update Attendance By ID Error]', err);
    return res.status(500).json({ msg: 'Database error while updating attendance.' });
  }
};

/**
 * DELETE a single attendance record by attendance_id.
 * DELETE /api/attendance/:attendanceId
 */
exports.deleteAttendanceById = async (req, res) => {
  const attendanceId = req.params.attendanceId;
  const { userType, ano_id, regimental_number } = req.user;

  try {
    // 1) Fetch the record and join fallin for authorization
    const [rows] = await pool.execute(
      `SELECT 
         a.ano_id AS record_ano,
         a.fallin_id,
         f.ano_id AS fallin_ano,
         a.regimental_number
       FROM attendance a
       JOIN fallin f ON a.fallin_id = f.fallin_id
       WHERE a.attendance_id = ?`,
      [attendanceId]
    );
    if (!rows.length) {
      return res.status(404).json({ msg: 'Attendance record not found.' });
    }
    const record = rows[0];

    // 2) Authorization:
    //    - If admin, record.fallin_ano must match req.user.ano_id
    //    - If cadet, they can delete their own record only if registration is allowed
    if (userType === 'admin') {
      if (record.fallin_ano !== ano_id) {
        return res.status(403).json({ msg: 'Not authorized to delete this record.' });
      }
    } else if (userType === 'user') {
      if (record.regimental_number !== regimental_number) {
        return res.status(403).json({ msg: 'Not authorized to delete this record.' });
      }
    } else {
      return res.status(403).json({ msg: 'Not authorized to delete attendance.' });
    }

    // 3) Perform the delete
    const [result] = await pool.execute(
      `DELETE FROM attendance WHERE attendance_id = ?`,
      [attendanceId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Attendance record not found.' });
    }
    return res.json({ msg: 'Attendance record deleted.' });
  } catch (err) {
    console.error('[Delete Attendance By ID Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting attendance.' });
  }
};
