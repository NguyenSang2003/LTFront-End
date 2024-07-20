// utils/decoder.ts

export const decodeMessage = (encodedMessage: string): string => {
    try {
        const decoder = new TextDecoder('utf-8');
        const encodedArray = Uint8Array.from(encodedMessage, c => c.charCodeAt(0));
        return decoder.decode(encodedArray);
    } catch (error) {
        console.error("Error decoding message: ", error);
        return encodedMessage; // Fallback to original message if decoding fails
    }
};
