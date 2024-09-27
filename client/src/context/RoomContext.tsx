import React, { createContext, useEffect } from "react";
import socketIOClient from "socket.io-client";
import { useNavigate } from "react-router-dom";
const WS = "http://localhost:8080";

export const RoomContext = createContext<null | any>(null);

const ws = socketIOClient(WS);
export const RoomProvider = ({ children }: any) => {
  const navigate = useNavigate();

  const enterRoom = (roomId: { roomId: "string" }) => {
    navigate(`/room/${roomId}`);
  };

  useEffect(() => {
    ws.on("room-created", enterRoom);
  }, []);

  return <RoomContext.Provider value={{ ws }}>{children}</RoomContext.Provider>;
};
