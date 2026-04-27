import { useState } from "react";
import Index from "./components/index";
import './App.css'
import Login from "./components/login";
import Dashboard from "./components/dashboard";
import { finduserbymail } from "./data/database";


function App(){
  const [showLogin,setShowLogin]=useState(false);
  const [user,setUser]=useState(finduserbymail("Ali@example.com","1232"));
  if(user) return <Dashboard user={user} setUser={setUser}/>;
  if(showLogin) return <Login user={user} setUser={setUser}/>;
  return <Index setShowLogin={setShowLogin}/>;
  
}
export default App