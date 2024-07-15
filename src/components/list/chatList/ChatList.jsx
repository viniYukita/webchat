import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc, collection } from "firebase/firestore";
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
      doc(db, "userchats", currentUser.id),
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
  }, [currentUser.id]);

  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    );

    userChats[chatIndex].isSeen = true;

    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.log(err);
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
    ? combinedList
    : combinedList.filter((item) => {
        if (item.type === 'chat') {
          return item?.user?.username.toLowerCase().includes(input.toLowerCase());
        } else if (item.type === 'group') {
          return item.groupname.toLowerCase().includes(input.toLowerCase());
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
