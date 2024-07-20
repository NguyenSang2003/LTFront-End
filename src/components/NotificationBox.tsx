import React from 'react';
import '../style/notificationBoxStyle.css'

interface NotificationBoxProps {
    rooms: Room[];
    recipient: string;
    onClose: () => void;
}

interface Room {
    id: string;
    name: string;
    createdAt: string;
    members: string[];
    own: string;
}

const NotificationBox: React.FC<NotificationBoxProps> = ({rooms, recipient, onClose}) => {
    const roomData = rooms.find(room => room.name === recipient);
    const membersData = roomData ? roomData.members.join(', ') : '';
    const ownData = roomData ? roomData.own : '';
    const createdAtData = roomData ? roomData.createdAt : '';
    const roomId = roomData ? roomData.id : '';

    return (
        <div className="notification-overlay" onClick={onClose}>
            <div className="notification-popup" onClick={(e) => e.stopPropagation()}>
                <span className="close-btn" onClick={onClose}>×</span>
                <h2>Thông tin chi tiết phòng</h2>
                <p><strong>ID phòng:</strong> {roomId}</p>
                <p><strong>Tên Phòng:</strong> {roomData?.name}</p>
                <p><strong>Chủ Phòng:</strong> {ownData}</p>
                <p><strong>Ngày Thành Lập:</strong> {createdAtData}</p>
                <p><strong>Thành Viên:</strong> {membersData}</p>
            </div>
        </div>
    );
};

export default NotificationBox;