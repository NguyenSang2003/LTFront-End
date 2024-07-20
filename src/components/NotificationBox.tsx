import React from 'react';
import '../style/notificationBoxStyle.css'

interface NotificationBoxProps {
    own: string;
    rooms: Room[];
    recipient: string;
    onClose: () => void;
}

interface Room {
    name: string;
    createdAt: string;
    members: string[];
    own: string;
}

const NotificationBox: React.FC<NotificationBoxProps> = ({rooms, recipient, onClose}) => {
    const roomData = rooms.find(room => room.name === recipient);
    const membersData = roomData ? roomData.members.join(', ') : '';
    const ownData = roomData ? roomData.own : '';

    return (
        <div className="notification-overlay" onClick={onClose}>
            <div className="notification-popup" onClick={(e) => e.stopPropagation()}>
                <span className="close-btn" onClick={onClose}>×</span>
                <h2>Thông tin chi tiết phòng</h2>
                <p><strong>ID:</strong> {roomData?.createdAt}</p>
                <p><strong>Tên phòng:</strong> {roomData?.name}</p>
                <p><strong>Chủ phòng:</strong> {ownData}</p>
                <p><strong>Thành viên hiện tại:</strong> {membersData}</p>
            </div>
        </div>
    );
};

export default NotificationBox;