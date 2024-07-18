import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, arrayUnion, getDoc, onSnapshot, updateDoc, collection, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  const [groups, setGroups] = useState([]);

  useEffect(() => {

    const handleEscapeKey = (event) => {
      if (event.key == "Escape") {
        setAddMode(false);
      }
    }

    const unSub = onSnapshot(
      doc(db, "userchats", currentUser?.id),
      async (res) => {
        const items = res.data().chats;

        const promises = items.map(async (item) => {
          const userDocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);

          const user = userDocSnap.data();

          return { ...item, user };
        });

        const chatData = await Promise.all(promises);

        setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    );

    const unSubGroups = onSnapshot(
      collection(db, "groups"),
      async (snapshot) => {
        const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGroups(groupsData);
      }
    );

    return () => {
      unSub();
      unSubGroups();
    };
  }, [currentUser?.id]);

  const handleSelect = async (chat) => {
    if (chat.type === "group") {
      // Verifica se o grupo já possui um chatId
      if (!chat.chatId) {
          const chatRef = doc(collection(db, "chats"));
          const chatId = chat.id;

          // Cria o documento na coleção "chats"
          await setDoc(chatRef, {
              createdAt: new Date(),
              isGroup: true,
              messages: [],
              groupId: chat.id,
              chats: [{
                chatId: chatId,
                lastMessage: "",
                receiverId: currentUser.id,
                updatedAt: Date.now(),
              }],
          });

          await updateDoc(doc(db, "groupchats", chat.id), {
            chats: arrayUnion({
                chatId: chatId,
                lastMessage: "",
                receiverId: currentUser.id,
                updatedAt: Date.now(),
            })
        });

          chat.chatId = chatId;
      }

      changeChat(chat.chatId, currentUser?.id);
    } else {
      // Mantém a conversa individual na lista de chats
      if (!chats.find(c => c.chatId === chat.chatId)) {
          chats.push(chat);
      }
        
      changeChat(chat.chatId, chat.user);
    }
    
    // Atualiza o estado de userChats mantendo todas as conversas visíveis
    const updatedUserChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = updatedUserChats.findIndex(
      (item) => item.chatId === chat.chatId
    );

    if (!chat.groupname) {
      updatedUserChats[chatIndex].isSeen = true;
      const userChatsRef = doc(db, "userchats", currentUser?.id);

      try {
        await updateDoc(userChatsRef, {
            chats: updatedUserChats,
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      // TO DO fazer para o grupo
    }
  };

  const combinedList = [
    ...chats.map(chat => ({
      ...chat,
      type: 'chat',
    })),
    ...groups.map(group => ({
      ...group,
      type: 'group',
    })),
  ];

  const filteredCombinedList = !input
  ? combinedList.filter((item) => {
      if (item.type === 'group') {

        const isUserInGroup = item.usersGroup?.includes(currentUser?.id);
        const isAdmin = item.admin === currentUser?.id;
        const hasChat = item.hasChat;

        return (isUserInGroup || isAdmin) && hasChat;
      }
      return true;
    })
  : combinedList.filter((item) => {
      if (item.type === 'chat') {
        return item?.user?.username.toLowerCase().includes(input.toLowerCase());
      } else if (item.type === 'group') {
        // Verifica se userGroup está definido
        const isMemberOrAdmin = item.usersGroup?.includes(currentUser?.id) || item.admin === currentUser?.id;
        return isMemberOrAdmin && item.groupname.toLowerCase().includes(input.toLowerCase());
      }
      return false;
    });

  // TO DO
  // LISTAR ULTIMA MENSAGEM DO GRUPO NO item.lastMessage
  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {filteredCombinedList.map((item) => (
        <div
          className="item"
          key={item.id || item.chatId }
          onClick={() => handleSelect(item)}
          style={{
            backgroundColor: item?.isSeen ? "transparent" : "#5183fe",
          }}
        >
          <img
            src={
              item.type === 'chat'
                ? (item?.user?.avatar ? item.user.avatar : "./avatar.png")
                : item.avatar
            }
            alt=""
          />
          <div className="texts">
            <span>
              {item.type === 'chat' ? item?.user?.username : item?.groupname}
            </span>
            <p>{item.lastMessage}</p>
          </div>
        </div>
      ))}

      {addMode && <AddUser />}
    </div>
  );
};

export default ChatList;
