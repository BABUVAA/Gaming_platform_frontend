import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useSocket } from "../../context/socketContext";
import { FiMessageCircle } from "react-icons/fi";

const ChatBox = ({ chatType, selectedChat, chatName, onBack }) => {
  const { profile } = useSelector((store) => store.auth); // User profile
  const { userClanData } = useSelector((store) => store.clan); // Clan data
  const [message, setMessage] = useState(""); // To hold the current message
  const [messages, setMessages] = useState([]); // To hold all the chat messages
  const socket = useSocket();

  // Determine chat ID based on type
  const chatId = chatType === "clan" ? userClanData?.data?._id : profile._id; // ✅ Fixed chatId
  const senderId = profile._id; // ✅ Fixed senderId
  const senderName = profile.profile.username;
  console.log(chatType);
  // Join chat room and listen for messages
  useEffect(() => {
    if (!chatId || !senderId) return; // ✅ Prevents invalid IDs

    // Listen for new messages
    const messageListener = (newMessage) => {
      console.log("New message received:", newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    socket.socket.on(`${chatType}_message`, messageListener); // ✅ Use event constant

    // Join chat room
    socket.socket.emit(`join_${chatType}_room`, chatId);

    // Cleanup on unmount
    return () => {
      socket.socket.emit(`leave_${chatType}_room`, chatId);
      socket.socket.off(`${chatType}_message`, messageListener);
    };
  }, [chatType, chatId, senderId]);

  // Send a new message
  const sendMessage = () => {
    if (!message.trim()) return;

    const messageData = {
      clanId: chatId, // ✅ Ensure correct reference
      senderId: senderId, // ✅ Ensure correct sender
      senderName: senderName,
      message,
    };

    // Emit the message to the server
    console.log("Sending message:", messageData); // Debug message data
    socket.socket.emit(`${chatType}_message`, messageData); // ✅ Use event constant

    // Clear the input field after sending
    setMessage("");
  };

  return (
    <div className="relative mx-auto w-full h-full bg-white dark:bg-zinc-800 shadow-md rounded-lg overflow-hidden">
      {!chatType ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <FiMessageCircle
            size={40}
            className="text-gray-400 dark:text-gray-600 mb-3"
          />
          <h2 className="text-base font-medium text-gray-700 dark:text-gray-300">
            No Chat Selected
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a chat to start messaging!
          </p>
        </div>
      ) : (
        <div className="flex flex-col h-full w-full">
          <div className="flex justify-between items-center p-2 border-b dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <button
                className="md:hidden text-zinc-800 dark:text-white"
                onClick={() => onBack()}
              >
                ←
              </button>
              <h2 className="text-base font-medium text-zinc-800 dark:text-white">
                {chatType === "clan" ? "Clan Chat" : "Private Chat"}
              </h2>
            </div>
            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Online
            </div>
          </div>

          <div
            className="flex-1 p-2 overflow-y-auto flex flex-col space-y-1.5"
            id="chatDisplay"
          >
            {userClanData?.data?.chat.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.senderId === senderId ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-3 py-1.5 text-sm max-w-[80%] ${
                    msg.senderId === senderId
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-black"
                  }`}
                >
                  <span className="font-medium">{msg.senderName}: </span>
                  {msg.message}
                </div>
              </div>
            ))}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.senderId === senderId ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-3 py-1.5 text-sm max-w-[80%] ${
                    msg.senderId === senderId
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-black"
                  }`}
                >
                  <span className="font-medium">{msg.senderName}: </span>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 border-t dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <input
                placeholder="Type a message..."
                className="flex-1 p-2 border rounded-full dark:bg-zinc-700 dark:text-white dark:border-zinc-600 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-1.5 px-4 rounded-full transition duration-300 ease-in-out text-sm"
                onClick={sendMessage}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
