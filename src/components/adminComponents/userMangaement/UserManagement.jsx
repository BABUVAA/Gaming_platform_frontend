import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { useDispatch, useSelector } from "react-redux";
import { findUsers } from "../../../store/adminSlice";

const statusStyles = {
  banned: "bg-rose-500/15 text-rose-200",
  verified: "bg-emerald-500/15 text-emerald-300",
  unverified: "bg-amber-500/15 text-amber-200",
};

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { users = [], isLoading } = useSelector((store) => store.admin);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(findUsers());
  }, [dispatch]);

  const fuse = useMemo(
    () =>
      new Fuse(users || [], {
        keys: ["_id", "profile.username", "email", "role"],
        threshold: 0.3,
      }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    return fuse.search(searchQuery).map((result) => result.item);
  }, [fuse, searchQuery, users]);

  return (
    <div className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">
            Players
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            User Management
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Search accounts, inspect verification posture, and review roster access.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search username, email, role, or ID"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-2xl border border-slate-800 bg-[#020617] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 lg:max-w-sm"
        />
      </div>

      <div className="mt-6 overflow-auto rounded-[24px] border border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-[#020617] text-left text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const status = user.isBanned
                  ? "banned"
                  : user.isVerified
                    ? "verified"
                    : "unverified";

                return (
                  <tr
                    key={user._id}
                    className="bg-slate-950/60 transition hover:bg-slate-900/60"
                  >
                    <td className="px-4 py-4 font-mono text-xs text-slate-400">
                      {user._id}
                    </td>
                    <td className="px-4 py-4 font-semibold text-white">
                      {user.profile?.username}
                    </td>
                    <td className="px-4 py-4 text-slate-300">{user.email}</td>
                    <td className="px-4 py-4 capitalize text-slate-300">
                      {user.role}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusStyles[status]}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                  {isLoading ? "Loading users..." : "No matching users found."}
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
