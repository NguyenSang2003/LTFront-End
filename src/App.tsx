import React, {useState, useEffect} from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Login from './components/Login';
import Chat from './components/Chat';
import Register from './components/Register';
import {connectWebSocket} from './utils/websocket';

const App: React.FC = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const newSocket = connectWebSocket(() => {
        });
        setSocket(newSocket);
        return () => newSocket.close();
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login socket={socket}/>}/>
                <Route path="/chat" element={<Chat socket={socket}/>}/>
                <Route path="/register" element={<Register socket={socket}/>}/>
            </Routes>
        </Router>
    );
};

export default App;