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
  const [groupchats, setGroupChats] = useState([]);

  useEffect(() => {

    const handleEscapeKey = (event) => {
      if (event.key == "Escape") {
        setAddMode(false);
      }
    }

    const unSub = onSnapshot(
      doc(db, "userchats", currentUser?.id),
      async (res) => {
        const items = res.data()?.chats;

        if (items) {

          const promises = items.map(async (item) => {
            const userDocRef = doc(db, "users", item.receiverId);
            const userDocSnap = await getDoc(userDocRef);

            const user = userDocSnap.data();

            return { ...item, user };
          });

          const chatData = await Promise.all(promises);

          setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        }
      }
    );

    const unSubGroups = onSnapshot(collection(db, "groups"), async (snapshot) => {
      const groupsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setGroups(groupsData);
    });

    const unnSubGroupChats = onSnapshot(collection(db, "groupchats"), async (snapshot) => {
      const groupChatsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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

  const handleSelect = async (chat) => {
    if (chat.type === "group") {

      // Verifica se o grupo já possui um chatId
      if (!chat.chatId) {
        const chatId = chat.id;
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

      const groupChatsRef = doc(db, "groupchats", chat.chatId);

      const groupChatSnapshot = await getDoc(groupChatsRef);

      const groupChatData = groupChatSnapshot.data();

      var maxIndex = -1;

      if (Array.isArray(groupChatData.chats) && groupChatData.chats.length > 0) {
        maxIndex = groupChatData.chats.reduce((maxIndex, currentValue, currentIndex) => {
          return currentIndex > maxIndex ? currentIndex : maxIndex;
        }, 0);
      } else {
        //ainda não houve troca de mensagens no grupo
        return;
      }

      const chatIndex = groupChatData.chats[maxIndex];

      const hasUser = chatIndex.isSeenGroup.findIndex(
        (item) => item === currentUser.id
      );

      if (hasUser < 0) {

        chatIndex.isSeenGroup.push(currentUser.id)

        await updateDoc(doc(db, "groupchats", chat.chatId), {
          chats: arrayUnion({
            chatId: chatIndex.chatId,
            isSeenGroup: chatIndex.isSeenGroup,
            lastMessage: chatIndex.lastMessage,
            receiverId: chatIndex.receiverId,
            updatedAt: Date.now(),
          })
        }, { merge: true });

        return;
      } else {
        // Se o usuario ja visualizou a mensagem retorna
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
      groupchats: groupchats.filter(x => x.id == group.id),
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
    }).map((item) => {

      if (item.type === 'group') {
        const groups = item.groupchats || {};
        const chats = groups.map(x => x.chats) || [];

        var isSeen = false;
        var lastMessage = "";
        if (chats.length > 0 && chats[chats.length - 1].length > 0) {
          const lastChat = chats[chats.length - 1][chats[chats.length - 1].length - 1];
          isSeen = lastChat.isSeenGroup?.includes(currentUser?.id) ? true : false;
          lastMessage = lastChat.lastMessage;
        }

        return {
          ...item,
          isSeen,
          lastMessage,
        };
      }

      return item;
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
            <p>{item.lastMessage}</p>
          </div>
        </div>
      ))}

      {addMode && <AddUser />}
    </div>
  );
};

export default ChatList;