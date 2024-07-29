import "./addUser.css";
import { db } from "../../../../lib/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useState } from "react";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = ({ closeModal }) => {
  const [user, setUser] = useState(null);
  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const userRef = collection(db, "users");
      const groupRef = collection(db, "groups");

      const userQuery = query(userRef, where("username", "==", username));
      const userQuerySnapshot = await getDocs(userQuery);

      const groupQuery = query(groupRef, where("groupname", "==", username));
      const groupQuerySnapshot = await getDocs(groupQuery);

      if (!userQuerySnapshot.empty) {
        const userData = userQuerySnapshot.docs[0].data();
        setUser(userData);
      } else if (!groupQuerySnapshot.empty) {
        const groupData = groupQuerySnapshot.docs[0].data();
        setUser(groupData);
      }
    } catch (err) {
      console.error("Erro ao pesquisar usuário ou grupo:", err);
    }
  };

  const handleAdd = async () => {
    const chatRef = collection(db, "chats");
    const userChatsRef = user?.groupname ? collection(db, "groupchats") : collection(db, "userchats");

    try {
      const newChatRef = doc(chatRef);
      const newUserChatRef = doc(userChatsRef, currentUser?.id);
      const newUserIdChatRef = doc(userChatsRef, user?.id);
      const userChatDoc = await getDoc(newUserChatRef);
      const userIdChatRefDoc = await getDoc(newUserIdChatRef);

      if (user?.groupname) {
        await setDoc(newChatRef, {
          createdAt: serverTimestamp(),
          messages: [],
          isGroup: true,
          groupId: user.id,
        });

        await setDoc(doc(db, "chats", user.id), {
          createdAt: serverTimestamp(),
          messages: [],
          isGroup: true,
          groupId: user.id,
          id: user.id,
        });

        await updateDoc(doc(db, "groups", user.id), {
          hasChat: true,
        });
      } else {
        await setDoc(newChatRef, {
          createdAt: serverTimestamp(),
          messages: [],
        });

        if (userChatDoc.exists()) {
          await updateDoc(newUserChatRef, {
            chats: arrayUnion({
              chatId: newChatRef.id,
              lastMessage: "",
              receiverId: user.id,
              updatedAt: Date.now(),
            }),
          });
        } else {
          await setDoc(newUserChatRef, {
            chats: [
              {
                chatId: newChatRef.id,
                lastMessage: "",
                receiverId: user.id,
                updatedAt: Date.now(),
              },
            ],
          });
        }

        if (userIdChatRefDoc.exists()) {
          await updateDoc(newUserIdChatRef, {
            chats: arrayUnion({
              chatId: newChatRef.id,
              lastMessage: "",
              receiverId: currentUser.id,
              updatedAt: Date.now(),
            }),
          });
        } else {
          await setDoc(newUserIdChatRef, {
            chats: [
              {
                chatId: newChatRef.id,
                lastMessage: "",
                receiverId: currentUser.id,
                updatedAt: Date.now(),
              },
            ],
          });
        }
      }
      closeModal(); // Fecha o modal após adicionar o usuário
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button>Search</button>
      </form>
      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="" />
            <span>{user.username || user.groupname}</span>
          </div>
          <button onClick={handleAdd}>Conversar</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
