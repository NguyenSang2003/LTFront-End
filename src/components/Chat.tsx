import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {sendMessage} from '../utils/websocket';
import {format} from 'date-fns';
import '../assets/css/template.min.css';

interface ChatProps {
    socket: WebSocket | null;
}

interface User {
    name: string;
    actionTime: string;
    type: number;
}

interface Message {
    content: string;
    timestamp: Date;
    isSent: boolean; // Thêm trường này để phân biệt tin nhắn gửi và nhận
}

const Chat: React.FC<ChatProps> = ({socket}) => {
    const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
    const [input, setInput] = useState("");
    const [recipient, setRecipient] = useState("");
    const [recipients, setRecipients] = useState<User[]>([]);
    const [isChatVisible, setIsChatVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (socket) {
            const handleMessage = (msg: MessageEvent) => {
                const data = JSON.parse(msg.data);
                console.log("Received message: ", data);
                if (data.event === "RECEIVE_CHAT") {
                    const newMessages = {...messages};
                    if (!newMessages[recipient]) {
                        newMessages[recipient] = [];
                    }
                    newMessages[recipient].push({
                        content: data.data.mes,
                        timestamp: new Date(),
                        isSent: false
                    });
                    setMessages(newMessages);
                    localStorage.setItem('messages', JSON.stringify(newMessages));
                } else if (data.event === "SEND_CHAT" && data.status === "success") {
                    const newMessages = {...messages};
                    if (!newMessages[recipient]) {
                        newMessages[recipient] = [];
                    }
                    newMessages[recipient].push({
                        content: `Bạn: ${data.data.mes}`,
                        timestamp: new Date(),
                        isSent: true
                    });
                    setMessages(newMessages);
                    localStorage.setItem('messages', JSON.stringify(newMessages));
                } else if (data.event === "AUTH" && data.status === "error" && data.mes === "User not Login") {
                    alert("Phiên đăng nhập đã hết. Hãy đăng nhập lại.");
                    navigate('/');
                } else if (data.event === "USER_LIST" || data.event === "USER_LIST_UPDATE" || data.event === "GET_USER_LIST") {
                    setRecipients(data.data.users || data.data);
                }
            };

            // Gửi yêu cầu lấy ra danh sách người dùng
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
    }, [socket, navigate, recipient, messages]);

    useEffect(() => {
        const storedMessages = localStorage.getItem('messages');
        if (storedMessages) {
            setMessages(JSON.parse(storedMessages));
        }
    }, []);

    // Hàm gửi tin nhắn đi
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
            setInput("");

            const newMessages = {...messages};
            if (!newMessages[recipient]) {
                newMessages[recipient] = [];
            }
            newMessages[recipient].push({
                content: `Bạn: ${input}`,
                timestamp: new Date(),
                isSent: true
            });
            setMessages(newMessages);
            localStorage.setItem('messages', JSON.stringify(newMessages));
        }
    };

    // Hàm xử lý khi ấn vào người dùng
    const handleRecipientClick = (rec: string) => {
        setRecipient(rec);
        setIsChatVisible(true); // Hiển thị phần chat
    };

    // Hàm tải lại danh sách người dùng
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

    // Hàm xóa tin nhắn với xác nhận
    const deleteMessages = () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa tin nhắn này?")) {
            const newMessages = {...messages};
            newMessages[recipient] = [];
            setMessages(newMessages);
            localStorage.setItem('messages', JSON.stringify(newMessages));
        }
    };

    // Hàm định dạng thời gian tin nhắn
    // Định nghĩa hàm formatMessageTime với xử lý lỗi
    const formatMessageTime = (timestamp: string | Date): string => {
        try {
            const date = new Date(timestamp);
            // Kiểm tra nếu date là một giá trị không phải NaN (không phải Invalid Date)
            if (!isNaN(date.getTime())) {
                const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} - ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                return formattedDate;
            } else {
                return 'Invalid Date';
            }
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'Invalid Date';
        }
    };

    return (
        <div className="d-flex flex-column flex-md-row vh-100">
            {/* Phần danh sách người dùng */}
            <div className={`sidebar bg-light border-right ${isChatVisible ? 'sidebar-hidden' : ''}`}>
                <div className="p-4">
                    <h5>App Chat RealTime NLU</h5>
                </div>
                <div className="p-4">
                    <input type="text" className="form-control" placeholder="Tìm kiếm người dùng"/>
                </div>
                <div className="d-flex justify-content-between align-items-center p-4">
                    <h6>Danh sách người dùng</h6>
                    <button style={{
                        fontFamily: 'sans-serif',
                        fontWeight: 'bold'
                    }} className="btn btn-success" onClick={refreshUserList}>Tải lại
                    </button>
                </div>
                <div className="recipients list-group list-group-flush">
                    {recipients.length > 0 ? (
                        recipients.map((rec) => (
                            <div style={{
                                color: '#75e38e',
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }}
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

            {/* Phần chat */}
            <div className={`main flex-grow-1 ${isChatVisible ? 'main-visible' : ''}`}>
                <div className="chat-body d-flex flex-column h-100">
                    <div
                        className="chat-header border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                        <div className="media align-items-center">
                            <div className="media-body d-flex align-items-center">
                                {/* Nút quay lại từ chat tới danh sách người dùng */}
                                <a style={{margin: '0 8px 0 4px'}} className="text-muted px-0" href="#"
                                   onClick={() => setIsChatVisible(false)}>
                                    <i className="fa-solid fa-arrow-left"></i>
                                </a>
                                <h6 style={{
                                    margin: '1px',
                                    fontSize: '18px',
                                    fontWeight: 'bold'
                                }} className="mb-0 ml-2">{recipient || 'Chọn người nhận để bắt đầu trò chuyện'}</h6>
                            </div>
                        </div>
                        {/* Nút xóa tin nhắn */}
                        <button className="btn btn-link text-danger" onClick={deleteMessages}>
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    </div>

                    {/*// Phần hiển thị tin nhắn*/}
                    <div className="chat-content flex-grow-1 p-4 overflow-auto">
                        {(messages[recipient] || []).map((msg, index) => (
                            <div key={index} className={`message ${msg.isSent ? 'text-right' : 'text-left'}`}>
                                <div className={`message-content ${msg.isSent ? 'bg-primary text-white' : 'bg-light'}`}>
                                    {msg.content && msg.content.replace('Bạn: ', '')}
                                    <div className="mt-1">
                                        <small className="opacity-65">{formatMessageTime(msg.timestamp)}</small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Phần nhập tin nhắn */}
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;