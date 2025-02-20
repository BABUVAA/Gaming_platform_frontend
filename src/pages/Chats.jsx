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
    <div className="flex">
      {/* Chat Section (Flexible) */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-128px)] md:h-full">
        {/* Sidebar (1/3 width when screen > 320px, full width otherwise) */}
        <ChatSidebar
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
          onChatType={setChatType}
          clanChat={profile?.clan}
          personalChats={personalChats}
        />
        {/* Chat Box (2/3 width when screen > 320px, hidden otherwise) */}
        <div
          className={`transition-all bg-white flex flex-col ${
            selectedChat ? "w-2/3" : "hidden"
          } md:flex flex-1 hidden`}
        >
          <div className=" flex flex-col w-full h-full">
            <ChatBox
              selectedChat={selectedChat}
              chatType={chatType}
              chatName={chatName}
              onBack={() => setSelectedChat(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chats;

const ChatSidebar = ({ onSelectChat, onChatType, clanChat, personalChats }) => {
  return (
    <div className="h-[calc(100vh-64px)] pb-16 md:p-0 bg-blue-50 border-r border-blue-300 shadow-lg transition-all w-full md:w-1/3 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 bg-blue-500 text-white text-lg font-semibold shadow-md flex justify-between items-center">
        <span>Chats</span>
      </div>

      {/* Chat List (Scroll inside, not on the whole page) */}
      <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
        {/* Clan Chat */}
        {clanChat && (
          <div
            className="p-4 m-2 bg-white rounded-lg shadow-sm border border-blue-300 cursor-pointer hover:bg-blue-100 transition"
            onClick={() => {
              onSelectChat(clanChat._id);
              onChatType("clan");
            }}
          >
            <span className="font-semibold text-blue-600">
              🏆 {clanChat.clanName} (Clan)
            </span>
          </div>
        )}

        {/* Personal Chats */}
        {personalChats?.map((chat) => (
          <div
            key={chat._id}
            className="p-4 m-2 bg-white rounded-lg shadow-sm border border-gray-300 cursor-pointer hover:bg-blue-100 transition"
            onClick={() => {
              onSelectChat(chat._id);
              onChatType("personal");
            }}
          >
            <span className="font-semibold text-gray-800">{chat.name}</span>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="p-2 bg-gray-100 border-t border-gray-300 shadow-md flex justify-between items-center">
        <button className="text-blue-600 font-semibold hover:underline">
          Settings
        </button>
        <button className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition">
          New Chat
        </button>
      </div>
    </div>
  );
};
