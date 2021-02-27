import firebase from "firebase/app";
import { atom, useRecoilState } from "recoil";
import { User } from "../models/User";
import { useEffect } from "react";

const userState = atom<User>({
  key: "user",
  default: null,
});

export const useAuthentication = () => {
  const [user, setUser] = useRecoilState(userState);

  useEffect(() => {
    if (user !== null) {
      return;
    }

    firebase
      .auth()
      .signInAnonymously()
      .catch((error) => console.error(error));
    firebase.auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const loginUser: User = {
          uid: firebaseUser.uid,
          isAnonymous: firebaseUser.isAnonymous,
          name: "",
        };
        setUser(loginUser);
        createUserIfNotFound(loginUser);
      } else {
        setUser(null);
      }
    });
  }, []);

  return { user };
};

export const createUserIfNotFound = async (user: User) => {
  const userRef = firebase.firestore().collection("users").doc(user.uid);
  const doc = await userRef.get();
  if (doc.exists) {
    // 書き込みの方が高いので！
    return;
  }

  await userRef.set({
    name: "taro" + new Date().getTime(),
  });
};
