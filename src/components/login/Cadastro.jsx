import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateEmail } from "firebase/auth";
import { setDoc, doc, onSnapshot, collection, updateDoc } from "firebase/firestore";
import { toast } from 'react-toastify';
import { auth, db } from "../../lib/firebase";
import { AiOutlineUserAdd } from "react-icons/ai";
import "./cadastro.css";
import AddUsuario from '../list/usuarios/AddUsuario';

const Cadastro = () => {
    const [avatar, setAvatar] = useState({ file: null, url: "" });
    const [role, setRole] = useState("default");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [userList, setUserList] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUserList(usersData);
        });

        return () => unsubscribe();
    }, []);

    const handleVoltar = () => {
        navigate(-1);
    };

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    }

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setRole(user.role || "default");
        setAvatar({ file: null, url: user.avatar || "" });
    };

    const handleCadastro = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const { username, email, senha } = Object.fromEntries(formData);

        if (role === "default") {
            toast.error("Por favor, selecione uma função.");
            setLoading(false);
            return;
        }

        try {
            if (selectedUser) {
                // Atualizar usuário existente
                const userDocRef = doc(db, "users", selectedUser.id);
                const updatedData = {
                    username,
                    email,
                    role,
                    avatar: avatar.file ? await upload(avatar.file) : selectedUser.avatar,
                };

                await updateDoc(userDocRef, updatedData);
                toast.success("Dados do usuário atualizados com sucesso!");
            } else {
                // Cadastrar novo usuário
                const response = await createUserWithEmailAndPassword(auth, email, senha);
                const imgUrl = await upload(avatar.file);

                await setDoc(doc(db, "users", response.user.uid), {
                    username,
                    email,
                    avatar: imgUrl,
                    role,
                    id: response.user.uid,
                    isDeleted: false,
                    blocked: []
                });

                await setDoc(doc(db, "userchats", response.user.uid), {
                    chats: []
                });

                toast.success("Conta criada com sucesso!");
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatar = e => {
        if (e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    };

    const handleRoleChange = (e) => {
        setRole(e.target.value);
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) {
            toast.error("Por favor, selecione um usuário para excluir.");
            return;
        }

        const confirmDelete = window.confirm("Tem certeza que deseja excluir este usuário?");
        if (confirmDelete) {
            try {
                const userDocRef = doc(db, "users", selectedUser.id);
                await updateDoc(userDocRef, { isDeleted: true });
                toast.success("Usuário excluído com sucesso!");
                setSelectedUser(null);
                setAvatar({ file: null, url: "" });
                setRole("default");
            } catch (error) {
                console.log(error);
                toast.error("Erro ao excluir usuário.");
            }
        }
    };

    return (
        <div className="cadastro-div">
            <div className="usuarios-list">
                <h2>Usuários cadastrados</h2>
                <AiOutlineUserAdd className="icon" onClick={toggleModal}/>
                {userList.map(user => (
                    <div key={user.id} className="item" onClick={() => handleUserClick(user)}>
                        <img src={user.avatar || "./avatar.png"} alt="Avatar" className="avatar" />
                        <div className="texts">
                            <span className="username">{user.username}</span>
                        </div>
                    </div>
                ))}
            </div>
            {selectedUser && <div className="cadastro">
                <div className="item">
                    <h2>{selectedUser ? "Atualizar Usuário" : "Cadastrar Usuário"}</h2>
                    {selectedUser.isDeleted && <p className='deletedUser'>Usuário deletado</p>}

                    <form onSubmit={handleCadastro}>
                        <label htmlFor="file" className="fileLabel">
                            <img src={avatar.url || selectedUser?.avatar || "./avatar.png"} alt="Avatar" />
                            Avatar
                        </label>
                        <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} disabled={selectedUser?.isDeleted} />
                        <input type="text" placeholder="Usuário" name="username" defaultValue={selectedUser?.username || ""} readOnly={selectedUser?.isDeleted} />
                        <input type="text" placeholder="E-mail" name="email" defaultValue={selectedUser?.email || ""} readOnly={selectedUser?.isDeleted} />
                        <input type="password" placeholder="Senha" name="senha" disabled={selectedUser?.isDeleted} />
                        <select id="userRole" value={role} onChange={handleRoleChange} disabled={selectedUser?.isDeleted}>
                            <option value="default" disabled>Selecione uma função</option>
                            <option value="admin">Admin</option>
                            <option value="gestor">Gestor</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="operador">Operador</option>
                        </select>
                        
                        {!selectedUser.isDeleted && <button disabled={loading || selectedUser?.isDeleted}>{loading ? "Processando..." : (selectedUser ? "Atualizar" : "Cadastrar")}</button>}
                        {!selectedUser.isDeleted && <button type="button" className="delete-button" onClick={handleDeleteUser}>Excluir</button>}
                    </form>
                </div>
            </div>}

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={toggleModal}>&times;</span>
                        <AddUsuario />
                    </div>
                </div>
            )}

        </div>
    );
};

export default Cadastro;
