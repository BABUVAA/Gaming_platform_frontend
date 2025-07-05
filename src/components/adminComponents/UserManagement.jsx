import { useState } from "react";

const UserList = () => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">User List</h3>
      <p className="text-sm text-gray-600">
        Display and manage registered users here.
      </p>
    </div>
  );
};

const UserRoles = () => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">User Roles</h3>
      <p className="text-sm text-gray-600">Assign or modify user roles.</p>
    </div>
  );
};

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState("list");

  const tabs = [
    { key: "list", label: "User List" },
    { key: "roles", label: "Roles & Permissions" },
  ];

  return (
    <div className="bg-white p-6 rounded shadow-md">
      <h2 className="text-2xl font-semibold mb-4">User Management</h2>

      <div className="flex gap-4 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`pb-2 border-b-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "list" && <UserList />}
        {activeTab === "roles" && <UserRoles />}
      </div>
    </div>
  );
};

export default UserManagement;
