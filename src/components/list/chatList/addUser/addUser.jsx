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

const AddUser = () => {
  const [user, setUser] = useState(null);

  const { currentUser } = useUserStore();

 /* const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const userRef = collection(db, "users");
      const groupRef = collection(db, "groups");

      const q = query(userRef, where("username", "==", username));
      const g = query(groupRef, where("groupname", "==", username));

      const querySnapShot = await getDocs(q,g);

      if (!querySnapShot.empty) {
        setUser(querySnapShot.docs[0].data());
      }
    } catch (err) {
      console.log(err);
    }
  };*/

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
        const userRef = collection(db, "users");
        const groupRef = collection(db, "groups");

        // Consulta para usuários com o nome de usuário correspondente
        const userQuery = query(userRef, where("username", "==", username));
        const userQuerySnapshot = await getDocs(userQuery);

        // Consulta para grupos com o nome correspondente
        const groupQuery = query(groupRef, where("groupname", "==", username));
        const groupQuerySnapshot = await getDocs(groupQuery);

        // Verifica se há resultados na consulta de usuários
        if (!userQuerySnapshot.empty) {
            const userData = userQuerySnapshot.docs[0].data();
            setUser(userData);
            // Aqui você pode definir um indicador ou lidar com os dados de usuário encontrados
        } else if (!groupQuerySnapshot.empty) {
            const groupData = groupQuerySnapshot.docs[0].data();
            setUser(groupData);
            // Aqui você pode definir um indicador ou lidar com os dados do grupo encontrados
        } else {
            // Caso não encontre nenhum usuário nem grupo com o nome correspondente
            console.log("Nenhum usuário ou grupo encontrado com o nome:", username);
        }

    } catch (err) {
        console.error("Erro ao pesquisar usuário ou grupo:", err);
    }
};


  const handleAdd = async () => {
    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");

    try {
      const newChatRef = doc(chatRef);
      const newUserChatRef = doc(userChatsRef, currentUser.id);
      const newUserIdChatRef = doc(userChatsRef, user.id);
      const userChatDoc = await getDoc(newUserChatRef);
      const userIdChatRefDoc = await getDoc(newUserIdChatRef);

      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      if (userChatDoc.exists) {
        await updateDoc(doc(userChatsRef, user.id), {
          chats: arrayUnion({
            chatId: newChatRef.id,
            lastMessage: "",
            receiverId: currentUser.id,
            updatedAt: Date.now(),
          })
        });
      } else {
        await setDoc(newUserChatRef, {
          chats: [{
            chatId: newChatRef.id,
            lastMessage: "",
            receiverId: user.id,
            updatedAt: Date.now(),
          }],
        });
      }

      if (userIdChatRefDoc.exists) {
        await updateDoc(doc(userChatsRef, currentUser.id), {
          chats: arrayUnion({
            chatId: newChatRef.id,
            lastMessage: "",
            receiverId: user.id,
            updatedAt: Date.now(),
          })
        });
      } else {
        await setDoc(newUserIdChatRef, {
          chats: [{
            chatId: newChatRef.id,
            lastMessage: "",
            receiverId: currentUser.id,
            updatedAt: Date.now(),
          }],
        });
      }

    } catch (err) {
      console.log(err);
    }
  };
console.log('aaaaaaaaaa', user);
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