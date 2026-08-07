const db = require('../config/db');

const tables = {
  task: 'tasks',
  revision: 'revisions',
  reminder: 'reminders'
};

const clean = (body, allowed) =>
  Object.fromEntries(
    Object.entries(body).filter(([key]) =>
      allowed.includes(key)
    )
  );

const fields = {
  task: [
    'title',
    'description',
    'priority',
    'deadline',
    'estimated_time',
    'category',
    'status'
  ],

  revision: [
    'topic',
    'description',
    'revision_date',
    'priority',
    'status',
    'notes'
  ],

  reminder: [
    'title',
    'message',
    'reminder_date',
    'reminder_time',
    'status'
  ]
};


// ======================================================
// GET ALL
// ======================================================

exports.list = type => async (req, res) => {

  try {

    const [rows] = await db.query(
      `
      SELECT *
      FROM ${tables[type]}
      WHERE user_id=?
      ORDER BY created_at DESC
      `,
      [req.session.user.id]
    );

    res.json(rows);

  } catch (error) {

    console.error(
      `Could not load ${type}s:`,
      error
    );

    res.status(500).json({
      message: `Could not load ${type}s.`
    });
  }
};


// ======================================================
// CREATE
// ======================================================

exports.create = type => async (req, res) => {

  try {

    const data =
      clean(req.body, fields[type]);


    // --------------------------------------------------
    // IMPORTANT:
    // Keep reminder date as YYYY-MM-DD
    // Do NOT use new Date() here.
    // --------------------------------------------------

    if (
      type === 'reminder' &&
      data.reminder_date
    ) {

      data.reminder_date =
        String(data.reminder_date)
          .split('T')[0];
    }


    const keys =
      Object.keys(data);


    if (keys.length === 0) {

      return res.status(400).json({
        message: 'No data provided.'
      });
    }


    const placeholders =
      keys.map(() => '?').join(',');


    const values =
      keys.map(key => data[key]);


    const [result] =
      await db.query(
        `
        INSERT INTO ${tables[type]}
        (
          user_id,
          ${keys.join(',')}
        )
        VALUES
        (
          ?,
          ${placeholders}
        )
        `,
        [
          req.session.user.id,
          ...values
        ]
      );


    res.status(201).json({
      id: result.insertId,
      ...data
    });

  } catch (error) {

    console.error(
      `Could not create ${type}:`,
      error
    );

    res.status(400).json({
      message: `Could not create ${type}.`
    });
  }
};


// ======================================================
// UPDATE
// ======================================================

exports.update = type => async (req, res) => {

  try {

    const data =
      clean(req.body, fields[type]);


    // --------------------------------------------------
    // IMPORTANT:
    // Keep reminder date as YYYY-MM-DD
    // --------------------------------------------------

    if (
      type === 'reminder' &&
      data.reminder_date
    ) {

      data.reminder_date =
        String(data.reminder_date)
          .split('T')[0];
    }


    const keys =
      Object.keys(data);


    if (keys.length === 0) {

      return res.status(400).json({
        message: 'No data provided.'
      });
    }


    const setQuery =
      keys
        .map(key => `${key}=?`)
        .join(',');


    const values =
      keys.map(key => data[key]);


    await db.query(
      `
      UPDATE ${tables[type]}
      SET ${setQuery}
      WHERE id=?
      AND user_id=?
      `,
      [
        ...values,
        req.params.id,
        req.session.user.id
      ]
    );


    res.json({
      id: +req.params.id,
      ...data
    });

  } catch (error) {

    console.error(
      `Could not update ${type}:`,
      error
    );

    res.status(400).json({
      message: `Could not update ${type}.`
    });
  }
};


// ======================================================
// DELETE
// ======================================================

exports.remove = type => async (req, res) => {

  try {

    await db.query(
      `
      DELETE FROM ${tables[type]}
      WHERE id=?
      AND user_id=?
      `,
      [
        req.params.id,
        req.session.user.id
      ]
    );


    res.json({
      message: 'Deleted.'
    });

  } catch (error) {

    console.error(
      'Could not delete item:',
      error
    );

    res.status(500).json({
      message: 'Could not delete item.'
    });
  }
};