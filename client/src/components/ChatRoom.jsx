import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket.js";
import { useWebRTC } from "../hooks/useWebRTC.js";
import { useAuth } from "../context/AuthContext.jsx";
import MessageBubble from "./MessageBubble.jsx";
import ReportModal from "./ReportModal.jsx";

const BITS_FACTS = [
  "BITS Pilani was founded in 1964.",
  "The Clock Tower is Pilani's most iconic landmark.",
  "Oasis and APOGEE are BITS Pilani's two biggest fests.",
  "The Saraswati Temple on campus is open to all.",
  "BITSians call their campus 'home' for 4 years and forever after.",
  "The library stays open late during compre week.",
  "Connaught Circle is Pilani's unofficial hangout spot.",
  "BITS Pilani has its own FM radio station — Radio BITS.",
  "The Birla Museum on campus is one of India's best science museums.",
  "Nothing Hill is the unofficial name of a famous campus spot.",
  "BITS Pilani was the first institute to introduce the Practice School program.",
  "The Institute Lawns host almost every major campus event.",
  "SkyLawns is where BITSians go to watch sunsets.",
  "ANC (All Night Canteen) is a late-night ritual for BITSians.",
  "Oasis is one of India's oldest and largest cultural fests.",
];

function randomFact() {
  return BITS_FACTS[Math.floor(Math.random() * BITS_FACTS.length)];
}

