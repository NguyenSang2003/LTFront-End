import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendMessage } from '../utils/websocket';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/css/template.min.css';

interface ChatProps {
    socket: WebSocket | null;
}

interface User {
    name: string;
    actionTime: string;
    type: number;
}

const Chat: React.FC<ChatProps> = ({ socket }) => {
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [recipient, setRecipient] = useState("");
    const [recipients, setRecipients] = useState<User[]>([]);
    const [isChatVisible, setIsChatVisible] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (socket) {
            const handleMessage = (msg: MessageEvent) => {
                const data = JSON.parse(msg.data);
                console.log("Received message: ", data);
                if (data.event === "RECEIVE_CHAT") {
                    setMessages((prevMessages) => [...prevMessages, data.data.mes]);
                } else if (data.event === "SEND_CHAT" && data.status === "success") {
                    setMessages((prevMessages) => [...prevMessages, `You: ${data.data.mes}`]);
                } else if (data.event === "AUTH" && data.status === "error" && data.mes === "User not Login") {
                    alert("Session expired. Please log in again.");
                    navigate('/');
                } else if (data.event === "USER_LIST" || data.event === "USER_LIST_UPDATE" || data.event === "GET_USER_LIST") {
                    setRecipients(data.data.users || data.data);
                }
            };

            // Send request to get the list of users
            sendMessage(socket, {
                action: "onchat",
                data: {
                    event: "GET_USER_LIST"
                }
            });

            socket.addEventListener('message', handleMessage);

            return () => {
                socket.removeEventListener('message', handleMessage);
            };
        }
    }, [socket, navigate]);

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
            setMessages((prevMessages) => [...prevMessages, `You: ${input}`]);
        }
    };

    const handleRecipientClick = (rec: string) => {
        setRecipient(rec);
        setMessages([]); // Clear messages when switching recipient
        setIsChatVisible(true); // Show chat when selecting a recipient
    };

    const refreshUserList = () => {
        if (socket) {
            sendMessage(socket, {
                action: "onchat",
                data: {
                    event: "GET_USER_LIST"
                }
            });
        }
    };

    return (
        <div className="d-flex flex-column flex-md-row">
            <div className={`sidebar bg-light border-right ${isChatVisible ? 'd-none d-md-block' : 'd-block'}`}>
                <div className="p-4">
                    <h5>App Chat RealTime NLU</h5>
                </div>
                <div className="p-4">
                    <input type="text" className="form-control" placeholder="Tìm kiếm người dùng" />
                </div>
                <div className="d-flex justify-content-between align-items-center p-4">
                    <h6>Danh sách người dùng</h6>
                    <button className="btn btn-outline-secondary" onClick={refreshUserList}>Tải lại</button>
                </div>
                <div className="recipients list-group list-group-flush">
                    {recipients.length > 0 ? (
                        recipients.map((rec) => (
                            <div
                                key={rec.name}
                                className={`list-group-item list-group-item-action ${rec.name === recipient ? 'active' : ''}`}
                                onClick={() => handleRecipientClick(rec.name)}
                            >
                                {rec.name}
                            </div>
                        ))
                    ) : (
                        <div className="list-group-item">Không có người dùng nào đăng nhập hiện tại.</div>
                    )}
                </div>
            </div>
            <div className="main flex-grow-1">
                <div className="chat-body d-flex flex-column h-100">
                    <div className="chat-header border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                        <div className="media align-items-center">
                            <div className="media-body">
                                <h6 className="mb-0">{recipient || 'Chọn người nhận để bắt đầu trò chuyện'}</h6>
                            </div>
                        </div>
                        <button className="btn btn-outline-secondary d-md-none" onClick={() => setIsChatVisible(!isChatVisible)}>
                            {isChatVisible ? 'Người dùng' : 'Chat'}
                        </button>
                    </div>
                    <div className="chat-content flex-grow-1 p-4 overflow-auto">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.startsWith('You:') ? 'text-right' : 'text-left'}`}>
                                <div className={`message-body ${msg.startsWith('You:') ? 'bg-primary text-white' : 'bg-light'}`}>
                                    {msg.replace('You: ', '')}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="chat-footer border-top py-3 px-4">
                        <form className="d-flex align-items-center" onSubmit={(e) => {
                            e.preventDefault();
                            sendMessageHandler();
                        }}>
                            <input
                                type="text"
                                className="form-control mr-3"
                                placeholder="Nhập tin nhắn..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button className="btn btn-primary" type="submit">
                                Gửi
                            </button>
                        </form>
                        <div className="input-group mt-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Người nhận tin"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;