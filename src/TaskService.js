import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyBLSzig6bSHxamqFjk_6jxYYomKcz4OJSW",
	authDomain: "task-manager-uni.firebaseapp.com",
	projectId: "task-manager-uni",
	storageBucket: "task-manager-uni.firebasestorage.app",
	messagingSenderId: "679993567838",
	appId: "1:679993567838:web:a1883334c34df3c13be2cf"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class TaskDatabaseService {
	constructor() {
		this.collectionRef = collection(db, "tasks");
	}

	async getTasks() {
		const data = await getDocs(this.collectionRef);
		return data.docs.map(doc => ({ id: doc.id, ...doc.data() }));
	}

	async addTask(taskData) {
		const docRef = await addDoc(this.collectionRef, taskData);
		return { id: docRef.id, ...taskData };
	}

	async toggleTask(id, currentStatus) {
		const taskDoc = doc(db, "tasks", id);
		await updateDoc(taskDoc, { completed: !currentStatus });
	}

	async deleteTask(id) {
		const taskDoc = doc(db, "tasks", id);
		await deleteDoc(taskDoc);
	}
}

export const taskService = new TaskDatabaseService();