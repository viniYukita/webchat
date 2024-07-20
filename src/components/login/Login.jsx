import { useState } from "react"
import "./login.css"
import { toast } from "react-toastify"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "../../lib/firebase"


const Login = () => {

    const [loading, setLoading] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true);

        const formData = new FormData(e.target);
        const { email, senha } = Object.fromEntries(formData);

        try {
            await signInWithEmailAndPassword(auth, email, senha);

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