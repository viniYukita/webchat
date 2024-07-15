import { useUserStore } from "../../../lib/userStore"
import "./userInfo.css"
import "../../detail/detail.css"
import { useState } from "react";
import Cadastro from "../../login/Cadastro";
import DropDownMenuUserInfo from './DropdownMenuUserInfo'
import { BrowserRouter } from "react-router-dom";

const UserInfo = () => {
    const [showDropDown, setShowDropdown] = useState(false);
    const { currentUser } = useUserStore();

    return (

        <div className="userInfo">
            <div className="user">
                <img src={currentUser.avatar || "./avatar.png"} alt="" />
                <h2>{currentUser.username}</h2>
            </div>

            <div className="icons">
                <img src="./more.png" alt="" onClick={() => setShowDropdown((prev) => !prev)} />
                {showDropDown && <DropDownMenuUserInfo />}
            </div>
        </div>

    )
}

function CadastroComponent() {
    <Cadastro></Cadastro>
}

export default UserInfo