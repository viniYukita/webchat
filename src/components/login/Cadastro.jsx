import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { toast } from 'react-toastify';
import { auth, db } from "../../lib/firebase"
import "./cadastro.css";

const Cadastro = () => {
    const [avatar, setAvatar] = useState({ file: null, url: "" });
    const [role, setRole] = useState("default");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleVoltar = () => {
        navigate(-1);
    }

    const handleCadastro = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const { username, email, senha } = Object.fromEntries(formData);

        if (role === "default") {
            toast.error("Por favor, selecione uma função.");
            setLoading(false);
            return;
        }

        try {
            const response = await createUserWithEmailAndPassword(auth, email, senha);
            const imgUrl = await upload(avatar.file);

            await setDoc(doc(db, "users", response.user.uid), {
                username,
                email,
                avatar: imgUrl,
                role,
                id: response.user.uid,
                blocked: []
            });

            await setDoc(doc(db, "userchats", response.user.uid), {
                chats: []
            });

            toast.success("Conta criada com sucesso!");
            navigate("/");
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatar = e => {
        if (e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    };

    const handleRoleChange = (e) => {
        setRole(e.target.value);
    };

    return (
        <div className="cadastro-div">
            <div className="usuarios-list">
                <h2>Usuários cadastrados</h2>
                <div className="item">
                    <img
                        src={
                            "./avatar.png"
                        }
                        alt=""
                    />
                    <div className="texts">
                        <span>
                            {"User"}
                        </span>
                    </div>

                    <img
                        src={
                            "./avatar.png"
                        }
                        alt=""
                    />
                    <div className="texts">
                        <span>
                            {"User"}
                        </span>
                    </div>
                </div>
            </div>

            <div className='cadastro'>
                <div className="item">
                    <h2>Cadastrar Usuário</h2>
                    <form onSubmit={handleCadastro}>
                        <label htmlFor="file" className='fileLabel'>
                            <img src={avatar.url || "./avatar.png"} alt="" />
                            Avatar
                        </label>
                        <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
                        <input type="text" placeholder="Usuário" name="username" />
                        <input type="text" placeholder="E-mail" name="email" />
                        <input type="password" placeholder="Senha" name="senha" />

                        <select id='userRole' value={role} onChange={handleRoleChange}>
                            <option value="default" disabled>Selecione uma função</option>
                            <option value="admin">Admin</option>
                            <option value="gestor">Gestor</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="operador">Operador</option>
                        </select>

                        <button disabled={loading}>{loading ? "Cadastrando" : "Cadastrar"}</button>
                        <button className='back-button' onClick={handleVoltar} >Voltar</button>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default Cadastro;
