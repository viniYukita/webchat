import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc, collection } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import Detail from "../detail/Detail";

const Chat = ({ isDetailVisible, onToggleDetail }) => {
    const [chat, setChat] = useState();
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [file, setFile] = useState({
        file: null,
        url: ""
    });

    const [avatar, setAvatar] = useState(null);
    const [groupname, setGroupName] = useState(null);
    const [groups, setGroups] = useState([]);

    const { currentUser } = useUserStore();
    const { chatId, user } = useChatStore();

    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "chats", chatId), (res) => {
            setChat(res.data())
        });

        const unSubGroups = onSnapshot(
            collection(db, "groups"),
            async (snapshot) => {
                const groupsData = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(group => group.id === chatId);

                if (groupsData.length > 0) {
                    const avatar = groupsData[0].avatar;
                    const groupname = groupsData[0].groupname;
                    setAvatar(avatar);
                    setGroupName(groupname);
                } else {
                    setAvatar(null);
                    setGroupName(null);
                }
            }
        );

        return () => {
            unsub();
            unSubGroups();
        };
    }, [chatId]);

    const handleEmoji = e => {
        setText(prev => prev + e.emoji);
        setOpen(false);
    };

    const handleFile = e => {
        if (e.target.files[0]) {
            setFile({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    };

    const handleSend = async () => { 

        if (text === "" && !file.file) return;

        let fileUrl = null;

        try {
            if (file.file) {
                fileUrl = await upload(file.file);
            }

            const chatRef = doc(db, "chats", chatId);
            const chatData = {
                senderId: currentUser.id,
                text,
                createdAt: new Date(),
                ...(fileUrl && { file: fileUrl }),
            };

            await updateDoc(chatRef, {
                messages: arrayUnion(chatData),
            }); 

            if (chat.isGroup) {
                //quando um msg é enviada no grupo sempre cria um chat item
                const chatRef = collection(db, "chats");
                const newChatRef = doc(chatRef); 
                
                await updateDoc(doc(db, "groupchats", chat.id), {
                    chats: arrayUnion({
                    chatId: newChatRef.id,
                    isSeenGroup: [ currentUser.id ], 
                    lastMessage: text,
                    receiverId: currentUser.id,
                    updatedAt: Date.now(),
                    })
                });

            } else {
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

        setFile({
            file: null,
            url: "",
        });

        setText("");
    };

    const handleDetail = () => {
        onToggleDetail();
    };

    const handleEnterKey = (event) => {
        if (event.keyCode === 13) {
            handleSend();
        }
    };

    const avatarToShow = groupname ? (avatar || "./avatar.png") : (user.avatar || "./avatar.png");
    const nameToShow = groupname ? groupname : user.username;

    return (
        <div className="chat">
            <div className="top">
                <div className="user" onClick={handleDetail}>
                    <img src={avatarToShow} alt="" />
                    <div className="texts">
                        <span>{nameToShow}</span>
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
                            {message.file && <a href={message.file} target="_blank" rel="noopener noreferrer">Open file</a>}
                            <p>
                                {message.text}
                            </p>
                        </div>
                    </div>
                ))}

                {file.url && (
                <div className="message own">
                    <div className="texts">
                        <a href={file.url} target="_blank" rel="noopener noreferrer">Open file</a>
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

                    <input type="file" id="file" style={{display: "none"}} onChange={handleFile}/>
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
    );

    {isVisible && <Detail/>}
}

export default Chat;
