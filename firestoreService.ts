import { Timestamp, DocumentReference, DocumentData } from 'firebase/firestore';

export class FirestoreService {
    // Other methods and properties here

    async getDocument(docRef: DocumentReference<DocumentData>): Promise<Timestamp> {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return data.timestampField as Timestamp; // Updated to use Timestamp type
        } else {
            throw new Error('No such document!');
        }
    }
}
