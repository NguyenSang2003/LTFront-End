import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectWebSocket, sendMessage } from '../utils/websocket';

interface LoginProps {
    socket: WebSocket | null;
}

const Login: React.FC<LoginProps> = ({ socket }) => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (socket) {
            const handleMessage = (msg: MessageEvent) => {
                const data = JSON.parse(msg.data);
                if (data.event === 'LOGIN' && data.status === 'success') {
                    console.log('Received message: ', data);
                    localStorage.setItem('user', user);  // Lưu thông tin người dùng
                    localStorage.setItem('pass', pass);  // Lưu mật khẩu người dùng
                    navigate('/chat');
                } else if (data.event === 'LOGIN' && data.status === 'error') {
                    alert(data.mes);
                }
            };

            socket.addEventListener('message', handleMessage);

            return () => {
                socket.removeEventListener('message', handleMessage);
            };
        }
    }, [user, pass, navigate, socket]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (user && pass && socket) {
            const loginMessage = {
                action: 'onchat',
                data: {
                    event: 'LOGIN',
                    data: { user, pass }
                }
            };
            sendMessage(socket, loginMessage);
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Username" value={user} onChange={(e) => setUser(e.target.value)} />
                <input type="password" placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;