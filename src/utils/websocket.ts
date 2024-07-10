export const connectWebSocket = (onMessage: (msg: MessageEvent) => void): WebSocket => {
    const socket = new WebSocket('ws://140.238.54.136:8080/chat/chat');

    socket.onopen = () => {
        console.log('WebSocket connected');
    };

    socket.onmessage = onMessage;

    socket.onclose = () => {
        console.log('WebSocket disconnected');
    };

    socket.onerror = (error) => {
        console.error('WebSocket error: ', error);
    };

    return socket;
};

// Hàm gửi tin nhắn đi
export const sendMessage = (socket: WebSocket, message: object) => {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not open. Ready state: ', socket.readyState);
    }
};