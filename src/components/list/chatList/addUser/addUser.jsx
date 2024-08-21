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
import { useState, useEffect } from "react";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = ({ closeModal }) => {
  const [user, setUser] = useState(null);
  const [input, setInput] = useState(""); // Adicionando um estado para armazenar o valor do input
  const { currentUser } = useUserStore();

  useEffect(() => {
    if (input.trim() === "") {
      setUser(null); // Se o input estiver vazio, não faz a busca
      return;
    }

    const searchUser = async () => {
      try {
        const userRef = collection(db, "users");
        const groupRef = collection(db, "groups");

        const userQuery = query(userRef, where("username", ">=", input), where("username", "<=", input + "\uf8ff"));
        const userQuerySnapshot = await getDocs(userQuery);

        const groupQuery = query(groupRef, where("groupname", ">=", input), where("groupname", "<=", input + "\uf8ff"));
        const groupQuerySnapshot = await getDocs(groupQuery);

        if (!userQuerySnapshot.empty) {
          const userData = userQuerySnapshot.docs[0].data();
          setUser(userData);
        } else if (!groupQuerySnapshot.empty) {
          const groupData = groupQuerySnapshot.docs[0].data();
          setUser(groupData);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Erro ao pesquisar usuário ou grupo:", err);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      searchUser();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [input]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleAdd = async () => {
    if (!user) return;

    const chatRef = collection(db, "chats");
    const userChatsRef = user?.groupname ? collection(db, "groupchats") : collection(db, "userchats");

    try {
      const newChatRef = doc(chatRef);
      const newUserChatRef = doc(userChatsRef, currentUser?.id);
      const newUserIdChatRef = doc(userChatsRef, user?.id);
      const userChatDoc = await getDoc(newUserChatRef);
      const userIdChatRefDoc = await getDoc(newUserIdChatRef);

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

      closeModal();
    } catch (err) {
      console.log("Erro ao iniciar a conversa:", err);
    }
  };

  return (
    <div className="addUser">
      <form>
        <input
          type="text"
          placeholder="Username"
          name="username"
          value={input}
          onChange={handleInputChange}
        />
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
