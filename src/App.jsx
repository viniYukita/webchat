import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import List from "./components/list/List";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import Login from "./components/login/Login";
import Cadastro from "./components/login/Cadastro";
import Notification from "./components/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();
  const [isVisible, setIsVisible] = useState(false);

  const toggleDetailVisibility = () => {
    setIsVisible(!isVisible);
  };

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });
    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  if (isLoading) return <div className="loading">Carregando...</div>;

  return (
    <Router>
      <div className="container">
        {currentUser ? (
          <>
            <Routes>
              <Route path="/" element={<List />} />
              <Route path="/cadastro" element={<Cadastro />} />
              {/* Adicione outras rotas conforme necessário */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            {chatId && <Chat isDetailVisible={isVisible} onToggleDetail={toggleDetailVisibility} />}
            {isVisible && <Detail />}
          </>
        ) : (
          <Login />
        )}
        <Notification />
      </div>
    </Router>
  );
};

export default App;
