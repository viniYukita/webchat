import "./detail.css"
import "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { auth } from "../../lib/firebase";

const Detail = () => {
    const { chatId, user } = useChatStore();

    return (
        <div className="detail"> 
            <div className="user">
                <img src={user.avatar ? user.avatar : "./avatar.png"} alt="" />
                <h2>{user.username}</h2>
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