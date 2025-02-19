import { useState } from "react";
import { useSelector } from "react-redux";
import { IoArrowBack } from "react-icons/io5";
import ChatBox from "../components/common/ChatBox";

const Chats = () => {
  const { userClanData } = useSelector((store) => store.clan);
  // const { personalChats } = useSelector((store) => store.chat);
  const [selectedChat, setSelectedChat] = useState(null);

  const personalChats = [{ _id: "1", name: "bhupesh" }];
  return (
    <div className="flex h-screen w-full ">
      {/* Sidebar */}
      <div
        className={`bg-white dark:bg-zinc-900 w-full sm:w-1/3 lg:w-1/4 p-4 border-r dark:border-zinc-700 transition-all duration-300 ${
          selectedChat ? "hidden sm:block" : "block"
        }`}
      >
        <h2 className="text-lg font-bold mb-4 text-zinc-800 dark:text-white">
          Chats
        </h2>
        <div className="space-y-2 overflow-y-auto h-[calc(100vh-80px)]">
          {/* Clan Chat */}
          {userClanData?.data && (
            <div
              className="p-3 bg-blue-500 text-white rounded-lg cursor-pointer"
              onClick={() =>
                setSelectedChat({ type: "clan", id: userClanData.data._id })
              }
            >
              Clan Chat
            </div>
          )}

          {/* Personal Chats */}
          {personalChats.map((chat) => (
            <div
              key={chat._id}
              className="p-3 bg-gray-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
              onClick={() =>
                setSelectedChat({ type: "personal", id: chat._id })
              }
            >
              {chat.name}
            </div>
          ))}
        </div>
      </div>

      {/* Chatbox (Visible only if a chat is selected) */}
      <div
        className={`w-full sm:w-2/3 lg:w-3/4 transition-all duration-300 ${
          selectedChat ? "block" : "hidden sm:block"
        }`}
      >
        {selectedChat ? (
          <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="flex items-center p-3 border-b dark:border-zinc-700 bg-white dark:bg-zinc-800">
              <button
                className="sm:hidden mr-3 text-xl"
                onClick={() => setSelectedChat(null)}
              >
                <IoArrowBack />
              </button>
              <h2 className="text-lg font-semibold">
                {selectedChat.type === "clan" ? "Clan Chat" : "Personal Chat"}
              </h2>
            </div>
            {/* Chat Box */}
            <ChatBox chatType={selectedChat.type} />
          </div>
        ) : (
          <div className="hidden sm:flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;
