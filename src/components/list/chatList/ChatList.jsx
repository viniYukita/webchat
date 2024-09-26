import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, arrayUnion, getDoc, onSnapshot, updateDoc, collection } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";
import { AiOutlineDownCircle } from "react-icons/ai";

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
      setGroupChats(groupChatsData);
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
      if (!chat.chatId) {
        const chatId = chat.id;
        chat.chatId = chatId;
      }

      changeChat(chat.chatId, currentUser?.id);
    } else {
      if (!chats.find(c => c.chatId === chat.chatId)) {
        chats.push(chat);
      }

      changeChat(chat.chatId, chat.user);
    }

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
      const groupChatsRef = doc(db, "groupchats", chat.chatId);
      const groupChatSnapshot = await getDoc(groupChatsRef);
      const groupChatData = groupChatSnapshot.data();

      var maxIndex = -1;

      if (Array.isArray(groupChatData.chats) && groupChatData.chats.length > 0) {
        maxIndex = groupChatData.chats.reduce((maxIndex, currentValue, currentIndex) => {
          return currentIndex > maxIndex ? currentIndex : maxIndex;
        }, 0);
      } else {
        return;
      }

      const chatIndex = groupChatData.chats[maxIndex];
      const hasUser = chatIndex.isSeenGroup.findIndex(
        (item) => item === currentUser.id
      );

      if (hasUser < 0) {
        chatIndex.isSeenGroup.push(currentUser.id);

        await updateDoc(doc(db, "groupchats", chat.chatId), {
          chats: arrayUnion({
            chatId: chatIndex.chatId,
            isSeenGroup: chatIndex.isSeenGroup,
            lastMessage: chatIndex.lastMessage,
            receiverId: chatIndex.receiverId,
            isDeleted: false,
            updatedAt: Date.now(),
          })
        }, { merge: true });

        return;
      } else {
        return;
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
          const groups = item.groupchats || {};
          const chats = groups.map(x => x.chats) || [];

          let isSeen = false;
          let lastMessage = "";
          let unreadMessagesCount = 0;

          if (chats.length > 0) {
            for (const chat of chats) {
              const isUserSeen = chat.isSeenGroup?.includes(currentUser?.id);
              if (!isUserSeen) {
                unreadMessagesCount++;
              }
              if (chat.length > 0 && chat[chat.length - 1].isDeleted !== true) {
                lastMessage = chat[chat.length - 1].lastMessage;
              }
            }
            isSeen = unreadMessagesCount === 0;
          }

          return {
            ...item,
            isSeen,
            lastMessage,
            unreadMessagesCount,
            updatedAt: chats.length > 0 ? chats[chats.length - 1][chats[chats.length - 1].length - 1].updatedAt : item.updatedAt,
          };
        }

        return item;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
    : combinedList
      .filter((item) => {
        if (item.type === 'chat') {
          return item?.user?.username.toLowerCase().includes(input.toLowerCase());
        } else if (item.type === 'group') {
          const isMemberOrAdmin = item.usersGroup?.includes(currentUser?.id) || item.admin === currentUser?.id;
          return isMemberOrAdmin && item.groupname.toLowerCase().includes(input.toLowerCase());
        }
        return false;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);

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
