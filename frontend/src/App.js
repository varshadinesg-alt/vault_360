import React, { useState, useEffect } from 'react';
import { db, auth, provider, signInWithPopup, signOut } from './firebase'; 
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function App() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]); 
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => setUser(u));
    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const qSales = query(collection(db, "sales"), orderBy("timestamp", "desc"), limit(50));
    const unsubSales = onSnapshot(qSales, (snap) => {
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubscribeAuth(); unsubProducts(); unsubSales(); };
  }, []);

  // --- BUSINESS LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Vault Access Denied: Admin Login Required");
    try {
      const productData = { name, price: Number(price), stock: Number(stock) };
      if (isEditing && editId) {
        await updateDoc(doc(db, "products", editId), productData);
        setIsEditing(false); setEditId(null);
      } else {
        await addDoc(collection(db, "products"), productData);
      }
      setName(''); setPrice(''); setStock('');
    } catch (err) { alert("Action failed"); }
  };

  const generatePDF = async () => {
    if (!customerName || cart.length === 0) return alert("Check Customer Name/Cart");
    const totalAmount = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
    try {
      for (const item of cart) {
        const pRef = doc(db, "products", item.id);
        const pData = products.find(p => p.id === item.id);
        if (pData) await updateDoc(pRef, { stock: Math.max(0, Number(pData.stock) - item.qty) });
      }
      await addDoc(collection(db, "sales"), {
        customer: customerName,
        amount: totalAmount,
        itemCount: cart.length,
        timestamp: serverTimestamp()
      });
      const docPDF = new jsPDF();
      docPDF.setFontSize(18);
      docPDF.text("VAULT 360 OFFICIAL INVOICE", 105, 20, { align: "center" });
      const tableData = cart.map(i => [i.name, i.qty, `INR ${i.price}`, `INR ${Number(i.price) * i.qty}`]);
      autoTable(docPDF, { head: [['Asset', 'Qty', 'Unit Val', 'Subtotal']], body: tableData, startY: 50, theme: 'grid', headStyles: { fillColor: [30, 41, 59] } });
      docPDF.save(`Vault_Invoice_${customerName}.pdf`);
      setCart([]); setCustomerName('');
      alert("Transaction secured & stock updated!");
    } catch (err) { alert("Security Error: " + err.message); }
  };

  // --- STATS ---
  const totalValuation = products.reduce((sum, p) => sum + (Number(p.price) * (Number(p.stock) || 0)), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.amount), 0);
  const lowStockCount = products.filter(p => p.stock < 10).length;
  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans text-slate-900">
      <nav className="bg-slate-900 text-white p-6 flex justify-between items-center sticky top-0 z-50 border-b border-slate-700">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-black tracking-tighter">V3</div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Vault <span className="text-indigo-400">360</span></h1>
        </div>
        <div className="flex gap-8 font-bold text-[10px] uppercase tracking-[0.2em]">
          <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-indigo-400' : 'hover:text-indigo-400'}>Dashboard</button>
          <button onClick={() => setActiveTab('inventory')} className={activeTab === 'inventory' ? 'text-indigo-400' : 'hover:text-indigo-400'}>Assets</button>
          <button onClick={() => setActiveTab('billing')} className={activeTab === 'billing' ? 'text-indigo-400' : 'hover:text-indigo-400'}>Terminal</button>
          {user ? <button onClick={() => signOut(auth)} className="text-red-400">Exit Vault</button> : <button onClick={() => signInWithPopup(auth, provider)} className="bg-indigo-600 px-6 py-2 rounded-md hover:bg-indigo-500">Admin Login</button>}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-10">
        
        {activeTab === 'home' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-slate-900 p-16 rounded-[2.5rem] text-white shadow-2xl relative border border-slate-800">
              <div className="relative z-10">
                <h2 className="text-indigo-400 font-bold mb-2 uppercase tracking-widest text-xs">Security Status: Active</h2>
                <h3 className="text-6xl font-black tracking-tighter mb-10 uppercase">System Overview</h3>
                {user ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Vault Net Asset Value</p>
                            <p className="text-5xl font-black">₹{totalValuation.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Realized Revenue</p>
                            <p className="text-5xl font-black text-indigo-400">₹{totalRevenue.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                ) : <p className="text-slate-500 font-bold italic">Authenticated access required for financial telemetry.</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inventory Depth</p>
                    <p className="text-5xl font-black">{products.length} SKUs</p>
                </div>
                <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Sales</p>
                    <p className="text-5xl font-black text-indigo-600">{sales.length}</p>
                </div>
                <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Stock Alerts</p>
                    <p className={`text-5xl font-black ${lowStockCount > 0 ? 'text-orange-500' : 'text-green-500'}`}>{lowStockCount}</p>
                </div>
            </div>

            {user && (
              <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-200">
                <h4 className="text-xl font-black mb-8 uppercase tracking-tighter text-slate-400">Audit Log: Recent Sales</h4>
                <div className="space-y-3">
                    {sales.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-300 transition-all">
                            <div>
                                <p className="font-black text-slate-800 uppercase tracking-tight">{s.customer}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.timestamp?.toDate().toLocaleString()}</p>
                            </div>
                            <p className="text-2xl font-black text-slate-900">₹{s.amount.toLocaleString('en-IN')}</p>
                        </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- ASSETS TAB (INVENTORY) --- */}
        {activeTab === 'inventory' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex gap-4">
               <input className="flex-1 p-6 rounded-2xl bg-white shadow-sm border border-slate-200 outline-none font-bold text-lg" placeholder="SEARCH VAULT ASSETS..." onChange={e => setSearchTerm(e.target.value)} />
               {user && <button onClick={() => {
                   const docPDF = new jsPDF();
                   docPDF.text("VAULT ASSET REPORT", 105, 20, { align: "center" });
                   const data = products.map(p => [p.name, p.price, p.stock, (Number(p.price) * Number(p.stock))]);
                   autoTable(docPDF, { startY: 30, head: [['Asset Name', 'Unit Val', 'Quantity', 'Net Value']], body: data, theme: 'striped' });
                   docPDF.save('Asset_Inventory.pdf');
               }} className="bg-slate-900 text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest">Master Report</button>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {user && (
                <div className="lg:col-span-4">
                  <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200 sticky top-32">
                    <h3 className="text-xl font-black mb-8 uppercase tracking-widest text-indigo-600">{isEditing ? 'Modify' : 'Deposit'} Asset</h3>
                    <div className="space-y-4">
                      <input className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none" placeholder="Asset Name" value={name} onChange={e => setName(e.target.value)} required />
                      <input className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none" placeholder="Unit Price" value={price} onChange={e => setPrice(e.target.value)} required />
                      <input className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none" placeholder="Stock Quantity" value={stock} onChange={e => setStock(e.target.value)} required />
                      <button className="w-full bg-slate-900 text-white p-4 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">Submit to Ledger</button>
                    </div>
                  </form>
                </div>
              )}
              
              <div className={user ? "lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6" : "lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6"}>
                {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                  <div key={p.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 transition-all hover:border-indigo-400 group">
                    <h4 className="text-lg font-black text-slate-400 uppercase tracking-tighter group-hover:text-indigo-600">{p.name}</h4>
                    <p className="text-4xl font-black text-slate-900 mt-1">₹{Number(p.price).toLocaleString('en-IN')}</p>
                    <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Available Units</span>
                            <span className={p.stock < 10 ? 'text-orange-600' : ''}>{p.stock}</span>
                        </div>
                        <p className="text-xl font-black text-slate-900 mt-1">₹{(Number(p.price) * Number(p.stock)).toLocaleString('en-IN')}</p>
                    </div>
                    {user && (
                      <div className="flex gap-6 mt-6 pt-4 border-t border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <button onClick={() => { setIsEditing(true); setEditId(p.id); setName(p.name); setPrice(p.price); setStock(p.stock); }} className="hover:text-indigo-600">Edit</button>
                        <button onClick={() => deleteDoc(doc(db, "products", p.id))} className="hover:text-red-600">Liquidate</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TERMINAL TAB (BILLING) --- */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(p => (
                <button key={p.id} onClick={() => {
                    if(!user) return alert("Terminal Locked: Login Required");
                    if(p.stock <= 0) return alert("Asset Depleted");
                    const ex = cart.find(c => c.id === p.id);
                    if(ex) setCart(cart.map(c => c.id === p.id ? {...c, qty: Math.min(p.stock, c.qty + 1)} : c));
                    else setCart([...cart, {...p, qty: 1}]);
                }} className="bg-white p-8 rounded-[2rem] border border-slate-200 text-left transition-all hover:border-indigo-600 active:scale-95 shadow-sm group">
                  <h4 className="font-black text-slate-400 uppercase text-xs group-hover:text-indigo-600 tracking-widest">{p.name}</h4>
                  <p className="text-3xl font-black text-slate-900 mt-1">₹{Number(p.price).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 italic">Ledger: {p.stock} Units</p>
                </button>
              ))}
            </div>

            <div className={`lg:col-span-5 p-10 rounded-[3rem] shadow-2xl h-fit sticky top-32 ${user ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>
                <h3 className="text-2xl font-black mb-8 uppercase tracking-widest italic text-indigo-400 underline underline-offset-8">Transaction Hub</h3>
                {user ? (
                    <>
                        <input className="w-full p-4 bg-slate-800 rounded-xl mb-6 text-white font-bold outline-none border border-slate-700" placeholder="Client Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                        <div className="space-y-3 max-h-60 overflow-y-auto mb-8 pr-2">
                            {cart.map(i => (
                                <div key={i.id} className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <p className="font-black uppercase text-xs tracking-tight">{i.name} [x{i.qty}]</p>
                                    <p className="font-black text-indigo-400">₹{Number(i.price)*i.qty}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center mb-8 pt-6 border-t border-slate-800">
                            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Net Payable</span>
                            <span className="text-4xl font-black text-indigo-400 tracking-tighter">₹{cartTotal.toLocaleString('en-IN')}</span>
                        </div>
                        <button onClick={generatePDF} className="w-full bg-indigo-600 p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all">Secure Invoice</button>
                    </>
                ) : <p className="text-center font-black py-10 uppercase tracking-widest text-slate-400 animate-pulse">Terminal Offline</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;