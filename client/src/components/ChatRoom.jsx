import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket.js";
import { useWebRTC } from "../hooks/useWebRTC.js";
import { useAuth } from "../context/AuthContext.jsx";
import InterestTags from "./InterestTags.jsx";
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

  const [stage, setStage] = useState("lobby"); // lobby | chatting
  const [gender, setGender] = useState("male");
  const [preferGender, setPreferGender] = useState("anyone");
  const [interests, setInterests] = useState([]);
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
      setStage("chatting");
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

  const findChat = async () => {
    if (!connected) return;
    const stream = await ensureLocalStream();
    if (!stream) return;
    setStage("chatting");
    enterWaiting();
  };

  const enterWaiting = () => {
    stopRTC();
    setRoom(null);
    setStrangerAlias(null);
    setMessages([]);
    setStrangerTyping(false);
    setWaiting(true);
    setWaitingFact(randomFact());
    setTimeout(() => {
      socket?.emit("join-queue", {
        interests,
        gender,
        preferGender,
      });
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

      {/* Lobby */}
      {stage === "lobby" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
          {/* Background blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-30%] right-[-20%] w-[500px] h-[500px] bg-gradient-to-br from-red-600/15 to-transparent rounded-full blur-[100px] animate-drift-1" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-gradient-to-tr from-violet-600/10 to-transparent rounded-full blur-[100px] animate-drift-2" />
          </div>

          <div className="relative max-w-lg w-full">
            {/* Glass card */}
            <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-3xl px-8 py-10 shadow-2xl shadow-black/40">

              {/* Gender selection */}
              <div className="mb-8">
                <h2 className="text-xl font-bold tracking-wide">I am a...</h2>
                <div className="mt-4 flex justify-center gap-3">
                  {[
                    { key: "male", label: "Male", icon: "\u2642" },
                    { key: "female", label: "Female", icon: "\u2640" },
                    { key: "other", label: "Other", icon: "\u26A5" },
                  ].map((g) => (
                    <button
                      key={g.key}
                      onClick={() => setGender(g.key)}
                      className={
                        "group flex flex-col items-center gap-1.5 px-6 py-3 rounded-2xl border text-sm font-medium transition-all duration-200 " +
                        (gender === g.key
                          ? "bg-white text-zinc-900 border-white shadow-lg shadow-white/10 scale-105"
                          : "border-white/10 text-zinc-400 hover:border-white/20 hover:bg-white/[0.03]")
                      }
                    >
                      <span className="text-lg">{g.icon}</span>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

              {/* Preference selection */}
              <div className="mb-8">
                <h2 className="text-xl font-bold tracking-wide">Match me with...</h2>
                <div className="mt-4 flex justify-center gap-3">
                  {[
                    { key: "male", label: "Male", icon: "\u2642" },
                    { key: "female", label: "Female", icon: "\u2640" },
                    { key: "anyone", label: "Anyone", icon: "\u2728" },
                  ].map((g) => (
                    <button
                      key={g.key}
                      onClick={() => setPreferGender(g.key)}
                      className={
                        "group flex flex-col items-center gap-1.5 px-6 py-3 rounded-2xl border text-sm font-medium transition-all duration-200 " +
                        (preferGender === g.key
                          ? "bg-gradient-to-b from-red-500 to-red-600 text-white border-red-400/30 shadow-lg shadow-red-500/20 scale-105"
                          : "border-white/10 text-zinc-400 hover:border-white/20 hover:bg-white/[0.03]")
                      }
                    >
                      <span className="text-lg">{g.icon}</span>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

              {/* Interests */}
              <div className="mb-8">
                <h2 className="text-lg font-bold tracking-wide">Interests</h2>
                <p className="mt-1 text-xs text-zinc-500">Pick a few for faster matching</p>
                <div className="mt-4">
                  <InterestTags selected={interests} onChange={setInterests} />
                </div>
              </div>

              {/* Start button */}
              <button
                onClick={findChat}
                disabled={!connected}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold text-lg tracking-widest shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
              >
                {connected ? "START" : "CONNECTING..."}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main chat view */}
      {stage === "chatting" && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
          {/* LEFT: stranger video + red Next button */}
          <div className="flex flex-col gap-3 min-h-0">
            <div className="relative flex-1 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={"w-full h-full object-cover " + (waiting ? "hidden" : "")}
              />
              {waiting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <div className="flex gap-1.5 mb-4">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
                    Finding next BITSian...
                  </div>
                  <div className="text-sm text-zinc-300 italic max-w-xs">{waitingFact}</div>
                </div>
              )}
              {!waiting && (
                <span className="absolute top-2 left-2 text-xs bg-black/60 px-2 py-1 rounded">
                  {strangerAlias || "Stranger"}
                </span>
              )}
              {!waiting && (
                <button
                  onClick={() => setReportOpen(true)}
                  className="absolute top-2 right-2 text-xs bg-black/60 hover:bg-red-600 px-2 py-1 rounded"
                >
                  Report
                </button>
              )}
            </div>
            <button
              onClick={next}
              className="w-full py-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-lg tracking-wider shadow-lg"
            >
              NEXT
            </button>
          </div>

          {/* RIGHT: self video + chat */}
          <div className="flex flex-col gap-3 min-h-0">
            <div className="relative flex-1 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
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
            <div className="flex flex-col bg-zinc-900 rounded-lg border border-zinc-800 h-64">
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
      )}

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={(reason) => socket.emit("report", { reason })}
      />
    </div>
  );
}
