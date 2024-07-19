import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

const upload = async (file) => {
    const date = new Date().toISOString(); // Ensure the date is in a proper format

    const storageRef = ref(storage, `images/${date}-${file.name}`);
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
                        reject("Error: You don't have permission to access the object");
                        break;

                    case 'storage/canceled':
                        reject("Error: User canceled the upload");
                        break;

                    case 'storage/unknown':
                        reject("Error: Unknown error occurred, inspect error.serverResponse");
                        break;

                    default:
                        reject("Error: " + error.message);
                        break;
                }
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    resolve(downloadURL);
                });
            }
        );
    });
};

export default upload;
