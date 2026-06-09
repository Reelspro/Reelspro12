import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAdminStore from '../../store/adminStore';
import { FileText, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminLogs() {
  const { logs, fetchLogs } = useAdminStore();

  useEffect(() => {
    fetchLogs(200);
  }, [fetchLogs]);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen text-white">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="text-orange-400" />
            System Activity Logs
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Audit trail of user actions across the platform.</p>
        </div>
        <Link to="/admin/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm">
          <ArrowLeft size={16} /> Admin
        </Link>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-700/50 text-gray-300">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Details</th>
              <th className="px-6 py-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="text-gray-400 divide-y divide-gray-700/50">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No activity logged yet.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-700/20">
                  <td className="px-6 py-4">
                    <p className="text-white">{log.user_name || 'System'}</p>
                    {log.user_email && <p className="text-xs text-gray-500">{log.user_email}</p>}
                  </td>
                  <td className="px-6 py-4 font-mono text-purple-400">{log.action}</td>
                  <td className="px-6 py-4 text-xs max-w-md truncate" title={log.details}>{log.details || '-'}</td>
                  <td className="px-6 py-4 text-right text-xs">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}