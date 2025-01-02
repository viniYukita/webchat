import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, arrayRemove, doc, getDoc, onSnapshot, updateDoc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import Detail from "../detail/Detail";
import { AiOutlineDownCircle } from "react-icons/ai";
import {
    markMessagesAsSeen,
    formatDateTime,
    formatLastActivity
} from "../../services/chatFirebaseService";

const Chat = ({ onToggleDetail }) => {
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
    const [dropdownOpen, setDropdownOpen] = useState({});

    const { currentUser } = useUserStore();
    const { chatId, user } = useChatStore();
    const [isMensagemGrupo, setIsMensagemGrupo] = useState(false);
    const [isUserActive, setIsUserActive] = useState(false);

    const inactivityTimeoutDuration = 30000;
    let inactivityTimer = null;

    const endRef = useRef(null);
    const isAdmin = currentUser.role === "admin";


    useEffect(() => {
        if (!chatId) return null;

        if (user?.id) {
            const userDocRef = doc(db, "users", user.id);
            const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
                // const userData = snapshot.data();
                // if (userData) {
                //     setIsUserActive(userData.isOnline);
                // }
            });
            return () => unsubscribe();
        }
    }, [user?.id]);

    useEffect(() => {
        if (!chatId) return null;
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    useEffect(() => {
        if (!chatId) return;

        const unsub = onSnapshot(doc(db, "chats", chatId), (res) => {
            setChat(res.data());
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
                    setIsMensagemGrupo(true);
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

    // useEffect(() => {
    //     document.addEventListener('mousemove', handleUserActivity);
    //     document.addEventListener('keydown', handleUserActivity);
    //     document.addEventListener('scroll', handleUserActivity);

    //     return () => {
    //         document.removeEventListener('mousemove', handleUserActivity);
    //         document.removeEventListener('keydown', handleUserActivity);
    //         document.removeEventListener('scroll', handleUserActivity);
    //         if (inactivityTimer) clearTimeout(inactivityTimer);
    //     };
    // }, []);

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
            if (file) {
                handleSend();
            }
        }
    };

    useEffect(() => {
        if (!chatId) return null;
        if (chatId && user?.id) {
            markMessagesAsSeen(chatId, currentUser);
        }
    }, [chatId, user?.id]);

    const handleSend = async () => {
        if (text === "" && !file.file) return;

        let fileUrl = null;
        var isImage = file.file && file.file.type.startsWith("image/");

        try {
            if (file.file) {
                fileUrl = await upload(file.file);
            }

            const chatRef = doc(db, "chats", chatId);
            const chatDoc = await getDoc(chatRef);

            if (!chatDoc.exists()) {
                await setDoc(chatRef, {
                    messages: [],
                    createdAt: serverTimestamp(),
                    isGroup: chat?.isGroup || false,
                    ...(chat?.isGroup && { groupId: chatId }),
                });
            }

            const chatData = {
                senderId: currentUser.id,
                senderName: currentUser.username,
                isDeleted: false,
                text,
                isSeen: false,
                createdAt: new Date(),
                ...(fileUrl && { file: fileUrl, isImage: isImage }),
            };

            await updateDoc(chatRef, {
                messages: arrayUnion(chatData),
            });

            if (chat?.isGroup) {
                const newChatRef = doc(collection(db, "chats"));

                await updateDoc(doc(db, "groupchats", chatId), {
                    chats: arrayUnion({
                        chatId: newChatRef.id,
                        isSeenGroup: [currentUser.id],
                        lastMessage: text,
                        senderId: currentUser.id,
                        senderName: currentUser.username,
                        updatedAt: Date.now(),
                    })
                });
            } else {
                const userIDs = [currentUser.id, user.id];
                userIDs.forEach(async (id) => {
                    const userChatsRef = doc(db, "userchats", id);
                    const userChatsSnapshot = await getDoc(userChatsRef);
                    if (userChatsSnapshot.exists()) {
                        const userChatsData = userChatsSnapshot?.data();
                        const chatIndex = userChatsData?.chats?.findIndex(c => c?.chatId === chatId);

                        if (chatIndex !== -1) {
                            userChatsData.chats[chatIndex].lastMessage = text;
                            userChatsData.chats[chatIndex].isSeen = (id === currentUser.id);
                            userChatsData.chats[chatIndex].updatedAt = Date.now();

                            await updateDoc(userChatsRef, {
                                chats: userChatsData.chats,
                            });
                        }
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

    const handleDeleteMessage = async (message) => {
        if (isAdmin || message.senderId === currentUser.id) {
            try {
                const chatRef = doc(db, "chats", chatId);
                const chatDoc = await getDoc(chatRef);

                if (chatDoc.exists()) {
                    const messages = chatDoc.data().messages.map((msg) =>
                        msg.senderId === message.senderId &&
                            msg.createdAt.toMillis() === message.createdAt.toMillis()
                            ? { ...msg, isDeleted: true }
                            : msg
                    );

                    await updateDoc(chatRef, { messages });
                }
            } catch (error) {
                console.log("Error deleting message:", error);
            }
        }
    };

    const toggleDropdown = (messageId) => {
        setDropdownOpen(prev => ({
            ...prev,
            [messageId]: !prev[messageId]
        }));
    };

    const avatarToShow = groupname ? (avatar || "./avatar.png") : (user?.avatar || "./avatar.png");
    const nameToShow = groupname ? groupname : user?.username;

    return (
        <div className="chat">
            {!chatId ? (
                <div className="no-chat-selected">
                    <h2>Bem-vindo ao Chat</h2>
                </div>
            ) : (
                <>
                    <div className="top">
                        <div className="user" onClick={handleDetail}>
                            <img src={avatarToShow} alt="" />
                            <div className="texts">
                                <span>{nameToShow}</span>
                                {/* {isUserActive && !groupname ? (
                            <p>online</p>
                        ) : user?.lastActivity ? (
                            <p>Visto por último: <span>{formatLastActivity(user.lastActivity)}</span></p>
                        ) : null} */}
                            </div>
                        </div>
                        {/* <div className="icons">
                            <img src="./phone.png" alt="" />
                            <img src="./video.png" alt="" />
                        </div> */}
                    </div>
                    <div className="center">
                        {chat?.messages
                            ?.filter(message => message.isDeleted !== true)
                            .map((message) => (
                                <div
                                    className={message.senderId === currentUser?.id ? "message own" : "message"}
                                    key={message?.createdAt}
                                >
                                    <div className="message">
                                        <div className="texts">
                                        <span className="sender-name">{message?.senderName}</span>
                                            <p className="message-content">
                                                {message.file && message.isImage && (
                                                    <img
                                                        src={message.file}
                                                        alt="Imagem enviada"
                                                        className="chat-image"
                                                        style={{ maxWidth: "100%", borderRadius: "8px" }}
                                                    />
                                                )}
                                                {message.file && !message.isImage && (
                                                    <a href={message.file} target="_blank" rel="noopener noreferrer">
                                                        Abrir arquivo
                                                    </a>
                                                )}

                                                {/* {message.senderId !== currentUser?.id && (
                                                    <div className="avatarChat">
                                                        <img src={avatarToShow} alt="" />
                                                    </div>
                                                )} */}

                                                <div className="text-msg">
                                                    {message.text}
                                                    <span className="message-timestamp">{formatDateTime(message.createdAt)}</span>
                                                    {message.isSeen && message.senderId === currentUser?.id && (
                                                        <span className="message-status">Lida</span>
                                                    )}
                                                </div>                                                
                                            </p>

                                            {message.senderId === currentUser.id && isAdmin && (
                                                <div className="dropdown">
                                                    <button
                                                        onClick={() => toggleDropdown(message.createdAt)}
                                                        className="dropdown-button"
                                                    >
                                                        <AiOutlineDownCircle />
                                                    </button>
                                                    {dropdownOpen[message.createdAt] && (
                                                        <div className="dropdown-content show">
                                                            <button onClick={() => handleDeleteMessage(message)}>
                                                                Apagar mensagem
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                        <div ref={endRef}></div>
                    </div>

                    <div className="bottom">
                        <div className="icons">
                            <label htmlFor="file">
                                <img src="./img.png" alt="" />
                            </label>

                            <input type="file" id="file" style={{ display: "none" }} onChange={handleFile} />
                            {/* <img src="./camera.png" alt="" />
                    <img src="./mic.png" alt="" /> */}
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
                </>
            )}
        </div>
    );

    { isVisible && <Detail /> }
}

export default Chat;
