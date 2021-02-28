import { useEffect, useRef, useState } from "react";
import firebase from "firebase/app";
import { Question } from "../../models/Question";
import Layout from "../../components/Layout";
import { useAuthentication } from "../../hooks/authentication";
import dayjs from "dayjs";

export default function QuestionsReceived() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPaginationFinished, setIsPaginationFinished] = useState(false);
  const { user } = useAuthentication();
  const scrollContainerRef = useRef(null);

  function createBaseQuery() {
    return firebase
      .firestore()
      .collection("questions")
      .where("receiverUid", "==", user.uid)
      .orderBy("createdAt", "desc")
      .limit(10);
  }

  function appendQuestions(
    snapshot: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>
  ) {
    const gotQuestions = snapshot.docs.map((doc) => {
      const question = doc.data() as Question;
      question.id = doc.id;
      return question;
    });
    setQuestions(questions.concat(gotQuestions));
  }

  async function loadQuestions() {
    const snapshot = await createBaseQuery().get();

    if (snapshot.empty) {
      setIsPaginationFinished(true);
      return;
    }

    appendQuestions(snapshot);
  }

  async function loadNextQuestions() {
    if (questions.length === 0) {
      return;
    }

    const lastQuestion = questions[questions.length - 1];
    const snapshot = await createBaseQuery()
      .startAfter(lastQuestion.createdAt)
      .get();

    if (snapshot.empty) {
      return;
    }

    appendQuestions(snapshot);
  }

  useEffect(() => {
    if (!process.browser) {
      return;
    }
    if (user === null) {
      return;
    }

    loadQuestions();
  }, [process.browser, user]);

  function onScroll() {
    if (isPaginationFinished) {
      return;
    }

    const container = scrollContainerRef.current;
    if (container === null) {
      return;
    }

    const rect = container.getBoundingClientRect();
    if (rect.top + rect.height > window.innerHeight) {
      return;
    }

    loadNextQuestions();
  }

  useEffect(() => {
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [questions, scrollContainerRef.current, isPaginationFinished]);

  return (
    <Layout>
      <h1 className="h4">受け取った質問一覧</h1>

      <div className="row justify-content-center">
        <div className="col-12 col-md-6" ref={scrollContainerRef}>
          {questions.map((question) => (
            <div className="card my-3" key={question.id}>
              <div className="card-body">
                <div className="text-truncate">{question.body}</div>
              </div>
              <div className="text-muted text-end">
                <small>
                  {dayjs(question.createdAt.toDate()).format(
                    "YYYY/MM/DD HH:mm"
                  )}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
