import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Link} from 'react-router-dom';
import {sendMessage} from '../utils/websocket';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/css/template.min.css';

interface LoginProps {
    socket: WebSocket | null;
}

const Login: React.FC<LoginProps> = ({socket}) => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Kiểm tra xem có thông tin đăng nhập trong localStorage không
        const savedUser = localStorage.getItem('user');
        const savedCode = localStorage.getItem('reloginCode');
        // Thực hiện Relogin nếu còn tồn tại của mã ReloginCode trong localStorage
        if (savedUser && savedCode && socket) {
            const reloginMessage = {
                action: 'onchat',
                data: {
                    event: 'RE_LOGIN',
                    data: {user: savedUser, code: savedCode}
                }
            };
            sendMessage(socket, reloginMessage);
        }
    }, [socket]);

    // Hàm thực hiện việc đăng nhập
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (user && pass && socket) {
            const loginMessage = {
                action: 'onchat',
                data: {
                    event: 'LOGIN',
                    data: {user, pass}
                }
            };
            sendMessage(socket, loginMessage);
        }
    };

    useEffect(() => {
        if (socket) {
            const handleMessage = (msg: MessageEvent) => {
                const data = JSON.parse(msg.data);
                if (data.event === 'LOGIN' && data.status === 'success') {
                    console.log('Received message: ', data);
                    localStorage.setItem('user', user);  // Lưu thông tin người dùng
                    localStorage.setItem('reloginCode', data.data.RE_LOGIN_CODE);  // Lưu mã relogin
                    navigate('/chat');//đăng nhập thành công thì chuyển tới trang Chat
                } else if (data.event === 'LOGIN' && data.status === 'error') {
                    alert(data.mes);
                } else if (data.event === 'RE_LOGIN' && data.status === 'success') {
                    console.log('Relogin successful: ', data);
                    navigate('/chat');
                }
            };

            socket.addEventListener('message', handleMessage);
            return () => {
                socket.removeEventListener('message', handleMessage);
            };
        }
    }, [socket, user, navigate]);

    return (
        <div className="layout">
            <div className="container d-flex flex-column">
                <div className="row align-items-center justify-content-center no-gutters min-vh-100">
                    <div className="col-12 col-md-5 col-lg-4 py-8 py-md-11">
                        <h1 className="font-bold text-center">Đăng nhập</h1>
                        <p className="text-center mb-6">Chào mừng đến App Chat RealTime NLU.</p>
                        <form className="mb-6" onSubmit={handleLogin}>
                            <div className="form-group">
                                <label htmlFor="username" className="sr-only">Tên đăng nhập</label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg"
                                    id="username"
                                    placeholder="Tên đăng nhập"
                                    value={user}
                                    onChange={(e) => setUser(e.target.value)}
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
                                    value={pass}
                                    onChange={(e) => setPass(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="btn btn-lg btn-block btn-primary" type="submit">Đăng nhập</button>
                        </form>
                        <p className="text-center">
                            Chưa có tài khoản? <Link to="/signup">Đăng ký tại đây</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;