export default function ChatRoom() {
  const { socket, connected } = useSocket();
  const { start: startRTC, stop: stopRTC, ensureLocalStream, localStream, remoteStream, mediaError } = useWebRTC(socket);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const endRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [waitingFact, setWaitingFact] = useState(randomFact());
  const [room, setRoom] = useState(null);
  const [myAlias, setMyAlias] = useState(null);
  const [strangerAlias, setStrangerAlias] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [strangerTyping, setStrangerTyping] = useState(false);
  const [online, setOnline] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    if (!socket) return;
    const onMatched = ({ roomId, yourAlias, strangerAlias, initiator }) => {
      setRoom(roomId);
      setMyAlias(yourAlias);
      setStrangerAlias(strangerAlias);
      setMessages([]);
      setWaiting(false);
      setNotice(null);
      startRTC(initiator);
    };
    const onRecv = ({ content, timestamp }) =>
      setMessages((m) => [...m, { mine: false, content, timestamp }]);
    const onTyping = () => setStrangerTyping(true);
    const onStopTyping = () => setStrangerTyping(false);
    const onDisconnectStranger = () => enterWaiting();
    const onCount = ({ count }) => setOnline(count);
    const onErr = ({ message }) => setNotice(message);
    const onReportOk = () => setNotice("Report submitted. Thank you.");

    socket.on("matched", onMatched);
    socket.on("receive-message", onRecv);
    socket.on("stranger-typing", onTyping);
    socket.on("stranger-stopped-typing", onStopTyping);
    socket.on("stranger-disconnected", onDisconnectStranger);
    socket.on("online-count", onCount);
    socket.on("error", onErr);
    socket.on("report-received", onReportOk);
    return () => {
      socket.off("matched", onMatched);
      socket.off("receive-message", onRecv);
      socket.off("stranger-typing", onTyping);
      socket.off("stranger-stopped-typing", onStopTyping);
      socket.off("stranger-disconnected", onDisconnectStranger);
      socket.off("online-count", onCount);
      socket.off("error", onErr);
      socket.off("report-received", onReportOk);
    };
  }, [socket]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, strangerTyping]);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  // Auto-start as soon as socket connects
  useEffect(() => {
    if (!connected || started) return;
    setStarted(true);
    (async () => {
      await ensureLocalStream();
      enterWaiting();
    })();
  }, [connected]);

  const enterWaiting = () => {
    stopRTC();
    setRoom(null);
    setStrangerAlias(null);
    setMessages([]);
    setStrangerTyping(false);
    setWaiting(true);
    setWaitingFact(randomFact());
    setTimeout(() => {
      socket?.emit("join-queue", {});
    }, 150);
  };

  const send = (e) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || !room) return;
    socket.emit("send-message", { roomId: room, content });
    setMessages((m) => [...m, { mine: true, content, timestamp: Date.now() }]);
    setInput("");
    socket.emit("stop-typing", { roomId: room });
  };

  const next = () => {
    if (room) socket.emit("skip");
    enterWaiting();
  };

  const onInputChange = (e) => {
    setInput(e.target.value);
    if (room) {
      socket.emit("typing", { roomId: room });
      clearTimeout(onInputChange.t);
      onInputChange.t = setTimeout(() => socket.emit("stop-typing", { roomId: room }), 900);
    }
  };

  const toggleMic = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMicOn((v) => !v);
  };
  const toggleCam = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setCamOn((v) => !v);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {online} online
        </div>
        <h1 className="text-xl font-bold tracking-wider">
          bits<span className="text-red-500">TV</span>
        </h1>
        <button onClick={handleLogout} className="text-xs text-zinc-400 hover:text-white">
          Log out
        </button>
      </header>

      {/* Main chat view */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-2 gap-2 md:gap-4 p-2 md:p-4 overflow-hidden">
          {/* MOBILE: both videos side by side | DESKTOP: left column */}
          <div className="flex flex-col gap-2 md:gap-3 min-h-0 md:min-h-0">
            {/* Video row — side by side on mobile, stacked on desktop */}
            <div className="flex gap-2 md:flex-col md:gap-3 flex-1 min-h-0">
              {/* Stranger video */}
              <div className="relative flex-1 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 min-h-[140px] md:min-h-0 aspect-video md:aspect-auto">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={"w-full h-full object-cover " + (waiting ? "hidden" : "")}
                />
                {waiting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 md:p-6">
                    <div className="flex gap-1.5 mb-2 md:mb-4">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-zinc-500 animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 mb-2 md:mb-4">
                      Finding next BITSian...
                    </div>
                    <div className="text-xs md:text-sm text-zinc-300 italic max-w-xs hidden md:block">{waitingFact}</div>
                  </div>
                )}
                {!waiting && (
                  <span className="absolute top-1 left-1 md:top-2 md:left-2 text-[10px] md:text-xs bg-black/60 px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                    {strangerAlias || "Stranger"}
                  </span>
                )}
                {!waiting && (
                  <button
                    onClick={() => setReportOpen(true)}
                    className="absolute top-1 right-1 md:top-2 md:right-2 text-[10px] md:text-xs bg-black/60 hover:bg-red-600 px-1.5 py-0.5 md:px-2 md:py-1 rounded"
                  >
                    Report
                  </button>
                )}
              </div>

              {/* Self video — beside stranger on mobile, hidden here on desktop */}
              <div className="relative flex-1 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 min-h-[140px] md:min-h-0 aspect-video md:aspect-auto md:hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {!localStream && (
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] md:text-sm text-zinc-500 text-center px-2">
                    {mediaError || "Requesting camera..."}
                  </div>
                )}
                <span className="absolute top-1 left-1 text-[10px] bg-black/60 px-1.5 py-0.5 rounded">
                  {myAlias || "You"}
                </span>
                <div className="absolute bottom-1 right-1 flex gap-1">
                  <button
                    onClick={toggleMic}
                    className="text-[10px] bg-black/60 hover:bg-black/80 px-2 py-0.5 rounded"
                  >
                    {micOn ? "Mic" : "Muted"}
                  </button>
                  <button
                    onClick={toggleCam}
                    className="text-[10px] bg-black/60 hover:bg-black/80 px-2 py-0.5 rounded"
                  >
                    {camOn ? "Cam" : "Off"}
                  </button>
                </div>
              </div>
            </div>

            {/* Controls row — mobile */}
            <div className="flex gap-2 md:gap-3">
              <button
                onClick={next}
                className="flex-1 py-3 md:py-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-sm md:text-lg tracking-wider shadow-lg"
              >
                NEXT
              </button>
            </div>
          </div>

          {/* RIGHT: self video (desktop only) + chat */}
          <div className="flex flex-col gap-2 md:gap-3 min-h-0 flex-1">
            {/* Self video — desktop only */}
            <div className="relative bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hidden md:block md:flex-1">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {!localStream && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500 text-center px-4">
                  {mediaError || "Requesting camera..."}
                </div>
              )}
              <span className="absolute top-2 left-2 text-xs bg-black/60 px-2 py-1 rounded">
                {myAlias || "You"}
              </span>
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button
                  onClick={toggleMic}
                  className="text-xs bg-black/60 hover:bg-black/80 px-3 py-1 rounded"
                >
                  {micOn ? "Mic" : "Muted"}
                </button>
                <button
                  onClick={toggleCam}
                  className="text-xs bg-black/60 hover:bg-black/80 px-3 py-1 rounded"
                >
                  {camOn ? "Cam" : "Off"}
                </button>
              </div>
            </div>

            {/* Chat box */}
            <div className="flex flex-col bg-zinc-900 rounded-lg border border-zinc-800 flex-1 md:h-64 md:flex-none min-h-[180px]">
              <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2">
                {!waiting && messages.length === 0 && !strangerTyping && (
                  <div className="text-xs text-zinc-600 text-center pt-4">
                    Say hi to {strangerAlias || "your match"}
                  </div>
                )}
                {waiting && (
                  <div className="text-xs text-zinc-600 text-center pt-4">
                    Waiting for a match...
                  </div>
                )}
                {messages.map((m, i) => (
                  <MessageBubble key={i} content={m.content} mine={m.mine} />
                ))}
                {strangerTyping && (
                  <div className="text-xs text-zinc-500 italic">Stranger is typing...</div>
                )}
                {notice && (
                  <div className="text-center text-xs text-zinc-500 mt-4">{notice}</div>
                )}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} className="p-2 border-t border-zinc-800 flex gap-2">
                <input
                  value={input}
                  onChange={onInputChange}
                  placeholder={waiting ? "Waiting for a match..." : "Type a message..."}
                  maxLength={2000}
                  disabled={waiting}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={waiting}
                  className="bg-white text-zinc-900 font-medium px-4 py-2 rounded-lg hover:bg-zinc-100 disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
      </div>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={(reason) => socket.emit("report", { reason })}
      />
    </div>
  );
}
