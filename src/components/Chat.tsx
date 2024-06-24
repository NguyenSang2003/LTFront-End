import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {sendMessage} from '../utils/websocket';

interface ChatProps {
    socket: WebSocket | null;
}

const Chat: React.FC<ChatProps> = ({socket}) => {
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [recipient, setRecipient] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (socket) {
            const handleMessage = (msg: MessageEvent) => {
                const data = JSON.parse(msg.data);
                console.log("Received message: ", data);
                if (data.event === "RECEIVE_CHAT" || (data.event === "SEND_CHAT" && data.status === "success")) {
                    setMessages((prevMessages) => [...prevMessages, data.data.mes]);
                } else if (data.event === "AUTH" && data.status === "error" && data.mes === "User not Login") {
                    alert("Session expired. Please log in again.");
                    navigate('/');
                }
            };
            // const handleMessage = (msg: MessageEvent) => {
            //     const data = JSON.parse(msg.data);
            //     console.log("Received message: ", data);
            //     if (data.event === "RECEIVE_CHAT") {
            //         setMessages((prevMessages) => [...prevMessages, data.data.mes]);
            //     } else if (data.event === "SEND_CHAT" && data.status === "success") {
            //         setMessages((prevMessages) => [...prevMessages, data.data.mes]);
            //     } else if (data.event === "AUTH" && data.status === "error" && data.mes === "User not Login") {
            //         alert("Session expired. Please log in again.");
            //         navigate('/');
            //     }
            // };

            socket.addEventListener('message', handleMessage);

            return () => {
                socket.removeEventListener('message', handleMessage);
            };
        }
    }, [socket]);

    const sendMessageHandler = () => {
        if (input && recipient && socket) {
            const chatMessage = {
                action: "onchat",
                data: {
                    event: "SEND_CHAT",
                    data: {
                        type: "people",
                        to: recipient,
                        mes: input
                    }
                }
            };
            console.log("Sending message: ", chatMessage);
            sendMessage(socket, chatMessage);
            setInput(""); // Clear the input field after sending the message

            // Update state messages for the sent message
            setMessages((prevMessages) => [...prevMessages, `You
                : ${input}
                    `]);
        }
    };

    return (
        <div>
            <h2>Chat</h2>
            <div style={{border: '1px solid black', padding: '10px', height: '200px', overflowY: 'scroll'}}>
                {messages.map((msg, index) => (
                    <div key={index}>{msg}</div>
                ))}
            </div>
            <input
                type="text"
                placeholder="Recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
            />
            <input
                type="text"
                placeholder="Message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            <button onClick={sendMessageHandler}>Send</button>
        </div>
    );
};

export default Chat;