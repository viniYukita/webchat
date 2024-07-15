import React from "react";
import './dropDownMenuUserInfo.css';
import { auth } from "../../../lib/firebase";
import { useUserStore } from "../../../lib/userStore";
import { BrowserRouter, Link } from "react-router-dom";
import Cadastro from "../../login/Cadastro";

const DropDownMenuUserInfo = () => {
    const { currentUser } = useUserStore();
    const isAdmin = currentUser.role == "admin" ? true : false

    return (
        <BrowserRouter>
            <div className="flex flex-col dropDownMenuUser">
                <ul className="flex flex-col gap-4">
                    {isAdmin && <li>
                        <Link to="/cadastro">
                            Usuarios
                        </Link>
                    </li>}

                    <li className="logout-btn" onClick={() => auth.signOut()} >
                        Logout
                    </li>
                </ul>
            </div>
        </BrowserRouter>
    );
}

function CadastroComponent() {
    return (
        <Cadastro />
    )
}

export default DropDownMenuUserInfo;