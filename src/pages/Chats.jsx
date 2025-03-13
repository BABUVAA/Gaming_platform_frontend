import { useState } from "react";
import { useSelector } from "react-redux";
import ChatBox from "../components/common/ChatBox";

const Chats = () => {
  const { profile } = useSelector((store) => store.auth);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatType, setChatType] = useState(null);
  const [chatName, setChatName] = useState(null);
  const [personalChats, setPersonalChats] = useState(profile?.activeChats || []);
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log("personalCHats:", personalChats);
  return (
    <div className="flex h-[calc(100vh-96px)]">
      {/* Sidebar */}
      <div
        className={`transition-all bg-blue-50 border-r border-blue-300 shadow-lg w-full md:w-1/3 flex flex-col ${
          selectedChat ? "hidden md:flex" : "flex"
        }`}
      >
        <ChatSidebar
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
          onChatType={setChatType}
          clanChat={profile?.clan}
          personalChats={personalChats}
          onNewChat={() => setIsModalOpen(true)}
          chatName={setChatName}
        />
      </div>

      {/* Chat Box */}
      {selectedChat && (
        <div className="transition-all bg-white flex flex-col flex-1 md:pb-0">
          <ChatBox
            selectedChat={selectedChat}
            chatType={chatType}
            chatName={chatName}
            onBack={() => setSelectedChat(null)}
          />
        </div>
      )}

      {/* New Chat Modal */}
      {isModalOpen && (
        <NewChatModal
          onClose={() => setIsModalOpen(false)}
          personalChats={personalChats}
          setPersonalChats={setPersonalChats}
          setChatName={setChatName}
        />
      )}
    </div>
  );
};

export default Chats;

const ChatSidebar = ({
  selectedChat,
  onSelectChat,
  onChatType,
  clanChat,
  personalChats,
  onNewChat,
  chatName,
}) => {
  return (
    <div className="absolute bottom-1 h-full md:pb-0 bg-blue-50 border-r border-blue-300 shadow-lg w-full flex flex-col">
      {/* Sidebar Header */}
      <div className="p-2 bg-blue-500 text-white text-xs font-semibold shadow-md flex justify-between items-center">
        <span>Chats</span>
      </div>

      {/* Chat List */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {clanChat && (
          <div
            className="p-2 mx-1 my-0.5 bg-white rounded-md shadow-sm border border-blue-300 cursor-pointer hover:bg-blue-100 transition"
            onClick={() => {
              onSelectChat(clanChat._id);
              onChatType("clan");
            }}
          >
            <span className="text-xs font-medium text-blue-600">
              🏆 {clanChat.clanName} (Clan)
            </span>
          </div>
        )}
        {personalChats.map((chat) => (
          <div
            key={chat._id}
            className="p-2 mx-1 my-0.5 bg-white rounded-md shadow-sm border border-gray-300 cursor-pointer hover:bg-blue-100 transition"
            onClick={() => {
              onSelectChat(chat.userId || chat.id || chat._id || "unknown");
              onChatType("personal");
              chatName(chat.username || chat.profile.username);
            }}
          >
            <span className="text-xs font-medium text-gray-800">
              {chat.username || chat.profile.username}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="p-1 bg-gray-100 border-t border-gray-300 shadow-md flex justify-between items-center">
        <button className="text-blue-600 text-[10px] font-medium hover:underline">
          Settings
        </button>
        <button
          className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded hover:bg-blue-600 transition"
          onClick={onNewChat} // Open New Chat Modal
        >
          New Chat
        </button>
      </div>
    </div>
  );
};

const NewChatModal = ({
  onClose,
  personalChats,
  setPersonalChats,
  setChatName,
}) => {
  const { profile } = useSelector((store) => store.auth);
  const friends = profile.profile.friends || [];

  const [selectedUser, setSelectedUser] = useState(null);

  const startChat = () => {
    if (!selectedUser) return;

    // Find friend details
    const friend = friends.find((f) => f._id === selectedUser);
    console.log("friend", friend);
    // Check if already in personalChats
    if (!personalChats.find((chat) => chat._id === friend._id)) {
      setPersonalChats([...personalChats, { ...friend, type: "personal" }]);
      setChatName(friend.profile.username);
    }

    onClose(); // Close modal
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded-lg shadow-lg w-80">
        <h2 className="text-lg font-semibold mb-2">Start a New Chat</h2>
        <select
          className="w-full p-2 border rounded-md"
          value={selectedUser || ""}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Select a friend</option>
          {friends.map((friend) => (
            <option key={friend._id} value={friend._id}>
              {friend.profile.username}
            </option>
          ))}
        </select>

        <div className="flex justify-end mt-3">
          <button
            className="px-3 py-1 bg-gray-300 rounded-md mr-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded-md"
            onClick={startChat}
          >
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
};
