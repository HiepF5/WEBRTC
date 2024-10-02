import { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { VideoPlayer } from "../components/VideoPlayer";
import { RoomContext } from "../context/RoomContext";
import { ShareScreenButton } from "../components/ShareScreenButton";
import { PeerState } from "../context/peersReducer";

export const Room = () => {
  const { id } = useParams();
  const { ws, me, peers, stream, shareScreen, screenSharingId, setRoomId } =
    useContext(RoomContext);

  useEffect(() => {
    if (me) ws.emit("join-room", { roomId: id, peerId: me._id });
  }, [id, me, ws]);
  console.log(screenSharingId);
  const screenSharingVideo =
    screenSharingId === me?._id ? stream : peers[screenSharingId]?.stream;

  useEffect(() => {
    setRoomId(id);
  }, [id, setRoomId]);
  const { [screenSharingId]: sharing, ...peersToShow } = peers;
  console.log(peersToShow);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-red-500 p-4 text-white">Room id {id}</div>
      <div className="flex  grow">
        {screenSharingVideo && (
          <div className="w-4/5 pr-4">
            <VideoPlayer
              className="me"
              key={"me"}
              stream={screenSharingVideo}
            />
          </div>
        )}
        <div
          className={`grid gap-4 ${
            screenSharingVideo ? "w-1/5 grid-col-1" : "grid-cols-4"
          }`}
        >
          {screenSharingId !== me?._id && <VideoPlayer stream={stream} />}

          {Object.values(peersToShow as PeerState).map((peer: any) => (
            <VideoPlayer key={peer.id} stream={peer.stream} />
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 p-6 w-full flex justify-center border-t-2 bg-white">
        <ShareScreenButton onClick={shareScreen} />
      </div>
    </div>
  );
};
