import { useEffect, useRef, useState } from "react"
import "./chat.css"
import EmojiPicker from "emoji-picker-react"
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import Detail from "../detail/Detail";

const Chat = ({ isDetailVisible, onToggleDetail }) => {
    const [chat, setChat] = useState();
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [img, setImg] = useState({
        file: null,
        url: ""
    });

    const { currentUser } = useUserStore();
    const { chatId, user } = useChatStore();

    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "chats", chatId), (res) => {
            setChat(res.data())
        });
        return () => {
            unsub();
        };
    }, [chatId]);

    const handleEmoji = e => {
        setText(prev => prev + e.emoji);
        setOpen(false)
    }

    const handleImage = e => {
        if (e.target.files[0]) {
            setImg({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            })
        }
    }

    const handleSend = async () => {
        if (text == "") return;
    
        let imgUrl = null;
    
        try {
            if (img.file) {
                imgUrl = await upload(img.file);
            }
    
            const chatRef = doc(db, "chats", chatId);
            const chatData = {
                senderId: currentUser.id,
                text,
                createdAt: new Date(),
                ...(imgUrl && { img: imgUrl }),
            };
    
            await updateDoc(chatRef, {
                messages: arrayUnion(chatData),
            });

    
            if (chat.isGroup) {
                // TO DO
                // esta parte do codigo atualiza a ultima mensagem na lista fdo grupo 
                // LIMPAR CHACHE QUANDO CRIA CONVERSA COM USUARIO
                //
                // Atualiza a coleção groupchats para mensagens de grupo
                const groupChatRef = doc(db, "groupchats", chat.groupId);
                const groupChatSnapshot = await getDoc(groupChatRef);                

                if (groupChatSnapshot.exists) {
                    const groupChatData = groupChatSnapshot.data();
                    const chatIndex = groupChatData.chats.findIndex(c => c.chatId === chatId);   
    
                    groupChatData.chats[chatIndex].lastMessage = text;
                    groupChatData.chats[chatIndex].isSeen = user === currentUser.id ? true : false;
                    groupChatData.chats[chatIndex].updatedAt = Date.now();
    
                    await updateDoc(groupChatRef, {
                        chats: groupChatData.chats,
                    });
                }
            } else {
                // Atualiza a coleção userchats para mensagens individuais
                const userIDs = [currentUser.id, user.id];
                userIDs.forEach(async (id) => {
                    const userChatsRef = doc(db, "userchats", id);
                    const userChatsSnapshot = await getDoc(userChatsRef);
                    if (userChatsSnapshot.exists) {
                        const userChatsData = userChatsSnapshot.data();
                        const chatIndex = userChatsData.chats.findIndex(c => c.chatId === chatId);
    
                        userChatsData.chats[chatIndex].lastMessage = text;
                        userChatsData.chats[chatIndex].isSeen =
                            id === currentUser.id ? true : false;
                        userChatsData.chats[chatIndex].updatedAt = Date.now();
    
                        await updateDoc(userChatsRef, {
                            chats: userChatsData.chats,
                        });
                    }
                });
            }
        } catch (error) {
            console.log(error);
        }
    
        setImg({
            file: null,
            url: "",
        });
    
        setText("");
    }

    const handleDetail = () => {
        onToggleDetail();
    }

    const handleEnterKey = (event) => {
        if (event.keyCode == 13) {
            handleSend();
        }
    }

    return (
        <div className="chat">
            <div className="top">
                <div className="user" onClick={handleDetail}>
                    <img src={user.avatar ? user.avatar : "./avatar.png"} alt="" />
                    <div className="texts">
                        <span>{user.username}</span>
                    </div>
                </div>
                <div className="icons">
                    <img src="./phone.png" alt="" />
                    <img src="./video.png" alt="" />
                </div>
            </div>
            <div className="center">
                {chat?.messages?.map((message) => (
                    <div className={message.senderId === currentUser?.id ? "message own" : "message" } key={message?.createdAt}>
                        <div className="texts">
                            {message.img && <img src={message.img} alt="" />}
                            <p>
                                {message.text}
                            </p>
                            
                        </div>
                    </div>
                ))}

                {img.url && (
                <div className="message own">
                    <div className="texts">
                        <img src={img.url} alt="" />
                    </div>
                </div>
                )}

                <div ref={endRef}></div>
            </div>
            <div className="bottom">
                <div className="icons">
                    <label htmlFor="file">
                        <img src="./img.png" alt="" />
                    </label>

                    <input type="file" id="file" style={{display: "none"}} onChange={handleImage}/>
                    <img src="./camera.png" alt="" />
                    <img src="./mic.png" alt="" />
                </div>
                <input type="text" placeholder="Digite uma mensagem" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleEnterKey} />
                <div className="emoji">
                    <img src="./emoji.png" alt="" onClick={() => setOpen(prev => !prev)} />
                    <div className="picker">
                        <EmojiPicker open={open} onEmojiClick={handleEmoji} />
                    </div>
                </div>
                <button className="sendBtn" onClick={handleSend} >Enviar</button>
            </div>
        </div>
    )

    {isVisible && <Detail/>}
    
}

export default Chat