import React, { useState, useEffect } from 'react';
import socket from '../sockets/socket';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    socket.on('chat-message', (msg) => setMessages((msgs) => [...msgs, msg]));
    return () => socket.off('chat-message');
  }, []);

  const sendMessage = () => {
    socket.emit('chat-message', input);
    setInput('');
  };

  return (
    <div>
      <div>{messages.map((m, i) => <div key={i}>{m}</div>)}</div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;