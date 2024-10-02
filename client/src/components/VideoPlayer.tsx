import { useEffect, useRef } from "react";

export const VideoPlayer: React.FC<{
  stream: MediaStream;
  className?: string;
}> = ({ stream, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);
  return (
    <div className={className}>
      {stream ? (
        <video style={{ width: "100%" }} ref={videoRef} autoPlay muted={true} />
      ) : (
        "Video placeholder"
      )}
    </div>
  );
};
