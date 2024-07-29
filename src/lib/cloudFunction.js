const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true}); // Habilitar CORS
admin.initializeApp();

exports.createUser = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        const { email, password, username, role, avatarUrl } = req.body;

        try {
            const userRecord = await admin.auth().createUser({
                email,
                password,
                displayName: username,
            });

            await admin.firestore().collection("users").doc(userRecord.uid).set({
                username,
                email,
                avatar: avatarUrl,
                role,
                id: userRecord.uid,
                isDeleted: false,
                blocked: [],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            res.status(200).send({ message: "User created successfully", userId: userRecord.uid });
        } catch (error) {
            console.error("Error creating new user:", error);
            res.status(500).send({ error: error.message });
        }
    });
});
