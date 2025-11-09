import React, { useState } from "react";
import ChatWindow from "./ChatWindow";
import "../../styles/ChatWidget.css";
import { MessageCircle } from "lucide-react"; // optional icon (npm i lucide-react)

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
      <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)}>
        <MessageCircle size={24} />
      </button>
    </>
  );
};

export default ChatWidget;
