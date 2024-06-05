import { useEffect, useRef, useState } from "react"
import "./chat.css"
import EmojiPicker from "emoji-picker-react"

const Chat = () => {
const [open, setOpen] = useState(false);
const [text, setText] = useState("");

const endRef = useRef(null);

useEffect(() => {
    endRef.current?.scrollIntoView({behavior: "smooth"});
}, []);

const handleEmoji = e => {
    setText(prev => prev+e.emoji);
    setOpen(false)
}

    return (
        <div className="chat"> 
            <div className="top">
                <div className="user">
                    <img src="./avatar.png" alt=""/>
                    <div className="texts">
                        <span>Jane Dow</span>
                        <p>jkfalskye4laskdjhf asodiufalskdejfalçksjef</p>
                    </div>
                </div>
                <div className="icons">
                    <img src="./phone.png" alt=""/>
                    <img src="./video.png" alt=""/>
                    <img src="./info.png" alt=""/>
                </div>
            </div>
            <div className="center">
                <div className="message">
                    <img src="./avatar.png" alt="" />
                    <div className="texts">
                        <p>Hello asdkfjalejsdlfjklasçejdfoipjasdlçjkafaçsldklfjvjzxiiwerjkafs</p>
                        <span>1min ago</span>
                    </div>
                </div>

                <div className="message">
                    <img src="./avatar.png" alt="" />
                    <div className="texts">
                        <p>Hello asdkfjalejsdlfjklasçejdfoipjasdlçjkafaçsldklfjvjzxiiwerjkafs</p>
                        <span>1min ago</span>
                    </div>
                </div>

                <div className="message own">
                    <div className="texts">
                        <p>Hello asdkfjalejsdlfjklasçejdfoipjasdlçjkafaçsldklfjvjzxiiwerjkafs</p>
                        <span>1min ago</span>
                    </div>
                </div>

                <div className="message">
                    <img src="./avatar.png" alt="" />
                    <div className="texts">
                        <p>Hello asdkfjalejsdlfjklasçejdfoipjasdlçjkafaçsldklfjvjzxiiwerjkafs</p>
                        <span>1min ago</span>
                    </div>
                </div>

                <div className="message own">
                    <div className="texts">
                        <img src="https://images.pexels.com/photos/2825749/pexels-photo-2825749.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
                        <p>Hello asdkfjalejsdlfjklasçejdfoipjasdlçjkafaçsldklfjvjzxiiwerjkafs</p>
                        <span>1min ago</span>
                    </div>
                </div>

                <div ref={endRef}></div>

            </div>
            <div className="bottom">
                <div className="icons">
                    <img src="./img.png" alt="" />
                    <img src="./camera.png" alt="" />
                    <img src="./mic.png" alt="" />
                </div>
                <input type="text" placeholder="Digite uma mensagem" value={text} onChange={(e) => setText(e.target.value)} />
                <div className="emoji">
                    <img src="./emoji.png" alt="" onClick={() => setOpen(prev => !prev)} />
                    <div className="picker">
                        <EmojiPicker open={open} onEmojiClick={handleEmoji} />
                    </div>                
                </div>
                <button className="sendBtn">Enviar</button>
            </div>
        </div>
    )
}

export default Chat