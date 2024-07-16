import { useUserStore } from "../../../lib/userStore"
import "./userInfo.css"
import { AiOutlineTeam } from "react-icons/ai";
import { useState } from "react";
//import ChatList from "../chatList/ChatList";
import AddGroup from "../chatList/addUser/addGroup";

const UserInfo = () => {

    const {currentUser} = useUserStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    }

    return (
        <div className="userInfo">
            <div className="user">
                <img src={ currentUser?.avatar || "./avatar.png"} alt=""/>
                <h2>{currentUser?.username}</h2>
            </div>

            <div className="icons">
                <AiOutlineTeam onClick={toggleModal}/>
            </div>

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={toggleModal}>&times;</span>
                        <AddGroup />
                    </div>
                </div>
            )}

        </div>
    )
}

export default UserInfo