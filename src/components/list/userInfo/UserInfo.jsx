import { useUserStore } from "../../../lib/userStore"
import "./userInfo.css"
import "../../detail/detail.css"
import { useState } from "react";
import Cadastro from "../../login/Cadastro";
import DropDownMenuUserInfo from './DropdownMenuUserInfo'
import { BrowserRouter } from "react-router-dom";
import { AiOutlineTeam } from "react-icons/ai";
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
                <AiOutlineTeam onClick={toggleModal}/>
                <img src="./more.png" alt="" onClick={() => setShowDropdown((prev) => !prev)} />
                {showDropDown && <DropDownMenuUserInfo />}
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

function CadastroComponent() {
    <Cadastro></Cadastro>
}

export default UserInfo