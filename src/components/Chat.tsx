import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {sendMessage} from '../utils/websocket';
import '../assets/css/template.min.css';
import {setCurrentUser, getCurrentUser} from '../utils/userStorage';
import {formatMessageTime} from '../utils/timeFormatter';
// import {decodeMessage} from "../utils/decoder";
import '../style.css';
import EmojiPicker, {EmojiClickData} from 'emoji-picker-react';
import {Simulate} from "react-dom/test-utils";
import input = Simulate.input; // Lấy thư viện icon emoji
import NotificationBox from "./NotificationBox";

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
    sender: any;
}

interface Room {
    name: string;
    createdAt: string;
    members: string[];
    own: string;
}

const Chat: React.FC<ChatProps> = ({socket}) => {
    const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});

    const [input, setInput] = useState("");

    const [recipient, setRecipient] = useState("");

    const [recipients, setRecipients] = useState<User[]>([]);

    const [isChatVisible, setIsChatVisible] = useState(false);

    const [newUser, setNewUser] = useState("");

    const [editIndex, setEditIndex] = useState<number | null>(null);

    const [dropdownVisible, setDropdownVisible] = useState<number | null>(null);

    const navigate = useNavigate();

    const user = getCurrentUser();

    const [isEditing, setIsEditing] = useState(false); // Biến sửa tin nhắn

    //Biến thêm icon
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
// Thêm state cho tìm kiếm
    const [searchQuery, setSearchQuery] = useState("");

    const [rooms, setRooms] = useState<Room[]>([]);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    const [notification, setNotification] = useState("");
    const [notificationVisible, setNotificationVisible] = useState(false);
    const [own, setOwn] = useState("");
    const [listMember, setListMember] = useState([]);

    // Function to handle button click and show notification
    const handleShowDetails = () => {
        // Retrieve data (assuming 'own', 'data', 'userlist' are available in state or scope)
        const ownData = own; // Assuming 'own' is a state or variable holding 'own' data
        const roomData = rooms.find(room => room.name === recipient);
        const membersData = roomData ? roomData.members : [];


        // Update state to display notification
        setNotificationVisible(true);
    };

    // Function to close notification
    const handleCloseNotification = () => {
        setNotificationVisible(false);
    };

    useEffect(() => {
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
                        // decode utf - 8
                        // content: decodeMessage(data.data.mes),
                        sender: data.data.name,  // Thêm thông tin người gửi
                        timestamp: new Date()
                    });
                    newMessages[recipient].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                    setMessages(newMessages);
                    localStorage.setItem('messages', JSON.stringify(newMessages));
                } else if (data.event === "AUTH" && data.status === "error" && data.mes === "User not Login") {
                    alert("Phiên đăng nhập đã hết. Hãy đăng nhập lại.");
                    navigate('/');
                } else if (data.event === "USER_LIST" || data.event === "USER_LIST_UPDATE" || data.event === "GET_USER_LIST") {
                    setRecipients(data.data.users || data.data);
                }
                // Khi tao phòng và join phòng
                else if (data.event === "CREATE_ROOM" || data.event === "JOIN_ROOM") {
                    const newRoom = {
                        name: data.data.name, //tên của căn phòng
                        createdAt: new Date().toISOString(),
                        members: data.data.userList.map((user: User) => user.name), // lấy ra ca thành viên
                        own: data.data.own, //Lấy tên chủ căn phòng
                    };
                    setRooms((prevRooms) => [...prevRooms, newRoom]);
                    localStorage.setItem('rooms', JSON.stringify([...rooms, newRoom]));

                    if (Array.isArray(data.data.chatData)) {
                        const newMessages = {...messages};
                        const chatData = data.data.chatData;
                        const roomName = data.data.name;
                        newMessages[roomName] = chatData.map((chat: any) => ({
                            content: chat.mes,
                            // decode utf - 8
                            // content: decodeMessage(chat.mes),
                            sender: chat.name,  // Thêm thông tin người gửi
                            timestamp: new Date(chat.createAt)
                        }));
                        newMessages[roomName].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                        setMessages(newMessages);
                        localStorage.setItem('messages', JSON.stringify(newMessages));
                    } else {
                        console.error("chatData is not an array", data.data.chatData);
                    }
                }
                // Lấy ra tin nhắn trong phòng chat
                else if (data.event === "GET_ROOM_CHAT_MES" && data.status === "success") {
                    console.log("Handling room chat messages");
                    const newMessages = {...messages};
                    const chatData = data.data.chatData || [];
                    const newRecipient = data.data[0]?.to || data.data[0]?.name;

                    if (Array.isArray(chatData)) {
                        newMessages[newRecipient] = chatData.map((chat: any) => ({
                            content: chat.mes,
                            // decode utf - 8
                            // content: decodeMessage(chat.mes),
                            sender: chat.name,
                            timestamp: new Date(chat.createAt)
                        }));
                        newMessages[newRecipient].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                        setMessages(newMessages);
                        localStorage.setItem('messages', JSON.stringify(newMessages));
                    } else {
                        console.error("chatData is not an array", chatData);
                    }

                }
                // Lấy ra tin nhắn của ngươi gửi với người
                else if (data.event === "GET_PEOPLE_CHAT_MES" && data.status === "success") {
                    console.log("Handling people chat messages");
                    const newMessages = {...messages};
                    const chatData = data.data;
                    const newRecipient = data.data[0]?.to || data.data[0]?.name;
                    if (Array.isArray(chatData)) {
                        newMessages[newRecipient] = chatData.map((chat: any) => ({
                            content: chat.mes,
                            // decode utf - 8
                            // content: decodeMessage(chat.mes),
                            sender: chat.name,
                            timestamp: new Date(chat.createAt)
                        }));
                        newMessages[newRecipient].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                        console.log("Updated people messages: ", newMessages);
                        setMessages(newMessages);
                        localStorage.setItem('messages', JSON.stringify(newMessages));
                    } else {
                        console.error("chatData is not an array", chatData);
                    }
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


    // Giúp cuộn tới tin nhắn mới nhất
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, recipient]);


    // Lưu tin nhắn trong localStorage
    useEffect(() => {
        const storedMessages = localStorage.getItem('messages');
        if (storedMessages) {
            setMessages(JSON.parse(storedMessages));
        }
        const storedRooms = localStorage.getItem('rooms');
        if (storedRooms) {
            setRooms(JSON.parse(storedRooms));
        }
    }, []);

    // Xử lý việc gửi tin nhắn
    const sendMessageHandler = () => {
        if (input && recipient && socket) {

            // Nếu là đang chỉnh sửa tin nhắn
            if (editIndex !== null) {
                const newMessages = {...messages};
                newMessages[recipient][editIndex].content = `Bạn: ${input}`;
                setMessages(newMessages);
                localStorage.setItem('messages', JSON.stringify(newMessages));
                setEditIndex(null);
                setInput("");
                setIsEditing(false); // Ẩn nút X đỏ đi
                return;
            }

            const isRoom = rooms.some(room => room.name === recipient);

            // Gửi cho Phòng hoặc người dùng tùy vào người nhận được chọn là Room hay People
            const chatMessage = {
                action: "onchat",
                data: {
                    event: "SEND_CHAT",
                    data: {
                        type: isRoom ? "room" : "people",
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
                sender: getCurrentUser(),
                content: `${input}`,
                timestamp: new Date()
            });
            setMessages(newMessages);
            localStorage.setItem('messages', JSON.stringify(newMessages));
        }
    };

    // Hàm xử lý khi ấn vào người dùng hoặc phòng
    const handleRecipientClick = (rec: string) => {
        setRecipient(rec);
        setIsChatVisible(true); // Hiển thị phần chat khi thu nhỏ màn hình

        if (socket) {
            if (rooms.some(room => room.name === rec)) {
                sendMessage(socket, {
                    action: "onchat",
                    data: {
                        event: "JOIN_ROOM",
                        data: {
                            name: rec
                        }
                    }
                });
                sendMessage(socket, {
                    action: "onchat",
                    data: {
                        event: "GET_ROOM_CHAT_MES",
                        data: {
                            name: rec,
                            page: 1
                        }
                    }
                });
                // Gọi hàm joinRoom để tham gia phòng
                joinRoom2(rec);
            } else {
                sendMessage(socket, {
                    action: "onchat",
                    data: {
                        event: "GET_PEOPLE_CHAT_MES",
                        data: {
                            name: rec,
                            page: 1
                        }
                    }
                });
            }
        }
    };

    //Hàm reset danh sách bạn bè
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
        localStorage.removeItem('user');
        localStorage.removeItem('reloginCode');

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

    // Hàm xóa cuộc hội thoại
    const deleteMessages = () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa cuộc hội thoại này chứ? " +
            "Điều này là không thể khôi phục được!!!")) {
            const newMessages = {...messages};
            newMessages[recipient] = [];
            setMessages(newMessages);
            localStorage.setItem('messages', JSON.stringify(newMessages));
        }
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

    // Hàm xử lý chỉnh sửa tin nhắn
    const handleEditMessage = (index: number) => {
        const message = messages[recipient][index];
        if (message.content.startsWith('Bạn: ')) {
            setInput(message.content.replace('Bạn: ', ''));
            setEditIndex(index);
            setIsEditing(true);
        } else {
            alert("Bạn chỉ có thể sửa tin nhắn của chính bạn.");
        }
    };

    // Hàm thoát khỏi chỉnh sửa tin nhắn
    const cancelEditMessage = () => {
        if (window.confirm("Bạn có chắc chắn muốn thoát, không muốn sửa tin nhắn nữa?")) {
            setInput("");
            setEditIndex(null);
            setIsEditing(false);
        }
    };

    // Hàm xử lý hiển thị menu xổ xuống đối với tin nhắn
    const toggleDropdown = (index: number) => {
        setDropdownVisible(dropdownVisible === index ? null : index);
    };

    // Hàm xử lý kết bạn
    const handleAddFriend = () => {
        if (newUser && socket) {
            const chatMessage = {
                action: "onchat",
                data: {
                    event: "SEND_CHAT",
                    data: {
                        type: "people",
                        to: newUser,
                        mes: `Xin chào hãy làm quen đi tôi là "${getCurrentUser()}" bạn có thể gõ tên tôi trong thanh kết bạn, như thế chúng ta sẽ nhắn tin được với nhau`,
                    }
                }
            };
            console.log("Sending friend request message: ", chatMessage);
            sendMessage(socket, chatMessage);
            setNewUser("");
            setNotification("Gửi thành công");

            // Tự ẩn thông báo sau 3 giây
            setTimeout(() => {
                setNotification("");
            }, 3000);
        } else {
            setNotification("Gửi thất bại");
            setTimeout(() => {
                setNotification("");
            }, 3000);
        }
    };

    //THàm xử lý thêm icon emoji
    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setInput(prevInput => prevInput + emojiData.emoji);
    };

    // Hàm xử lý tìm kiếm trong danh sách bạn bè
    const handleSearch = () => {
        const filteredRecipients = recipients.filter(rec => rec.name.toLowerCase().includes(searchQuery.toLowerCase()));
        setRecipients(filteredRecipients);
    };

    // Nút thoát khi tìm kiếm bạn bè
    const handleExitSearch = () => {
        setSearchQuery("");
        refreshUserList();
    };

    // Hàm tạo ra phòng
    const createRoom = () => {
        const roomName = prompt("Nhập tên phòng mới để tạo:");
        if (roomName && socket) {
            const message = {
                action: "onchat",
                data: {
                    event: "CREATE_ROOM",
                    data: {
                        name: roomName
                    }
                }
            };
            sendMessage(socket, message);
        }
    };

    // Hàm tham gia vào phòng
    const joinRoom = () => {
        const roomName = prompt("Nhập tên phòng cần tham gia:");
        if (roomName && socket) {
            const message = {
                action: "onchat",
                data: {
                    event: "JOIN_ROOM",
                    data: {
                        name: roomName
                    }
                }
            };
            sendMessage(socket, message);
        }
    };

    // Hàm tham gia vào phòng cho khi nhấn vào đoạn chat là phòng
    const joinRoom2 = (roomName: string) => {
        if (roomName && socket) {
            const message = {
                action: "onchat",
                data: {
                    event: "JOIN_ROOM",
                    data: {
                        name: roomName
                    }
                }
            };
            sendMessage(socket, message);
        }
    };


    return (
        <div className="d-flex flex-column flex-md-row vh-100">

            {/* Phần danh sách người dùng */}
            <div className={`sidebar bg-light border-right ${isChatVisible ? 'sidebar-hidden' : ''}`}>
                <div className="p-4">
                    <h5>App Chat RealTime NLU</h5>
                </div>

                {/* Tên người dùng và đăng xuất */}
                <div className="d-flex justify-content-between align-items-center p-4">
                    <h6 style={{
                        fontSize: '21px', fontFamily: 'sans-serif', fontWeight: 'bold'
                    }}>{user || 'Loading...'}</h6>

                    {/* Nút tham gia phòng */}
                    <button style={{padding: '6.5px 13px', marginLeft: '120px'}} className="btn btn-success"
                            onClick={joinRoom} title={"Vào phòng"}>
                        <i style={{margin: '3px 0px 0px 2px'}} className="material-icons">input</i></button>

                    {/* Nút tạo nhóm chat */}
                    <button
                        style={{padding: '6.5px 13px'}} className="btn btn-success"
                        onClick={createRoom} title={"Tạo nhóm"}>
                        <i style={{margin: '3px 0px 0px 2px'}} className="material-icons">group_add</i>
                    </button>


                    {/* Nút đăng xuất */}
                    <button
                        style={{
                            fontFamily: 'sans-serif', fontWeight: 'bold'
                        }}
                        className="btn btn-danger" onClick={handleLogout} title={"Đăng xuất"}>
                        <i className="fa-solid fa-right-from-bracket"></i>
                    </button>
                </div>

                {/* Chức năng tìm kiếm bạn bè và nhóm */}
                <div className="p-4">
                    <div className="input-group mb-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Tìm kiếm bạn bè"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        {/* Nút tìm */}
                        <button className="btn btn-success" onClick={handleSearch} title={"Tìm kiếm"}>
                            <i className="fa-solid fa-magnifying-glass"></i></button>
                        {/* Nút thoát */}
                        <button className="btn btn-danger mr-3" onClick={handleExitSearch}
                                title={"Thoát"}><i className="fa-solid fa-x"></i>
                        </button>
                    </div>
                </div>

                {/* Giao diện kết bạn */}
                <div className="p-4">
                    <div className="input-group mb-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Nhập tên người bạn cần kết bạn ..."
                            value={newUser}
                            onChange={(e) => setNewUser(e.target.value)}
                        />
                        <button style={{padding: '5px 10px'}} className="btn btn-success"
                                onClick={handleAddFriend} title={"Kết bạn"}>
                            <i style={{margin: '3px 3px 0px 0px'}} className="material-icons">person_add</i>
                        </button>
                    </div>
                    {/* Thông báo */}
                    {notification && (
                        <div
                            className={`alert ${notification === "Gửi thành công" ? "alert-success" : "alert-danger"} mt-2`}>
                            {notification}
                        </div>
                    )}
                </div>

                {/* Danh sách bạn bè và phòng */}
                <div className="d-flex justify-content-between align-items-center p-4">
                    <h6>Danh sách bạn bè & phòng</h6>

                    {/* Nút tải lại danh sách bạn bè */}
                    <button style={{fontFamily: 'sans-serif', fontWeight: 'bold'}} className="btn btn-success"
                            onClick={refreshUserList} title={"Tải lại"}><i className="fa-solid fa-rotate-right"></i>
                    </button>
                </div>

                {/* Hiển thị lên danh sách bạn bè */}
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
                        <div className="list-group-item">Bạn chưa có người bạn nào. Hãy kết bạn thêm và họ sẽ ở
                            đây.</div>
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
                                    className="mb-0 ml-2">{recipient ? `Đang chat với ${recipient}` : 'Chọn người nhận để bắt đầu trò chuyện'}</h6>
                            </div>
                        </div>

                        {/*/!* Nút Xóa đoạn chat *!/*/}
                        {/*<button className="btn btn-link text-danger" onClick={deleteMessages}>*/}
                        {/*    <i className="fa-solid fa-trash"></i>*/}
                        {/*</button>*/}

                        <div className="dropdown">
                            <button
                                style={{marginLeft: '10px'}}
                                className="btn btn-secondary btn-sm dropdown-toggle"
                                type="button"
                                onClick={() => toggleDropdown(1)}>
                                Tuỳ chọn
                            </button>

                            <div className={`dropdown-menu ${dropdownVisible === 1 ? 'show' : ''}`}>
                                {/* Nút xóa toàn bộ tin nhắn */}
                                <button className="dropdown-item text-danger" onClick={deleteMessages} title={"Xóa toàn bộ"}>
                                    <i className="fa-solid fa-trash"></i>
                                </button>

                                {/* Nút chi tiết phòng */}
                                <button className="dropdown-item" onClick={handleShowDetails} title={"Chi tiết phòng"}>
                                    <i className="fa-solid fa-gear"></i>
                                </button>

                                {/* Notification box */}
                                {notificationVisible && (
                                    <NotificationBox
                                        own={own}
                                        rooms={rooms}
                                        recipient={recipient}
                                        onClose={handleCloseNotification}
                                    />
                                )}
                            </div>
                        </div>


                    </div>

                    {/* Phần hiển thị tin nhắn */}
                    <div className="message-box chat-content flex-grow-1 p-4 overflow-auto" ref={chatContainerRef}>
                        {Array.isArray(messages[recipient]) && messages[recipient].map((message, index) => (
                            <div key={index}
                                 className={`message ${message.sender === getCurrentUser() ? 'sent' : 'received'}`}>
                                <div className="message-content">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>{formatMessageTime(message.timestamp)}</span>

                                        {/* Nút chi tiết tin nhắn */}
                                        <div className="dropdown">
                                            <button style={{marginLeft: '10px'}}
                                                    className="btn btn-secondary btn-sm dropdown-toggle"
                                                    type="button"
                                                    onClick={() => toggleDropdown(index)}>
                                                Tuỳ chọn
                                            </button>
                                            {dropdownVisible === index && (
                                                <div className="dropdown-menu show">
                                                    {message.sender === getCurrentUser() ? (
                                                        <>
                                                            <button className="dropdown-item"
                                                                    onClick={() => handleEditMessage(index)}>
                                                                <i style={{marginRight: '6px'}}
                                                                   className="fa fa-edit"></i>Sửa
                                                            </button>
                                                            <button className="dropdown-item"
                                                                    onClick={() => handleDeleteMessage(index)}>
                                                                <i style={{marginRight: '6px'}}
                                                                   className="fa fa-trash"></i> Xóa
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button className="dropdown-item"
                                                                onClick={() => handleDeleteMessage(index)}>
                                                            <i style={{marginRight: '6px'}}
                                                               className="fa fa-trash"></i> Xóa
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Hiển thị tin nhắn */}
                                    <p className="mb-0">
                                        {/* So sánh với user hiện tại để xem có phải người gửi đi không */}
                                        <strong>{message.sender === getCurrentUser() ? 'Bạn' : message.sender}: </strong>
                                        {message.content}
                                    </p>

                                </div>
                            </div>
                        ))
                        }
                    </div>


                    {/* Trường nhập tin nhắn */}
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
                            {isEditing && (
                                <button type="button" className="btn btn-danger mr-3"
                                        onClick={cancelEditMessage}>X</button>
                            )}
                            <button type="button" className="btn btn-outline-secondary mr-2"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                                😊
                            </button>
                            {showEmojiPicker && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '60px',
                                    left: '10px',
                                    zIndex: 1000
                                }}>
                                    <EmojiPicker onEmojiClick={handleEmojiClick}/>
                                </div>
                            )}
                            <button className="btn btn-primary" type="submit">Gửi</button>
                        </form>
                    </div>

                </div>
            </div>
        </div>

    )
        ;
};

export default Chat;