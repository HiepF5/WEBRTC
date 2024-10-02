import {
  createContext,
  useEffect,
  useReducer,
  useState,
  ReactNode,
} from "react";
import Peer from "peerjs";
import { v4 as uuidV4 } from "uuid";

import socketIOClient from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { peersReducer } from "./peersReducer";
import { addPeerAction, removePeerAction } from "./peersActions";
const WS = "http://localhost:8080";

export const RoomContext = createContext<null | any>(null);

const ws = socketIOClient(WS);

interface RoomProviderProps {
  children: ReactNode;
}

export const RoomProvider: React.FunctionComponent<RoomProviderProps> = ({
  children,
}) => {
  const navigate = useNavigate();

  const [me, setMe] = useState<Peer>();
  const [peers, dispatch] = useReducer(peersReducer, {});
  const [stream, setStream] = useState<MediaStream>();
  const [screenSharingId, setscreenSharingId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const enterRoom = ({ roomId }: { roomId: "string" }) => {
    navigate(`/room/${roomId}`);
  };

  const handleUserList = ({ participants }: { participants: string[] }) => {
    participants.map((peerId) => {
      const call = stream && me?.call(peerId, stream);
      console.log("call", call);
      call?.on("stream", (userVideoStream: MediaStream) => {
        console.log({ addPeerAction });
        dispatch(addPeerAction(peerId, userVideoStream));
      });
    });
  };

  const removePeer = (peerId: string) => {
    dispatch(removePeerAction(peerId));
  };
  const switchScreen = (stream: MediaStream) => {
    setStream(stream);
    setscreenSharingId(me?.id || null);
    Object.values(me?.connections || {}).forEach((connection: any) => {
      const videoTrack = stream
        ?.getVideoTracks()
        .find((track) => track.kind === "video");
      connection[0].peerConnection
        .getSenders()[1]
        .replaceTrack(videoTrack)
        .catch((err: any) => {
          console.error({ err });
        });
    });
  };
  const shareScreen = () => {
    if (screenSharingId) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then(switchScreen);
    } else {
      navigator.mediaDevices.getDisplayMedia({}).then(switchScreen);
    }
  };

  useEffect(() => {
    const meId = uuidV4();
    const peer = new Peer(meId);
    setMe(peer);
    try {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setStream(stream);
        });
    } catch (err) {
      console.error({ err });
    }
    ws.on("room-created", enterRoom);
    ws.on("get-users", handleUserList);
    ws.on("user-disconnected", removePeer);
    ws.on("user-shared-screen", (peerId: string) => setscreenSharingId(peerId));
    ws.on("user-stopped-sharing", () => setscreenSharingId(""));
    return () => {
      ws.off("room-created");
      ws.off("get-users");
      ws.off("user-disconnected");
      ws.off("user-shared-screen");
      ws.off("user-stopped-sharing");
    };
  }, []);
  useEffect(() => {
    if (screenSharingId) {
      ws.emit("start-sharing", { peerId: screenSharingId, roomId });
    } else {
      ws.emit("stop-sharing");
    }
  }, [screenSharingId, roomId]);

  useEffect(() => {
    if (!stream) return;
    if (!me) return;

    ws.on("user-joined", ({ peerId }: { roomId: string; peerId: string }) => {
      const call = stream && me.call(peerId, stream);
      call.on("stream", (userVideoStream: MediaStream) => {
        dispatch(addPeerAction(peerId, userVideoStream));
      });
    });

    me.on("call", (call) => {
      call.answer(stream);
      call.on("stream", (userVideoStream) => {
        dispatch(addPeerAction(call.peer, userVideoStream));
      });
    });
  }, [stream, me]);
  console.log({ peers });

  return (
    <RoomContext.Provider
      value={{ ws, me, peers, stream, shareScreen, setRoomId, screenSharingId }}
    >
      {children}
    </RoomContext.Provider>
  );
};
