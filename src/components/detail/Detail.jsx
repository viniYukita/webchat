import "./detail.css"
import "../../lib/firebase";
import { auth } from "../../lib/firebase";

const Detail = () => {
    return (
        <div className="detail"> 
            <div className="user">
                <img src="./avatar.png" alt="" />
                <h2>Jane Doe</h2>
                <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit.</p>
            </div>
            <div className="info">
                <div className="option">
                    <div className="title">
                        <span>Configurações</span>
                        <img src="./arrowUp.png" alt="" />
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Privacidade e segurança</span>
                        <img src="./arrowUp.png" alt="" />
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Mídias</span>
                        <img src="./arrowDown.png" alt="" />
                    </div>
                    <div className="photos">
                        <div className="photoItem">
                            <div className="photoDetail">
                                <img src="https://images.pexels.com/photos/2825749/pexels-photo-2825749.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
                                <span>chat_photo_20240530</span>
                            </div>
                            <img src="./download.png" alt="" className="icon" />
                        </div>
                        <div className="photoItem">
                            <div className="photoDetail">
                                <img src="https://images.pexels.com/photos/2825749/pexels-photo-2825749.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
                                <span>chat_photo_20240530</span>
                            </div>
                            <img src="./download.png" alt="" className="icon"/>
                        </div>
                        
                    </div>
                </div>

                <button>Bloquear usuário</button>
                <button className="logout" onClick={() => auth.signOut()}>Logout</button>
            </div>
        </div>
    )
}

export default Detail