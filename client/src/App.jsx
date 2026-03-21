import { useEffect, useRef, useState } from "react";
import { connection } from "./connection";
import { ToastContainer, toast } from "react-toastify";
import { v4 as uuid } from "uuid";

export default function App() {
  const socket = useRef(null);
  const timer = useRef(null);
  const bottomRef = useRef(null);

  const [userName, setUserName] = useState("");
  const [showNamePopup, setShowNamePopup] = useState(true);
  const [inputName, setInputName] = useState("");
  const [typers, setTypers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // SOCKET SETUP
  useEffect(() => {
    socket.current = connection();

    socket.current.on("connect", () => {
      console.log("Connected with socket id:", socket.current.id);
    });

    socket.current.on("roomNotice", (name) => {
      toast.info(`${name} is joined to the chat`);
    });

    socket.current.on("chatMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.current.on("typing", (name) => {
      setTypers((prev) => {
        if (!prev.includes(name)) return [...prev, name];
        return prev;
      });
    });

    socket.current.on("stopTyping", (name) => {
      setTypers((prev) => prev.filter((t) => t !== name));
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // TYPING LOGIC
  // When text state changes send typing event
  useEffect(() => {
    if (!socket.current || !userName) return;

    if (text.trim()) {
      socket.current.emit("typing");
    }

    clearTimeout(timer.current);

    timer.current = setTimeout(() => {
      socket.current.emit("stopTyping");
    }, 1000);

    return () => clearTimeout(timer.current);
  }, [text, userName]);

  // FORMAT TIME
  function formatTime(ts) {
    const d = new Date(ts); // convert the passed timestamp to date
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); // format the time as hh:mm
  }

  // JOIN CHAT
  function handleNameSubmit(e) {
    e.preventDefault();
    const name = inputName.trim();
    if (!name || !socket.current) return;

    socket.current.emit("joinRoom", name);

    setUserName(name);
    setShowNamePopup(false);
  }

  // SEND MESSAGE
  function sendMessage() {
    const msgText = text.trim();
    if (!msgText || !socket.current) return;
    let newId = uuid();

    const msg = {
      id: newId,
      sender: userName,
      text: msgText,
      ts: Date.now(),
    };

    setMessages((prev) => [...prev, msg]);
    socket.current.emit("chatMessage", msg);

    setText("");
  }

  // ENTER KEY
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 p-4">
        {/* NAME POPUP */}
        {showNamePopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
              <h2 className="text-xl font-semibold">Join Chat</h2>
              <p className="text-gray-500 text-sm mt-1">
                Enter your name to continue
              </p>

              <form onSubmit={handleNameSubmit} className="mt-4 space-y-3">
                <input
                  autoFocus
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Peter Parker"
                />
                <button className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition">
                  Continue
                </button>
              </form>
            </div>
          </div>
        )}

        {/* CHAT */}
        {!showNamePopup && (
          <div className="w-full max-w-2xl h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
            {/* HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-b-gray-300 bg-white">
              <div>
                <h1 className="font-semibold text-sm">Chat App</h1>
                {typers.length > 0 && (
                  <p className="text-[10px] text-gray-500">
                    {typers.join(", ")} typing...
                  </p>
                )}
              </div>
              <span className="text-sm text-gray-500">{userName}</span>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
              {messages.map((m) => {
                const mine = m.sender === userName;

                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[50%] px-4 py-2 rounded-2xl text-sm shadow ${
                        mine
                          ? "bg-green-500 text-white rounded-br-sm"
                          : "bg-white border rounded-bl-md"
                      }`}
                    >
                      <p>{m.text}</p>

                      <div className="flex justify-end gap-1 mt-1 text-[10px] opacity-70">
                        <span>{m.sender}</span>
                        <span>{formatTime(m.ts)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef}></div>
            </div>

            {/* INPUT */}
            <div className="p-4 border-t border-t-gray-300 bg-white">
              <div className="flex items-center gap-3 border rounded px-4 py-2">
                <textarea
                  rows={1}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 resize-none outline-none text-sm"
                />
                <button
                  onClick={sendMessage}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition cursor-pointer"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
