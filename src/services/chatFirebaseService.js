// firebaseService.js
import { db } from "../lib/firebase";
import { arrayUnion, arrayRemove, doc, getDoc, updateDoc, setDoc, collection, onSnapshot, serverTimestamp } from "firebase/firestore";

export const markMessagesAsSeen = async (chatId, currentUser) => {
    try {
        const chatRef = doc(db, "chats", chatId);
        const chatDoc = await getDoc(chatRef);

        if (chatDoc.exists()) {
            const messages = chatDoc.data().messages.map((message) => 
                message.senderId !== currentUser.id && !message.isSeen
                    ? { ...message, isSeen: true }
                    : message
            );
            // Atualize todas as mensagens não lidas em uma única operação
            await updateDoc(chatRef, { messages });
        }
    } catch (error) {
        console.log("Erro ao marcar mensagens como lidas:", error);
    }
};

export const formatDateTime = (timestamp) => {
    // Extrai segundos e nanosegundos do objeto _Timestamp
    const seconds = timestamp.seconds;
    const nanoseconds = timestamp.nanoseconds;

    // Converte segundos e nanosegundos para milissegundos
    const milliseconds = (seconds * 1000) + (nanoseconds / 1e6);

    // Cria um objeto Date a partir dos milissegundos
    const date = new Date(milliseconds);

    // Verifica se a data é inválida
    if (isNaN(date.getTime())) {
        return 'Data inválida';
    }

    // Formata a data no formato desejado
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatLastActivity = (lastActivityTimestamp) => {
    const lastActivityDate = new Date(lastActivityTimestamp.seconds * 1000);
    const currentDate = new Date();

    const isSameDay = lastActivityDate.toDateString() === currentDate.toDateString();

    if (isSameDay) {
        return lastActivityDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
        return lastActivityDate.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
};
