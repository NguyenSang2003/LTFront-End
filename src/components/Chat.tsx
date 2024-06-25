import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {sendMessage} from '../utils/websocket';
import '../assets/css/template.min.css';

interface ChatProps {
    socket: WebSocket | null;
}

interface User {
    name: string;
    actionTime: string;
    type: number;
}

const Chat: React.FC<ChatProps> = ({socket}) => {
    const [messages, setMessages] = useState<string[]>([]);
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
                    setMessages((prevMessages) => [...prevMessages, data.data.mes]);
                } else if (data.event === "SEND_CHAT" && data.status === "success") {
                    setMessages((prevMessages) => [...prevMessages, `You: ${data.data.mes}`]);
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
    }, [socket, navigate]);

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

            setMessages((prevMessages) => [...prevMessages, `You: ${input}`]);
        }
    };


    // Hàm xử lý khi ấn vào người dùng
    const handleRecipientClick = (rec: string) => {
        setRecipient(rec);
        setMessages([]); //Xóa toàn bộ tin nhắn
        setIsChatVisible(true); //Hiển thị phần chat
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

    return (
        <div className="d-flex flex-column flex-md-row vh-100">
            {/*Phần danh sách người dùng*/}
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

            {/*Phần chat*/}
            <div className={`main flex-grow-1 ${isChatVisible ? 'main-visible' : ''}`}>
                <div className="chat-body d-flex flex-column h-100">
                    <div
                        className="chat-header border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                        <div className="media align-items-center">
                            <div className="media-body d-flex align-items-center">

                                {/*Nút quay lại từ chat tới danh sách người dùng*/}
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
                    </div>
                    <div className="chat-content flex-grow-1 p-4 overflow-auto">
                        {messages.map((msg, index) => (
                            <div key={index}
                                 className={`message ${msg.startsWith('You:') ? 'text-right' : 'text-left'}`}>
                                <div
                                    className={`message-body ${msg.startsWith('You:') ? 'bg-primary text-white' : 'bg-light'}`}>
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;