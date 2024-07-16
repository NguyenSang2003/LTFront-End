import React, { useState, useEffect } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { sendMessage } from '../utils/websocket';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/css/template.min.css';

interface RegisterProps {
    socket: WebSocket | null;
}

const Register: React.FC<RegisterProps> = ({ socket }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert('Mật khẩu không giống nhau, vui lòng kiếm tra lại');
            return;
        }

        if (username && password && socket) {
            const registerMessage = {
                action: 'onchat',
                data: {
                    event: 'REGISTER',
                    data: { user: username, pass: password }
                }
            };
            sendMessage(socket, registerMessage);
        }
    };

    useEffect(() => {
        if (socket) {
            const handleMessage = (msg: MessageEvent) => {
                const data = JSON.parse(msg.data);
                if (data.event === 'REGISTER' && data.status === 'success') {
                    alert('Đăng ký thành công');
                    navigate('/'); // Chuyển hướng sang login sau khi đăng ký thành công
                } else if (data.event === 'REGISTER' && data.status === 'error') {
                    alert(data.mes);
                }
            };

            socket.addEventListener('message', handleMessage);
            return () => {
                socket.removeEventListener('message', handleMessage);
            };
        }
    }, [socket, navigate]);

    return (
        <div className="layout">
            <div className="container d-flex flex-column">
                <div className="row align-items-center justify-content-center no-gutters min-vh-100">
                    <div className="col-12 col-md-5 col-lg-4 py-8 py-md-11">
                        <h1 className="font-bold text-center">Đăng ký</h1>
                        <form className="mb-6" onSubmit={handleRegister}>
                            <div className="form-group">
                                <label htmlFor="username" className="sr-only">Tên đăng nhập</label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg"
                                    id="username"
                                    placeholder="Tên đăng nhập"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password" className="sr-only">Mật khẩu</label>
                                <input
                                    type="password"
                                    className="form-control form-control-lg"
                                    id="password"
                                    placeholder="Mật khẩu"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirm-password" className="sr-only">Xác nhận mật khẩu</label>
                                <input
                                    type="password"
                                    className="form-control form-control-lg"
                                    id="confirm-password"
                                    placeholder="Xác nhận mật khẩu"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="btn btn-lg btn-block btn-primary" type="submit">Đăng ký</button>
                        </form>
                        <p className="text-center">
                            Đã có tài khoản? <Link to="/">Đăng nhập</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
