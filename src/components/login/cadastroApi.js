import express, { json } from 'express';
import { initializeApp, credential as _credential, auth, firestore } from 'firebase-admin';
const app = express();

// Inicialize o Firebase Admin SDK
initializeApp({
  credential: _credential.cert(require('import.meta.env.VITE_API_KEY')),
  databaseURL: 'https://your-database-name.firebaseio.com'
});

// Middleware para parsing do body das requisições
app.use(json());

app.post('/createUser', async (req, res) => {
  const { email, password, username, role, avatar } = req.body;

  try {
    // Cria o usuário no Firebase Authentication
    const userRecord = await auth().createUser({
      email,
      password,
      displayName: username,
    });

    // Adiciona informações adicionais no Firestore
    await firestore().collection('users').doc(userRecord.uid).set({
      username,
      email,
      role,
      avatar,
      id: userRecord.uid,
      isDeleted: false,
      blocked: []
    });

    res.status(200).send({ message: 'Usuário criado com sucesso!' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
