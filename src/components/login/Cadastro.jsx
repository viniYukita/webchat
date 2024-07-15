import { useState } from 'react';

const Cadastro = () => {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    });

    const [loading, setLoading] = useState(false)

    const handleCadastro = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const { username, email, senha } = Object.fromEntries(formData);

        try {
            const response = await createUserWithEmailAndPassword(auth, email, senha);
            const imgUrl = await upload(avatar.file)

            await setDoc(doc(db, "users", response.user.uid), {
                username,
                email,
                avatar: imgUrl,
                id: response.user.uid,
                blocked: []
            });

            await setDoc(doc(db, "userchats", response.user.uid), {
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

    const handleAvatar = e => {
        if (e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            })
        }
    }

    return (
        <div className='cadastro'>
            <div className="separator"></div>
            <div className="item">
                <h2>Criar uma conta</h2>
                <form onSubmit={handleCadastro}>
                    <label htmlFor="file">
                        <img src={avatar.url || "./avatar.png"} alt="" />
                        Avatar
                    </label>
                    <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
                    <input type="text" placeholder="Usuário" name="username" />
                    <input type="text" placeholder="E-mail" name="email" />
                    <input type="password" placeholder="Senha" name="senha" />
                    <button disabled={loading}> {loading ? "Cadastrando" : "Cadastrar"} </button>
                </form>
            </div>
        </div>
    )
}

export default Cadastro;