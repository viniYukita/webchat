import React from "react";
import { Route, BrowserRouter } from "react-router-dom";

import Cadastro from "../components/login/Cadastro";
import Login from "../components/login/Login"

const Routes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route component={Cadastro} path="/cadastro" />
                <Route component={Login} path="/login" />
            </Routes>
        </BrowserRouter>
    )
}

export default Routes;