import { useState } from "react";
import { useSelector } from "react-redux";
import ChatBox from "../components/common/ChatBox";

const Chats = () => {
  const { profile } = useSelector((store) => store.auth);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatType, setChatType] = useState(null);
  const [chatName, setChatName] = useState(null);

  const personalChats = [
    { _id: "1", name: "Bhupesh" },
    { _id: "2", name: "Rohan" },
    { _id: "3", name: "Aryan" },
    { _id: "4", name: "Sohan" },
  ];

  return (
    <div className="flex h-[calc(100vh-96px)]">
      {/* Sidebar always visible on larger screens, hidden on mobile when chat is open */}
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
        />
      </div>
      {/* Chat Box full width on mobile, fills remaining space on larger screens */}
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
    </div>
  );
};

export default Chats;

const ChatSidebar = ({ onSelectChat, onChatType, clanChat, personalChats }) => {
  return (
    <div className="h-full md:pb-0 bg-blue-50 border-r border-blue-300 shadow-lg w-full flex flex-col">
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
        {personalChats?.map((chat) => (
          <div
            key={chat._id}
            className="p-2 mx-1 my-0.5 bg-white rounded-md shadow-sm border border-gray-300 cursor-pointer hover:bg-blue-100 transition"
            onClick={() => {
              onSelectChat(chat._id);
              onChatType("personal");
            }}
          >
            <span className="text-xs font-medium text-gray-800">
              {chat.name}
            </span>
          </div>
        ))}
      </div>
      {/* Bottom Actions */}
      <div className="p-1 bg-gray-100 border-t border-gray-300 shadow-md flex justify-between items-center">
        <button className="text-blue-600 text-[10px] font-medium hover:underline">
          Settings
        </button>
        <button className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded hover:bg-blue-600 transition">
          New Chat
        </button>
      </div>
    </div>
  );
};
