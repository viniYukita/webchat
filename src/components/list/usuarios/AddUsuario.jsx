import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { auth, db } from "../../../lib/firebase";
import upload from "../../../lib/upload";
import "./addUsuario.css";

const AddUsuario = () => {
    const [avatar, setAvatar] = useState({ file: null, url: "" });
    const [role, setRole] = useState("default");
    const [loading, setLoading] = useState(false);

    const handleAvatar = (e) => {
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
            // Cadastrar novo usuário
            const response = await createUserWithEmailAndPassword(auth, email, senha);
            const imgUrl = avatar.file ? await upload(avatar.file) : ""; // Se não houver arquivo, não precisa enviar o avatar.

            await setDoc(doc(db, "users", response.user.uid), {
                username,
                email,
                avatar: imgUrl,
                role,
                id: response.user.uid,
                isDeleted: false,
                blocked: []
            });

            await setDoc(doc(db, "userchats", response.user.uid), {
                chats: []
            });

            toast.success("Conta criada com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="addGroup">
            <p>Novo Usuário</p>
            <div className="cadastro">
                <div className="item">
                    <h2>Cadastrar Usuário</h2>
                    <form onSubmit={handleCadastro}>
                        <label htmlFor="file" className="fileLabel">
                            <img src={avatar.url || "./avatar.png"} alt="Avatar" />
                            Avatar
                        </label>
                        <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
                        <input type="text" placeholder="Usuário" name="username" required />
                        <input type="email" placeholder="E-mail" name="email" required />
                        <input type="password" placeholder="Senha" name="senha" required />
                        <select id="userRole" value={role} onChange={handleRoleChange} required>
                            <option value="default" disabled>Selecione uma função</option>
                            <option value="admin">Admin</option>
                            <option value="gestor">Gestor</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="operador">Operador</option>
                        </select>
                        <button type="submit" disabled={loading}>{loading ? "Processando..." : "Cadastrar"}</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddUsuario;
