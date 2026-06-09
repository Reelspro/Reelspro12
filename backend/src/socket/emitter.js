/**
 * socket/emitter.js — Phase 20: Centralised Socket.io Emitter
 *
 * Workers and controllers cannot import `server.js` directly
 * (circular dependency). This singleton stores the io instance
 * and exposes safe emitter helpers that any module can use.
 */

let _io = null;

/** Called once by server.js after io is created */
const setIO = (io) => {
  _io = io;
};

/** Emit to ALL connected clients */
const emit = (event, data) => {
  if (_io) _io.emit(event, data);
};

/** Emit to a specific user's room (user_{userId}) */
const emitToUser = (userId, event, data) => {
  if (_io) _io.to(`user_${userId}`).emit(event, data);
};

/** Emit to the admin room */
const emitToAdmin = (event, data) => {
  if (_io) _io.to('admin').emit(event, data);
};

module.exports = { setIO, emit, emitToUser, emitToAdmin };
