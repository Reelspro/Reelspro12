const db = require('../config/db');

const dbHelper = {
  // Generic function to find one record by a specific field
  findOne: (table, field, value) => {
    const stmt = db.prepare(`SELECT * FROM ${table} WHERE ${field} = ?`);
    return stmt.get(value);
  },

  // Generic function to find multiple records by a specific field
  findMany: (table, field, value) => {
    const stmt = db.prepare(`SELECT * FROM ${table} WHERE ${field} = ?`);
    return stmt.all(value);
  },

  // Generic function to get all records from a table
  findAll: (table) => {
    const stmt = db.prepare(`SELECT * FROM ${table}`);
    return stmt.all();
  },

  // Generic insert function
  insert: (table, data) => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');
    
    const stmt = db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`);
    const info = stmt.run(...values);
    
    // If id was provided in data (e.g. UUID), use it; otherwise use lastInsertRowid
    return { id: data.id !== undefined ? data.id : info.lastInsertRowid, ...data };
  },

  // Generic update function
  update: (table, id, data) => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    
    const stmt = db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`);
    const info = stmt.run(...values, id);
    
    return info.changes > 0;
  },

  // Generic delete function
  remove: (table, id) => {
    const stmt = db.prepare(`DELETE FROM ${table} WHERE id = ?`);
    const info = stmt.run(id);
    return info.changes > 0;
  }
};

module.exports = dbHelper;
