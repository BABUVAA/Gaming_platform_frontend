import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const WebSocketTest = () => {
  const [status, setStatus] = useState("Connecting...");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const socket = io("http://localhost:8080", {
      transports: ["websocket"], // Ensures WebSocket transport
    });

    // Handle connection
    socket.on("connect", () => {
      setStatus("Connected");
      console.log("Connected to WebSocket server");
    });

    // Handle connection error
    socket.on("connect_error", (err) => {
      setStatus("Connection Error");
      console.error("Connection Error:", err.message);
    });

    // Handle welcome message
    socket.on("welcome", (data) => {
      setMessage(data.message);
      console.log("Received message:", data.message);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      setStatus("Disconnected");
      console.log("Disconnected from WebSocket server");
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
      console.log("WebSocket connection closed.");
    };
  }, []);

  return <></>;
};

export default WebSocketTest;
