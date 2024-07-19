import { useEffect, useState } from "react"
import { onSnapshot, collection } from "firebase/firestore";
import "./detail.css"
import "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { auth, db } from "../../lib/firebase";

const Detail = () => {
    const { chatId, user } = useChatStore();

    const [avatar, setAvatar] = useState(null);
    const [groupname, setGroupName] = useState(null);
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, "groups"),
            async (snapshot) => {
                const groupsData = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(group => group.id === chatId);
    
                setGroups(groupsData)

                if (groupsData.length > 0) {
                    const avatar = groupsData[0].avatar;
                    const groupname = groupsData[0].groupname;
                    setAvatar(avatar);
                    setGroupName(groupname);
                } else {
                    setAvatar(null);
                    setGroupName(null);
                }
            }
        );

        return () => {
            unsub();
        };
    }, [chatId]);

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
        </div>
    )
}

export default Detail