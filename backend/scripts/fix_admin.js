// FIX 6: Ensure admin account is approved and has correct role
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../src/config/db');

// Fix admin@reelspro.com
const r1 = db.prepare("UPDATE users SET role='admin', status='approved' WHERE email='admin@reelspro.com'").run();
console.log(`[fix_admin] admin@reelspro.com: ${r1.changes} row(s) updated.`);

// Fix user id=1 as fallback
const r2 = db.prepare("UPDATE users SET role='admin', status='approved' WHERE id=1 AND (role != 'admin' OR status != 'approved')").run();
console.log(`[fix_admin] User id=1: ${r2.changes} row(s) updated.`);

// Show current admin state
const admins = db.prepare("SELECT id, email, role, status FROM users WHERE role='admin'").all();
console.log('[fix_admin] Current admins:', admins);
