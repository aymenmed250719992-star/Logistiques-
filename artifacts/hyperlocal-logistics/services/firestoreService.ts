import { Timestamp, getDoc } from 'firebase/firestore';

// ...rest of the code

// Example for your usage

interface CourierLocation {
  // ...other properties
  timestamp: Timestamp; // Changed to Timestamp
}

// ...rest of the code

const serviceFunction = async () => {
  const docRef = ...; // your document reference here
  const docSnap = await getDoc(docRef); // use imported getDoc
  // ...rest of the code
}
