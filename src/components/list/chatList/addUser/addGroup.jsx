import { useEffect, useState } from "react";
import "./addGroup.css";
import { useUserStore } from "../../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc, collection, setDoc, serverTimestamp, arrayUnion  } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import Select from 'react-select';

const AddGroup = () => {
  const [chats, setChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const { currentUser } = useUserStore();

  useEffect(() => {
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

    return () => {
      unSub();
    };
  }, [currentUser.id]);

  useEffect(() => {
    setSearchResults(chats);
  }, [chats]);

  const handleSelect = (selectedOptions) => {
    setSelectedUsers(selectedOptions || []);
  };
  
  const options = searchResults.map(chat => ({
    value: chat?.user?.id,
    label: chat?.user?.username
  }));

  const customStyles = {
    control: (provided) => ({
      ...provided,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'white',
      flex: 1,
      width: '450px',
    }),
    option: (provided) => ({
      ...provided,
      backgroundColor: 'transparent',
      color: 'white',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'rgba(17, 25, 40, 0.8)',
      color: 'white',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'white',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'white',
      ':hover': {
        backgroundColor: 'red',
        color: 'white',
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'rgba(17, 25, 40, 0.8)',
      color: 'white',
    }),
  };

  const handleAdd = async () => {
    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");

    try {
      const newChatRef = doc(chatRef);
      
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      const addUserToChat = async (userId, chatId, receiverId) => {
        const userChatRef = doc(userChatsRef, userId);
        const userChatDoc = await getDoc(userChatRef);
       
        if (userChatDoc.exists()) {
          await updateDoc(userChatRef, {
            chats: arrayUnion({
              chatId,
              lastMessage: "",
              receiverId,
              updatedAt: Date.now(),
            }),
          });
        } else {
          await setDoc(userChatRef, {
            chats: [
              {
                chatId,
                lastMessage: "",
                receiverId,
                updatedAt: Date.now(),
              },
            ],
          });
        }
      };
  
      // Adiciona o currentUser ao chat
      await addUserToChat(currentUser.id, newChatRef.id, selectedUsers.map(user => user.value).join(", "));
  
      // Adiciona os usuários selecionados ao chat
      for (const user of selectedUsers) {
        await addUserToChat(user.value, newChatRef.id, currentUser.id);
      }

    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="addGroup">
      <p>Novo Grupo</p>
      <div className="select">     
        <div className="selects">
          <Select
            placeholder="Adicionar Membro" 
            isMulti 
            options={options}
            styles={customStyles}
            onChange={handleSelect}
            value={selectedUsers}
            closeMenuOnSelect={false}
          />
        </div>
      </div>
        <button onClick={handleAdd}>Criar Grupo</button>
    </div>
    
    
  );
};

export default AddGroup;
