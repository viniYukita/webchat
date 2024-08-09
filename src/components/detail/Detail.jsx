import { useEffect, useState } from "react";
import { onSnapshot, collection, doc, updateDoc, arrayUnion } from "firebase/firestore";
import "./detail.css";
import "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { auth, db } from "../../lib/firebase";
import UserSelectionModal from "../list/chatList/addUser/userSelectionModal";

const Detail = () => {
    const { chatId, user } = useChatStore();
    const [avatar, setAvatar] = useState(null);
    const [groupname, setGroupName] = useState(null);
    const [groups, setGroups] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showUserSelectionModal, setShowUserSelectionModal] = useState(false);
    const { currentUser } = useUserStore();

    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, "groups"),
            async (snapshot) => {
                const groupsData = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(group => group.id === chatId);

                setGroups(groupsData);

                if (groupsData.length > 0) {
                    const group = groupsData[0];
                    setAvatar(group.avatar);
                    setGroupName(group.groupname);
                    setIsAdmin(group.admin === currentUser.id); // Verifica se o usuário logado é o admin
                } else {
                    setAvatar(null);
                    setGroupName(null);
                    setIsAdmin(false);
                }
            }
        );

        return () => {
            unsub();
        };
    }, [chatId, user.id]);

    const addUserToGroup = async (userId) => {
        if (isAdmin) {
            try {
                const groupDocRef = doc(db, "groups", chatId);
                await updateDoc(groupDocRef, {
                    usersGroup: arrayUnion(userId) // Adiciona o novo usuário ao grupo
                });
                alert("Usuário adicionado com sucesso!");
                setShowUserSelectionModal(false); // Fecha o modal após adicionar o usuário
            } catch (error) {
                console.error("Erro ao adicionar usuário ao grupo:", error);
            }
        } else {
            alert("Você não tem permissão para adicionar usuários a este grupo.");
        }
    };

    const avatarToShow = groupname ? (avatar || "./avatar.png") : (user.avatar || "./avatar.png");
    const nameToShow = groupname ? groupname : user.username;

    return (
        <div className="detail">
            <div className="user">
                <img src={avatarToShow} alt="" />
                <h2>{nameToShow}</h2>
            </div>
            <div className="info">
                <div className="option">
                    <div className="title">
                        {/* Adicionar botão de adicionar usuário se for admin */}
                        {isAdmin && (
                            <button onClick={() => setShowUserSelectionModal(true)}>
                                Adicionar Usuário ao Grupo
                            </button>
                        )}
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                    </div>
                </div>
                <div className="option">
                    <div className="title">

                    </div>
                    <div className="photos">
                        <div className="photoItem">

                        </div>
                    </div>
                </div>

                <button className="logout" onClick={() => auth.signOut()}>Logout</button>
            </div>

            {showUserSelectionModal && (
                <UserSelectionModal
                    groupUsers={groups.length > 0 ? groups[0].usersGroup : []}
                    onClose={() => setShowUserSelectionModal(false)}
                    onAddUser={addUserToGroup}
                />
            )}
        </div>
    );
}


export default Detail;
