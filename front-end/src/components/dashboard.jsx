import Header from "./Header";
import Footer from "./Footer";
import { getbeneficiaries,finduserbyaccount,findbeneficiarieByid} from "../data/database";
import { use, useState } from "react";
export default function Dashboard({user,setUser}){
    const beneficiaries=getbeneficiaries(user.id);
    const[showTransfer,setShowTransfer]=useState(false);{/*popu up transfer fermer au debut*/}
    const[showTopup,setShowTopup]=useState(false);{/*popup recharge fermer*/}
    const[beneficiaryId,setBeneficiaryId]= useState(beneficiaries[0].id );
    const[sourceCard,setSourcecard]=useState(user.wallet.cards[0]?.numcards || "");
    const[amount,setAmount]=useState("");
    const[topupCard,setTopupCard]=useState(user.wallet.cards[0]?.numcards || "");{/*carte choisie*/}
    const[topupAmount,setTopupAmount]=useState("");{/* monatnt qu'on veux recharger dans notre compte*/}
    const [loading,setLoading]=useState(false);
    const Ctransactions=user.wallet.transactions.filter((t)=> (t.type==='credit' || t.type==='recharge') && t.status==="validee");
    const monthlyIncome=Ctransactions.reduce((acc,curr)=>acc+ curr.amount,0);
    const Dtransactions=user.wallet.transactions.filter((t)=>t.type==='debit');
    const monthlyExpenses=Dtransactions.reduce((acc,curr)=>acc+ curr.amount,0);
    
    function checkUser(numcompte){
        return new Promise((resolve,reject)=>{
            setTimeout(()=>{
                const b=finduserbyaccount(numcompte);
                b? resolve(b):reject("destinataire introuvable");
            
            },5000);
        });

    }
    function checkSolde(user,amount){
        return new Promise((resolve,reject)=>{
            user.wallet.balance>=amount ? resolve():reject("Solde insuffisant");
        })
    }
    function updateSolde(exp,dest,amount){
        exp.wallet.balance-=amount;
        dest.wallet.balance+=amount;
    }
    function addTransaction(exp,dest,amount){
        exp.wallet.transactions.push({
            id:Date.now(),
            type:"debit",
            amount:amount,
            date: new Date().toLocaleString(),
            to: dest.name
        });
        dest.wallet.transactions.push({
          id:Date.now(),
            type:"credit",
            amount:amount,
            date: new Date().toLocaleString(),
            from: exp.name   
        });
    }
    async function handleTransfer(e){
        e.preventDefault();
        
        setLoading(true);
        try{
            {/*const account=findbeneficiarieByid(user.id,beneficiaryId).account;*/}
            const beneficiary = findbeneficiarieByid(user.id, beneficiaryId);

            if (!beneficiary) {
            alert("Bénéficiaire introuvable");
            return;
            }

            const account = beneficiary.account;
            const dest= await checkUser(account);
            await checkSolde(user,amount);
            updateSolde(user,dest,amount);
            addTransaction(user,dest,amount);
            setUser({ ...user});
            setShowTransfer(false);
            alert("virement reussii");
        }catch(err){
            alert(err);
        }
        setLoading(false);
    }
    function validateAmount(amount) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
            if (!amount || amount <= 0) {
                reject("montant invalide");
            } else if (amount < 10 || amount > 5000) {
                reject("montant doit etre entre 10 et 5000 MAD");
            } else {
                resolve();
            }
            }, 300);
        });
    }
    function validateCard(user, cardNumber) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
            const card = user.wallet.cards.find(
                (c) => c.numcards === cardNumber
            );

            if (!card) return reject("carte introuvable");

            const today = new Date();
            const expiryDate = new Date(card.expiry);

            if (expiryDate < today) {
                reject("carte expirée");
            } else {
                resolve(card);
            }
            }, 300);
        });
    }
    function updateBalances(user, card, amount) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
            if (card.balance < amount) {
                reject("solde insuffisant sur la carte");
            } else {
                card.balance -= amount;
                user.wallet.balance += amount;
                resolve();
            }
            }, 300);
        });
    }
    function addTopupTransaction(user, amount, card, status) {
        return new Promise((resolve) => {
            setTimeout(() => {
            user.wallet.transactions.push({
                id: Date.now(),
                type: "recharge",
                amount:amount,
                date: new Date().toLocaleString(),
                from: card.numcards,
                status:status
            });

            resolve();
            }, 200);
        });
    }
    async function handleTopup(e) {
        e.preventDefault();

        setLoading(true);

        try {
            await validateAmount(Number(topupAmount));

            const card = await validateCard(user, topupCard);

            await updateBalances(user, card, Number(topupAmount));

            await addTopupTransaction(user, Number(topupAmount), card, "validee");

            setUser({ ...user }); // refresh UI

            alert("rechargement réussi");
            setShowTopup(false);
        } catch (err) {
            alert("erreur: " + err);
        }

        setLoading(false);
    }

   return(
     <>
        <Header/>
            <main className="dashboard-main">
                <div className="dashboard-container">
                
                <aside className="dashboard-sidebar">
                    <nav className="sidebar-nav">
                    <ul>
                        <li className="active">
                        <a href="#overview">
                            <i className="fas fa-home"></i>
                            <span>Vue d'ensemble</span>
                        </a>
                        </li>
                        <li>
                        <a href="#transactions">
                            <i className="fas fa-exchange-alt"></i>
                            <span>Transactions</span>
                        </a>
                        </li>
                        <li>
                        <a href="#cards">
                            <i className="fas fa-credit-card"></i>
                            <span>Mes cartes</span>
                        </a>
                        </li>
                        <li>
                        <a href="#transfers">
                            <i className="fas fa-paper-plane"></i>
                            <span>Transferts</span>
                        </a>
                        </li>
                        <li className="separator"></li>
                        <li>
                        <a href="#support">
                            <i className="fas fa-headset"></i>
                            <span>Aide & Support</span>
                        </a>
                        </li>
                    </ul>
                    </nav>
                </aside>

                <div className="dashboard-content">
                    
                    <section id="overview" className="dashboard-section active">
                    <div className="section-header">
                        <h2>Bonjour, <span id="greetingName">{user.name}</span> !</h2>
                        <p className="date-display" id="currentDate"></p>
                    </div>

                    <div className="summary-cards">
                        <div className="summary-card">
                        <div className="card-icon blue">
                            <i className="fas fa-wallet"></i>
                        </div>
                        <div className="card-details">
                            <span className="card-label">Solde disponible</span>
                            <span className="card-value" id="availableBalance">{user.wallet.balance}</span>
                        </div>
                        </div>

                        <div className="summary-card">
                        <div className="card-icon green">
                            <i className="fas fa-arrow-up"></i>
                        </div>
                        <div className="card-details">
                            <span className="card-label">Revenus</span>
                            <span className="card-value" id="monthlyIncome">{monthlyIncome}</span>
                        </div>
                        </div>

                        <div className="summary-card">
                        <div className="card-icon red">
                            <i className="fas fa-arrow-down"></i>
                        </div>
                        <div className="card-details">
                            <span className="card-label">Dépenses</span>
                            <span className="card-value" id="monthlyExpenses">{monthlyExpenses}</span>
                        </div>
                        </div>

                        <div className="summary-card">
                        <div className="card-icon purple">
                            <i className="fas fa-credit-card"></i>
                        </div>
                        <div className="card-details">
                            <span className="card-label">Cartes actives</span>
                            <span className="card-value" id="activeCards">{user.wallet.cards.length}</span>
                        </div>
                        </div>
                    </div>

                    <div className="quick-actions">
                        <h3>Actions rapides</h3>
                        <div className="action-buttons">
                        <button className="action-btn" id="quickTransfer" onClick={()=>setShowTransfer(true)} type="button">
                            <i className="fas fa-paper-plane"></i>
                            <span>Transférer</span>
                        </button>
                        <button className="action-btn" id="quickTopup" type="button" onClick={()=>setShowTopup(true)}>
                            <i className="fas fa-plus-circle"></i>
                            <span>Recharger</span>
                        </button>
                        <button className="action-btn" id="quickRequest" type="button">
                            <i className="fas fa-hand-holding-usd"></i>
                            <span>Demander</span>
                        </button>
                        </div>
                    </div>
                    
                    <div className="recent-transactions">
                        <div className="section-header">
                        <h3>Transactions récentes</h3>
                        </div>
                        <div className="transactions-list" id="recentTransactionsList">
                            {user.wallet.transactions.slice(-5).reverse().map((t)=>(
                                <div key={t.id}>
                                    {t.date}| {t.type}| {t.amount}
                                </div>
                            ))}
                            
                        </div>
                    </div>
                    </section>

                    <section id="cards" className="dashboard-section">
                    <div className="section-header">
                        <h2>Mes cartes</h2>
                        <button className="btn btn-secondary" id="addCardBtn" type="button">
                        <i className="fas fa-plus"></i> Ajouter une carte
                        </button>
                    </div>
                    
                    <div className="cards-grid" id="cardsGrid">
                        <div className="card-item">
                        <div className="card-preview visa">
                            <div className="card-chip"></div>
                            <div className="card-number">?</div>
                            <div className="card-holder">?</div>
                            <div className="card-expiry">?</div>
                            <div className="card-type">?</div>
                        </div>
                        <div className="card-actions">
                            <button className="card-action" title="Définir par défaut" type="button">
                            <i className="fas fa-star"></i>
                            </button>
                            <button className="card-action" title="Geler la carte" type="button">
                            <i className="fas fa-snowflake"></i>
                            </button>
                            <button className="card-action" title="Supprimer" type="button">
                            <i className="fas fa-trash"></i>
                            </button>
                        </div>
                        </div>
                    </div>
                </section>
                </div>
         </div>
    </main>
   {showTransfer && (
  <div className="modal-overlay">
    <div className="transfer-section">

      <div className="section-header">
        <h2>Transférer</h2>

        <button
          className="btn-close"
          onClick={() => setShowTransfer(false)}
        >
          ✕
        </button>
      </div>

      <form className="transfer-form" onSubmit={handleTransfer}>

        <div className="form-group">
          <label>Bénéficiaire</label>
          <select
            value={beneficiaryId}
            onChange={(e) => setBeneficiaryId(e.target.value)}
          >
            {beneficiaries.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Depuis ma carte</label>
          <select
            value={sourceCard}
            onChange={(e) => setSourcecard(e.target.value)}
          >
            {user.wallet.cards.map(c => (
              <option key={c.numcards} value={c.numcards}>
                {c.type} **** {c.numcards}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Montant</label>

          <div className="amount-input">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="0.00"
            />
            <span className="currency">MAD</span>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowTransfer(false)}
          >
            Annuler
          </button>

          <button type="submit" className="btn btn-primary">
            {loading ? "Loading..." : "Transférer"}
          </button>
        </div>

      </form>
    </div>
  </div>
)}
    {showTopup && (
  <div className="modal-overlay">
    <div className="transfer-section">

      <div className="section-header">
        <h2>Recharger</h2>

        <button
          className="btn-close"
          onClick={() => setShowTopup(false)}
        >
          ✕
        </button>
      </div>

      <form className="transfer-form" onSubmit={handleTopup}>

        <div className="form-group">
          <label>Carte</label>
          <select
            value={topupCard}
            onChange={(e) => setTopupCard(e.target.value)}
          >
            {user.wallet.cards.map(c => (
              <option key={c.numcards} value={c.numcards}>
                {c.type} **** {c.numcards}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Montant</label>

          <div className="amount-input">
            <input
              type="number"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="0.00"
            />
            <span className="currency">MAD</span>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowTopup(false)}
          >
            Annuler
          </button>

          <button type="submit" className="btn btn-primary">
            {loading ? "Loading..." : "Recharger"}
          </button>
        </div>

      </form>
    </div>
  </div>
)}

    <Footer/>
  
    
    
    
    
    
    
    
    
    </>
   )
}