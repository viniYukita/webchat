import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import "./userSelectionModal.css"; // Estilize o modal como preferir
import { db } from "../../../../lib/firebase";

const UserSelectionModal = ({ groupUsers, onClose, onAddUser }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const usersSnapshot = await getDocs(collection(db, "users"));
            let usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Ordena os usuários em ordem alfabética pelo username
            usersData = usersData.sort((a, b) => a.username.localeCompare(b.username));

            setAllUsers(usersData);
            filterUsers(usersData);
        };

        const filterUsers = (users) => {
            const availableUsers = users.filter(user => !groupUsers.includes(user.id));
            setFilteredUsers(availableUsers);
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose(); // Fecha o modal
            }
        };

        // Adiciona o event listener quando o componente é montado
        window.addEventListener("keydown", handleKeyDown);

        fetchUsers();

        // Remove o event listener quando o componente é desmontado
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [groupUsers]);

    return (
        <div className="user-selection-modal">
            <div className="modal-content">
                <h2>Adicionar Usuário ao Grupo</h2>
                <ul>
                    {filteredUsers.map(user => (
                        <li key={user.id}>
                            {user.username} 
                            <button onClick={() => onAddUser(user.id)}>Adicionar</button>
                        </li>
                    ))}
                </ul>
                <button className="close-button" onClick={onClose}>Fechar</button>
            </div>
        </div>
    );
};

export default UserSelectionModal;
