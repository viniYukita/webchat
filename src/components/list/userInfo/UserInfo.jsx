import { useUserStore } from "../../../lib/userStore"
import "./userInfo.css"
import "../../detail/detail.css"
import { useState } from "react";
import DropDownMenuUserInfo from './DropdownMenuUserInfo'
import { BrowserRouter } from "react-router-dom";
import { AiOutlineTeam } from "react-icons/ai";
import { CiMenuKebab } from "react-icons/ci";
import AddGroup from "../chatList/addUser/addGroup";

const UserInfo = () => {
    const [showDropDown, setShowDropdown] = useState(false);
    const { currentUser } = useUserStore();
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
                <AiOutlineTeam className="icon" onClick={toggleModal}/>
                <CiMenuKebab onClick={() => setShowDropdown((prev) => !prev)}/>
                {showDropDown && <DropDownMenuUserInfo />}
            </div>

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={toggleModal}>&times;</span>
                        <AddGroup  closeModal={toggleModal} />
                    </div>
                </div>
            )}

        </div>

    )
}

export default UserInfo