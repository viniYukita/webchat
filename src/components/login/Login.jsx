import { useState } from "react"
import "./login.css"
import { toast } from "react-toastify"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "../../lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import upload from "../../lib/upload"

const Login = () => {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    })

    const [loading, setLoading] = useState(false)

    const handleAvatar = e => {
        if (e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            })
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true);

        const formData = new FormData(e.target);
        const {email,senha} = Object.fromEntries(formData);

        try {
            await signInWithEmailAndPassword(auth, email, senha);

        }catch (error) {
            console.log(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    const handleCadastro = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const {username,email,senha} = Object.fromEntries(formData);

        try {
            const response = await createUserWithEmailAndPassword(auth, email, senha);
            const imgUrl = await upload(avatar.file)

            await setDoc(doc(db,"users",response.user.uid), {
                username,
                email,
                avatar: imgUrl,
                id: response.user.uid,
                blocked: []
            });

            await setDoc(doc(db,"userchats",response.user.uid), {
                chats: []
            });

            toast.success("Conta criada com sucesso!")

        } catch (error) {
            console.log(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="login">
            <div className="item">
                <h2>Bem-vindo</h2>
                <form onSubmit={handleLogin}>
                    <input type="text" placeholder="E-mail" name="email" />
                    <input type="password" placeholder="Senha" name="senha" />
                    <button disabled={loading}>{loading ? "Entrando" : "Entrar"}</button>
                </form>
            </div>
        </div>
    )
}

export default Login