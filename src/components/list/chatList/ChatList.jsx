import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, arrayUnion, getDoc, onSnapshot, updateDoc, collection } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";
import { AiOutlineDownCircle } from "react-icons/ai";

import notificationSound from "../../../assets/notification.mp3";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  const [groups, setGroups] = useState([]);
  const [groupchats, setGroupChats] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0); // Estado para contar mensagens não lidas

  const playNotificationSound = () => {
    const audio = new Audio(notificationSound);
    audio.play();
  };

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setAddMode(false);
      }
    };

    const unSub = onSnapshot(
      doc(db, "userchats", currentUser?.id),
      async (res) => {
        const items = res.data()?.chats;

        if (items) {
          const promises = items.map(async (item) => {
            const userDocRef = doc(db, "users", item.receiverId);
            const userDocSnap = await getDoc(userDocRef);
            const user = userDocSnap.data();

            if (!user?.isDeleted && user?.id) {
              return { ...item, user };
            }
            return null;
          });

          const chatData = await Promise.all(promises);
          const validChats = chatData.filter(chat => chat !== null);

          // Atualiza as mensagens não lidas
          const unreadMessages = validChats.filter(chat => !chat.isSeen);
          setUnreadCount(unreadMessages.length); // Atualiza a contagem de não lidas

          if (validChats.length > 0) {
            const lastChat = validChats[0];
            if (lastChat.senderId !== currentUser?.id && !lastChat.isSeen) {
              playNotificationSound(); // Toca o som
            }
          }

          setChats(validChats.sort((a, b) => b.updatedAt - a.updatedAt));
        }
      }
    );

    const unSubGroups = onSnapshot(collection(db, "groups"), async (snapshot) => {
      const groupsData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((group) => !group.isDeleted); // Filter out deleted groups

      setGroups(groupsData);
    });

    const unnSubGroupChats = onSnapshot(collection(db, "groupchats"), async (snapshot) => {
      const groupChatsData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.updatedAt - b.updatedAt);

      // Itera sobre cada grupo para verificar a última mensagem
      groupChatsData.forEach((groupChat) => {
        if (groupChat.chats && groupChat.chats.length > 0) {
          const lastMessage = groupChat.chats[groupChat.chats.length - 1];

          if (lastMessage.senderId !== currentUser?.id && !lastMessage.isSeenGroup.includes(currentUser?.id)) {
            console.log("Toca o som!"); // Ou use alert para testes
            // playNotificationSound(); // Toca o som de notificação para grupos
          }
        }
      });

      setGroupChats(groupChatsData); // Atualiza o estado com os chats ordenados
    });

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      unSub();
      unSubGroups();
      unnSubGroupChats();
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [currentUser?.id]);

  // Atualize o título da aba baseado nas mensagens não lidas
  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) Novas mensagens`;
    } else {
      document.title = "Chat App";
    }
  }, [unreadCount]); // Mude o título da aba sempre que `unreadCount` mudar

  const handleSelect = async (chat) => {
    if (chat.type === "group") {
      // Verifica se o grupo já possui um chatId associado
      if (!chat.chatId) {
        const chatId = chat.id;
        chat.chatId = chatId;
      }

      // Altera o chat ativo no estado global
      changeChat(chat.chatId, currentUser?.id);

      // Obtém as mensagens do grupo
      const groupChatsRef = doc(db, "groupchats", chat.chatId);
      const groupChatSnapshot = await getDoc(groupChatsRef);
      const groupChatData = groupChatSnapshot.data();

      if (!groupChatData) return;

      const { chats: groupMessages } = groupChatData;

      // Atualiza o campo isSeenGroup nas mensagens que ainda não foram vistas pelo usuário
      const messagesToUpdate = groupMessages.filter(
        (message) => !message.isSeenGroup?.includes(currentUser?.id)
      );

      const updatedMessages = messagesToUpdate.map((message) => ({
        ...message,
        isSeenGroup: [...(message.isSeenGroup || []), currentUser?.id], // Adiciona o ID do usuário ao array isSeenGroup
      }));

      // Atualiza o Firestore com as mensagens modificadas
      await updateDoc(groupChatsRef, {
        chats: arrayUnion(...updatedMessages) // Atualiza as mensagens com o campo isSeenGroup atualizado
      });

    } else {
      // Lógica para chats individuais permanece igual
      if (!chats.find(c => c.chatId === chat.chatId)) {
        chats.push(chat);
      }

      changeChat(chat.chatId, chat.user);

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
      }
    }
  };

  const combinedList = [
    ...chats.map(chat => ({
      ...chat,
      type: 'chat',
    })),
    ...groups.map(group => ({
      ...group,
      groupchats: groupchats.filter(x => x.id === group.id),
      type: 'group',
    })),
  ];

  const handleDeleteGroup = async (group) => {
    try {
      await updateDoc(doc(db, "groups", group.id), {
        isDeleted: true,
      });
      setGroups(groups.filter((g) => g.id !== group.id));
    } catch (error) {
      console.log("Error deleting group:", error);
    }
  };

  const handleDropdownToggle = (id) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  const filteredCombinedList = !input
    ? combinedList
      .filter((item) => {
        if (item.type === 'group') {
          const isUserInGroup = item.usersGroup?.includes(currentUser?.id);
          const isAdmin = item.admin === currentUser?.id;
          const hasChat = item.hasChat;

          return (isUserInGroup || isAdmin) && hasChat;
        }
        return true;
      })
      .map((item) => {
        if (item.type === 'group') {
          const groups = item.groupchats || [];
          const chats = groups.map(x => x.chats).flat(); // Usar flat() para garantir que não haja arrays aninhados

          let isSeen = false;
          let lastMessage = "";
          let unreadMessagesCount = 0;

          if (chats.length > 0) {
            for (const chat of chats) {
              const isUserSeen = chat.isSeenGroup?.includes(currentUser?.id);

              if (!isUserSeen) {
                unreadMessagesCount++;
              }
              if (chat.isDeleted !== true) {
                lastMessage = chat.lastMessage;
              }
            }
            isSeen = unreadMessagesCount === 0;
          }

          return {
            ...item,
            isSeen,
            lastMessage,
            unreadMessagesCount,
            updatedAt: chats.length > 0 ? chats[chats.length - 1]?.updatedAt : item.updatedAt || 0, // Verificação correta
          };
        }

        return item;
      })
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)) // Ordenação das mais novas para as mais antigas
    : combinedList
      .filter((item) => {
        if (item.type === 'chat') {
          return item?.user?.username?.toLowerCase().includes(input.toLowerCase());
        } else if (item.type === 'group') {
          const isMemberOrAdmin = item.usersGroup?.includes(currentUser?.id) || item.admin === currentUser?.id;
          return isMemberOrAdmin && item.groupname?.toLowerCase().includes(input.toLowerCase());
        }
        return false;
      })
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); // Ordenação correta aqui também


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
          key={item.id || item.chatId}
          onClick={() => handleSelect(item)}
          style={{
            backgroundColor: item.type === 'group'
              ? item.groupchats?.some(groupChat =>
                groupChat.chats?.slice(-1)[0]?.isSeenGroup?.includes(currentUser?.id) === false
              )
                ? "#5183fe"
                : "transparent"
              : item.isSeen
                ? "transparent"
                : "#5183fe"
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
            <p>
              {item.lastMessage}
            </p>
          </div>
          {item.type === 'group' && item.admin === currentUser.id && (
            <>
              <AiOutlineDownCircle
                onClick={(e) => {
                  e.stopPropagation();
                  handleDropdownToggle(item.id);
                }}
              />
              {dropdownOpen === item.id && (
                <div className="dropdown-content show" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleDeleteGroup(item)}>Apagar Grupo</button>
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {addMode && <AddUser closeModal={() => setAddMode(false)} />}
    </div>
  );
};

export default ChatList;
