import { useState, useMemo, useEffect } from "react";
import Fuse from "fuse.js";
import { useDispatch, useSelector } from "react-redux";
import { findUsers } from "../../../store/adminSlice";

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { users } = useSelector((store) => store.admin);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(findUsers());
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(users || {}, {
      keys: ["_id", "profile.username", "email", "role"],
      threshold: 0.3,
    });
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const results = fuse.search(searchQuery);
    return results.map((result) => result.item);
  }, [searchQuery, fuse]);

  return (
    <div className="p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-semibold mb-4">User Management</h2>

      <input
        type="text"
        placeholder="Search by username, email, role or ID"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full mb-6 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="overflow-auto">
        <table className="min-w-full text-sm border border-gray-200 rounded">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">User ID</th>
              <th className="p-3">Username</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-3 font-mono">{user._id}</td>
                  <td className="p-3">{user.profile.username}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3 capitalize">{user.role}</td>
                  <td className="p-3">
                    {user.isBanned ? (
                      <span className="text-red-600">Banned</span>
                    ) : user.isVerified ? (
                      <span className="text-green-600">Verified</span>
                    ) : (
                      <span className="text-gray-500">Unverified</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={5}>
                  No matching users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
