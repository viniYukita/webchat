import { useEffect, useState } from "react";
import "./addGroup.css";
import { useUserStore } from "../../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import Select from 'react-select';

const AddGroup = () => {
  const [chats, setChats] = useState([]);
  const [input, setInput] = useState("");
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
    setSearchResults(
      chats.filter((c) =>
        c.user.username.toLowerCase().includes(input.toLowerCase())
      )
    );
  }, [input, chats]);

  const handleSelect = (selectedOptions) => {
    setSelectedUsers(selectedOptions);
  };

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'white',
      flex: 1,
      width: '450px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: 'transparent',
      color: 'white',
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: 'white',
    }),
    menu: (provided, state) => ({
      ...provided,
      backgroundColor: 'rgba(17, 25, 40, 0.8)',
      color: 'white',
    }),
  };

  return (
    <div className="addGroup">
      <p>Novo Grupo</p>
      <div className="select">     
        <div className="selects">          
          <Select
            placeholder="Adicionar Membro" 
            isMulti 
            options={searchResults.map(chat => ({
              value: chat.user.userId,
              label: chat.user.username,
            }))}
            styles={customStyles}
            onChange={handleSelect}
            value={selectedUsers}
            closeMenuOnSelect={false}
          />
        </div>
      </div>
    </div>
  );
};

export default AddGroup;
