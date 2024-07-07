// Định dạng lại thời gian gửi tin nhắn
export const formatMessageTime = (timestamp: string | Date): string => {
    try {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            const formattedDate = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')} - ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
            return formattedDate;
        } else {
            return 'Invalid Date';
        }
    } catch (error) {
        console.error('Error formatting time:', error);
        return 'Invalid Date';
    }
};