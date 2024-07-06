import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendMessage } from '../utils/websocket';
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
}

const Chat: React.FC<ChatProps> = ({socket}) => {
    const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
    const [input, setInput] = useState("");
    const [recipient, setRecipient] = useState("");
    const [recipients, setRecipients] = useState<User[]>([]);
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const navigate = useNavigate();
    const [editIndex, setEditIndex] = useState<number | null>(null); // Trạng thái cho sửa tin nhắn
    const [dropdownVisible, setDropdownVisible] = useState<number | null>(null); // Trạng thái cho menu xổ xuống

    useEffect(() => {
        const loggedInUserName = localStorage.getItem('userName');
        if (loggedInUserName) {
            setUserName(loggedInUserName);
        }

        if (socket) {
            const handleMessage = (msg: MessageEvent) => {
                const data = JSON.parse(msg.data);
                console.log("Received message: ", data);
                if (data.event === "RECEIVE_CHAT" || (data.event === "SEND_CHAT" && data.status === "success")) {
                    const newMessages = {...messages};
                    if (!newMessages[recipient]) {
                        newMessages[recipient] = [];
                    }
                    newMessages[recipient].push({
                        content: data.data.mes,
                        timestamp: new Date(),
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

    // Để lưu lại tin nhắn
    useEffect(() => {
        const storedMessages = localStorage.getItem('messages');
        if (storedMessages) {
            setMessages(JSON.parse(storedMessages));
        }
    }, []);

    const sendMessageHandler = () => {
        if (input && recipient && socket) {
            if (editIndex !== null) {
                const newMessages = {...messages};
                newMessages[recipient][editIndex].content = `Bạn: ${input}`;
                setMessages(newMessages);
                localStorage.setItem('messages', JSON.stringify(newMessages));
                setEditIndex(null);
                setInput("");
                return;
            }

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
            });
            setMessages(newMessages);
            localStorage.setItem('messages', JSON.stringify(newMessages));
        }
    };

    // Hàm xử lý khi ấn vào người dùng
    const handleRecipientClick = (rec: string) => {
        setRecipient(rec);
        setIsChatVisible(true); //Hiển thị phần chat khi thu nhỏ màn hình
    };

    //Hàm sử lý lấy danh sách người dùng
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

    // Hàm xử lý đăng xuất
    const handleLogout = () => {
        localStorage.removeItem('userName');
        localStorage.removeItem('user');
        localStorage.removeItem('reloginCode');
        localStorage.removeItem('messages');

        if (socket) {
            sendMessage(socket, {
                action: "onchat",
                data: {
                    event: "LOGOUT",
                }
            });
        }
        window.location.href = '/'; // sau khi đăng xuất sẽ chuyển về đăng nhập
    };

    // Hàm xóa toàn bộ đoạn tin nhắn
    const deleteMessages = () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa đoạn tin nhắn này?")) {
            const newMessages = {...messages};
            newMessages[recipient] = [];
            setMessages(newMessages);
            localStorage.setItem('messages', JSON.stringify(newMessages));
        }
    };

    // Hàm định dạng thời gian tin nhắn
    const formatMessageTime = (timestamp: string | Date): string => {
        try {
            const date = new Date(timestamp);
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

    // Hàm xử lý sửa tin nhắn
    const handleEditMessage = (index: number) => {
        setInput(messages[recipient][index].content.replace('Bạn: ', ''));
        setEditIndex(index);
    };

    // Hàm xử lý xóa tin nhắn lẻ
    const handleDeleteMessage = (index: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa tin nhắn này? Điều này là không thể khôi phục được!!!")) {
            const newMessages = {...messages};
            newMessages[recipient].splice(index, 1);
            setMessages(newMessages);
            localStorage.setItem('messages', JSON.stringify(newMessages));
        }
    };

    // Hàm xử lý hiển thị menu xổ xuống
    const toggleDropdown = (index: number) => {
        setDropdownVisible(dropdownVisible === index ? null : index);
    };

    //Giao diện chat
    return (
        <div className="d-flex flex-column flex-md-row vh-100">
            {/* Phần danh sách người dùng */}
            <div className={`sidebar bg-light border-right ${isChatVisible ? 'sidebar-hidden' : ''}`}>
                <div className="p-4">
                    <h5>App Chat RealTime NLU</h5>
                </div>

                {/*Thanh tìm kiếm người dùng*/}
                <div className="p-4">
                    <input type="text" className="form-control" placeholder="Tìm kiếm người dùng"/>
                </div>
                <div className="d-flex justify-content-between align-items-center p-4">
                    <h6>{userName || 'Loading...'}</h6>
                    <button
                        style={{ fontFamily: 'sans-serif', fontWeight: 'bold'
                        }} className="btn btn-danger" onClick={handleLogout}>Đăng xuất
                    </button>
                </div>
                <div className="d-flex justify-content-between align-items-center p-4">
                    <h6>Danh sách người dùng</h6>

                    {/* Nút tải lại danh sách người dùng */}
                    <button style={{fontFamily: 'sans-serif', fontWeight: 'bold'}} className="btn btn-success"
                            onClick={refreshUserList}>Tải lại
                    </button>
                </div>
                {/* Hiển thị lên danh sách các người dùng */}
                <div className="recipients list-group list-group-flush">
                    {recipients.length > 0 ? (
                        recipients.map((rec) => (
                            <div style={{color: '#75e38e', fontSize: '18px', fontWeight: 'bold'}}
                                 key={rec.name}
                                 className={`list-group-item list-group-item-action ${rec.name === recipient ? 'active' : ''}`}
                                 onClick={() => handleRecipientClick(rec.name)}>
                                {rec.name}
                            </div>
                        ))
                    ) : (
                        <div className="list-group-item">Không có người dùng nào đăng nhập hiện tại.</div>
                    )}
                </div>
            </div>

            {/* Phần khung chat */}
            <div className={`main flex-grow-1 ${isChatVisible ? 'main-visible' : ''}`}>
                <div className="chat-body d-flex flex-column h-100">

                    {/* Phần header của khung chat */}
                    <div
                        className="chat-header border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                        <div className="media align-items-center">

                            <div className="media-body d-flex align-items-center">

                                {/* Nút quay lại từ chat tới danh sách người dùng */}
                                <a style={{margin: '0 8px 0 4px'}} className="text-muted px-0" href="#"
                                   onClick={() => setIsChatVisible(false)}>
                                    <i className="fa-solid fa-arrow-left"></i>
                                </a>
                                <h6 style={{margin: '1px', fontSize: '18px', fontWeight: 'bold'}}
                                    className="mb-0 ml-2">{recipient || 'Chọn người nhận để bắt đầu trò chuyện'}</h6>
                            </div>
                        </div>

                        {/* Nút Xóa đoạn chat */}
                        <button className="btn btn-link text-danger" onClick={deleteMessages}>
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    </div>

                    {/* Phần hiển thị tin nhắn */}
                    <div className="chat-content flex-grow-1 p-4 overflow-auto">
                        {(messages[recipient] || []).map((msg, index) => (
                            <div key={index} className="message text-right position-relative">
                                <div className="message-content bg-primary text-white d-inline-block p-2 rounded">
                                    {msg.content}
                                    <div className="mt-1">
                                        <small className="opacity-65">{formatMessageTime(msg.timestamp)}</small>
                                    </div>

                                    <div className="dropdown">
                                        {/* Nút dropdown */}
                                        <button className="text-muted opacity-60 ml-3"
                                                type="button" id={`dropdownMenuButton-${index}`}
                                                data-toggle="dropdown" aria-haspopup="true"
                                                aria-expanded={dropdownVisible === index}
                                                onClick={() => toggleDropdown(index)}>
                                            <i className="fa fa-ellipsis-h"></i>
                                        </button>
                                        <div
                                            className={`dropdown-menu ${dropdownVisible === index ? 'show' : ''}`}
                                            aria-labelledby={`dropdownMenuButton-${index}`}>
                                            {/* Nút sửa tin nhắn */}
                                            <button className="dropdown-item d-flex align-items-center"
                                                    onClick={() => handleEditMessage(index)}>
                                                <i style={{marginRight: '6px'}} className="fa fa-edit"></i> Sửa
                                            </button>

                                            {/* Nút Xóa tin nhắn */}
                                            <button className="dropdown-item d-flex align-items-center"
                                                    onClick={() => handleDeleteMessage(index)}>
                                                <i style={{marginRight: '6px'}} className="fa fa-trash"></i> Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Trường nhập tin nhắn */}
                    <div className="chat-footer border-top py-3 px-4">
                        <form className="d-flex align-items-center" onSubmit={(e) => {
                            e.preventDefault();
                            sendMessageHandler();
                        }}>
                            <input type="text" className="form-control mr-3" placeholder="Nhập tin nhắn..."
                                   value={input} onChange={(e) => setInput(e.target.value)}/>
                            <button className="btn btn-primary" type="submit">Gửi</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
