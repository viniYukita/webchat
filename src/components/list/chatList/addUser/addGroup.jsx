import { useEffect, useState } from "react";
import "./addGroup.css";
import { useUserStore } from "../../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc, collection, setDoc, serverTimestamp, arrayUnion, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import Select from 'react-select';
import upload from "../../../../lib/upload";
import { toast } from "react-toastify";

const AddGroup = () => {
  const [chats, setChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [avatar, setAvatar] = useState({ file: null, url: "" });

  const { currentUser } = useUserStore();

  // Fetch user chats
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

  // Fetch all users and exclude current user
  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = collection(db, "users");

      try {
        const querySnapshot = await getDocs(usersRef);
        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Exclude current user from search results
        const filteredUsers = usersList.filter(user => user.id !== currentUser.id);

        setSearchResults(filteredUsers);
      } catch (error) {
        console.error("Erro ao buscar usuários: ", error);
      }
    };

    fetchUsers();
  }, [currentUser.id]);

  const handleSelect = (selectedOptions) => {
    setSelectedUsers(selectedOptions || []);
  };

  const options = searchResults.map((user) => ({
    value: user.id,
    label: user.username,
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

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleGroup = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const { groupname, usersGroup } = Object.fromEntries(formData);

    // Add currentUser.id to the list of group members
    const members = [...JSON.parse(usersGroup), currentUser.id];
    const imgUrl = await upload(avatar.file);

    try {
      const groupDocRef = await addDoc(collection(db, "groups"), {
        groupname,
        usersGroup: members,
        avatar: imgUrl,
        admin: currentUser.id,
      });

      await setDoc(doc(db, "groups", groupDocRef.id), {
        id: groupDocRef.id,
        hasChat: false,
      }, { merge: true });

      await setDoc(doc(db, "groupchats", groupDocRef.id), {
        chats: [],
      });

      toast.success('Grupo criado com sucesso!');
    } catch (error) {
      console.log(error.message);
      toast.error(error.message);
    }
  };

  return (
    <div className="addGroup">
      <p>Novo Grupo</p>
      <form onSubmit={handleGroup}>
        <label htmlFor="file">
          <img src={avatar.url || "./avatar.png"} alt="" />
          <p>Inserir imagem</p>
        </label>
        <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />

        <div className="select">
          <div className="selects">
            <input
              placeholder="Nome Grupo.."
              type="text"
              name="groupname"
            />
          </div>
        </div>

        <div className="select">
          <div className="selects">
            <Select
              placeholder="Adicionar Membro"
              isMulti
              options={options}
              styles={customStyles}
              onChange={handleSelect}
              value={selectedUsers}
              name="usersGroup"
              closeMenuOnSelect={false}
            />
            <input
              type="hidden"
              name="usersGroup"
              value={JSON.stringify(selectedUsers.map(user => user.value))}
            />
          </div>
        </div>
        <button>Criar Grupo</button>
      </form>
    </div>
  );
};

export default AddGroup;
