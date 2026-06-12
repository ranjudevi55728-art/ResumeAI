import { db, handleFirestoreError } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import type { Resume, CoverLetter } from "./types";

export async function saveResume(resume: Resume): Promise<void> {
  try {
    const docRef = doc(db, "resumes", resume.id);
    await setDoc(docRef, resume);
  } catch (error) {
    handleFirestoreError(error, "saveResume", `resumes/${resume.id}`);
  }
}

export async function getResumes(userId: string): Promise<Resume[]> {
  try {
    const colRef = collection(db, "resumes");
    const q = query(
      colRef,
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const resumes: Resume[] = [];
    querySnapshot.forEach((d) => {
      resumes.push(d.data() as Resume);
    });
    return resumes;
  } catch (error) {
    handleFirestoreError(error, "getResumes", "resumes");
  }
}

export async function getResume(resumeId: string): Promise<Resume | null> {
  try {
    const docRef = doc(db, "resumes", resumeId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Resume;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, "getResume", `resumes/${resumeId}`);
  }
}

export async function deleteResume(resumeId: string): Promise<void> {
  try {
    const docRef = doc(db, "resumes", resumeId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, "deleteResume", `resumes/${resumeId}`);
  }
}

export async function saveCoverLetter(letter: CoverLetter): Promise<void> {
  try {
    const docRef = doc(db, "coverLetters", letter.id);
    await setDoc(docRef, letter);
  } catch (error) {
    handleFirestoreError(error, "saveCoverLetter", `coverLetters/${letter.id}`);
  }
}

export async function getCoverLetters(userId: string): Promise<CoverLetter[]> {
  try {
    const colRef = collection(db, "coverLetters");
    const q = query(
      colRef,
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const letters: CoverLetter[] = [];
    querySnapshot.forEach((d) => {
      letters.push(d.data() as CoverLetter);
    });
    return letters;
  } catch (error) {
    handleFirestoreError(error, "getCoverLetters", "coverLetters");
  }
}

export async function deleteCoverLetter(letterId: string): Promise<void> {
  try {
    const docRef = doc(db, "coverLetters", letterId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, "deleteCoverLetter", `coverLetters/${letterId}`);
  }
}
