import { useEffect, useState } from "react";
import { onSnapshot, collection, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import "./detail.css";
import "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { auth, db } from "../../lib/firebase";
import UserSelectionModal from "../list/chatList/addUser/userSelectionModal";
import defaultAvatar from "../../../public/avatar.png";

const Detail = () => {
    const { chatId, user } = useChatStore();
    const [avatar, setAvatar] = useState(null);
    const [groupname, setGroupName] = useState(null);
    const [groups, setGroups] = useState([]);
    const [members, setMembers] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isGroup, setIsGroup] = useState(false);
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
                    setIsGroup(true);
                    setIsAdmin(group.admin === currentUser.id); // Verifica se o usuário logado é o admin

                    const userIds = group.usersGroup || [];
                    if (userIds.length > 0) {
                        const usersSnapshot = await Promise.all(userIds.map(id => getDoc(doc(db, "users", id))));
                        const usersData = usersSnapshot.map(doc => doc.data());
                        setMembers(usersData);
                    }
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
            {isGroup && <div className="info">
                <div className="option">
                    <div className="title">
                        {/* Adicionar botão de adicionar usuário se for admin */}
                        {isAdmin && (
                            <button onClick={() => setShowUserSelectionModal(true)}>
                                Adicionar Usuário ao Grupo
                            </button>
                        )}
                    </div>
                    <div className="members">
                        <h3>Membros do Grupo:</h3>
                        <ul>
                            {members.map((member) => (
                                <li key={member?.id} className="member-item"> 
                                    <img src={member?.avatar || defaultAvatar} className="member-avatar"/>
                                    {member?.username}
                                 </li>
                            ))}
                        </ul>
                    </div>
                </div>                
            </div>}

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
