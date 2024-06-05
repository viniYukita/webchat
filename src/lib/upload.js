import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

const upload = async (file) => {

    const date = new Date()

    const storageRef = ref(storage, `images/${date + file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            },
            (error) => {
                switch (error.code) {
                    case 'storage/unauthorized':
                        reject("Erro, você não tem permissão")
                        break;

                    case 'storage/unknown':
                        reject ("Algo deu errado")
                        break;
                }
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    resolve(downloadURL)
                });
            }
        );
    });

};

export default upload