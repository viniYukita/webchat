import React from "react";
import './dropDownMenuUserInfo.css';
import { auth } from "../../../lib/firebase";
import { useUserStore } from "../../../lib/userStore";
import { Link } from "react-router-dom";

const DropDownMenuUserInfo = () => {
    const { currentUser } = useUserStore();
    const isAdmin = currentUser.role === "admin";

    return (
        <div className="flex flex-col dropDownMenuUser">
            <ul className="flex flex-col gap-4">
                {isAdmin && (
                    <li>
                        <Link to="/cadastro">Usuarios</Link>
                    </li>
                )}
                <li className="logout-btn" onClick={() => auth.signOut()}>
                    Logout
                </li>
            </ul>
        </div>
    );
};

export default DropDownMenuUserInfo;
