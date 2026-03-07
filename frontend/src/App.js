import React, { useState, useEffect, useMemo } from 'react';
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
  
  // Form States
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
    const qSales = query(collection(db, "sales"), orderBy("timestamp", "desc"), limit(20));
    const unsubSales = onSnapshot(qSales, (snap) => {
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubscribeAuth(); unsubProducts(); unsubSales(); };
  }, []);

  // --- CALCULATIONS ---
  const totalValuation = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.price) * Number(p.stock) || 0), 0);
  }, [products]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- HANDLERS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Access Denied");
    try {
      const productData = { name, price: Number(price), stock: Number(stock) };
      if (isEditing && editId) {
        await updateDoc(doc(db, "products", editId), productData);
        setIsEditing(false); setEditId(null);
      } else {
        await addDoc(collection(db, "products"), productData);
      }
      setName(''); setPrice(''); setStock('');
    } catch (err) { console.error(err); }
  };

  const generatePDF = async () => {
    if (!customerName || cart.length === 0) return alert("Details missing");
    const totalAmount = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
    try {
      for (const item of cart) {
        const pRef = doc(db, "products", item.id);
        const currentP = products.find(p => p.id === item.id);
        await updateDoc(pRef, { stock: currentP.stock - item.qty });
      }
      await addDoc(collection(db, "sales"), {
        customer: customerName,
        amount: totalAmount,
        timestamp: serverTimestamp()
      });
      const docPDF = new jsPDF();
      docPDF.text("VAULT 360 INVOICE", 105, 20, { align: "center" });
      autoTable(docPDF, { head: [['Asset', 'Qty', 'Total']], body: cart.map(i => [i.name, i.qty, i.price * i.qty]), startY: 35 });
      docPDF.save(`Invoice_${customerName}.pdf`);
      setCart([]); setCustomerName('');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* NAVIGATION */}
      <nav className="bg-slate-900 text-white p-6 flex justify-between items-center sticky top-0 z-50 shadow-xl">
        <h1 className="text-xl font-black uppercase tracking-tighter">Vault <span className="text-indigo-400">360</span></h1>
        <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
          <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-indigo-400' : ''}>Dashboard</button>
          <button onClick={() => setActiveTab('inventory')} className={activeTab === 'inventory' ? 'text-indigo-400' : ''}>Inventory</button>
          <button onClick={() => setActiveTab('billing')} className={activeTab === 'billing' ? 'text-indigo-400' : ''}>Terminal</button>
          {user ? <button onClick={() => signOut(auth)} className="text-red-400">Logout</button> : <button onClick={() => signInWithPopup(auth, provider)} className="bg-indigo-600 px-4 py-2 rounded">Login</button>}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-10">
        {/* DASHBOARD TAB */}
        {activeTab === 'home' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Total Net Valuation</p>
                <h2 className="text-3xl font-black text-slate-900">₹{totalValuation.toLocaleString('en-IN')}</h2>
              </div>
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Critical Stock Assets</p>
                <h2 className="text-3xl font-black text-orange-500">{products.filter(p => p.stock < 10).length}</h2>
              </div>
            </div>
            {/* REVENUE TELEMETRY CHART */}
<div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 mt-10">
  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10">
    Revenue Telemetry (Last 10 Sales)
  </h4>
  
  {/* The Flex Container for the Bars */}
  <div className="flex items-end justify-between h-48 gap-3 px-2">
    {sales.length > 0 ? (
      sales.slice(0, 10).reverse().map((s, i) => {
        // Calculate percentage height based on max sale amount
        const maxSale = Math.max(...sales.map(x => Number(x.amount) || 1));
        const heightPercentage = ((Number(s.amount) || 0) / maxSale) * 100;
        
        return (
          <div 
            key={i} 
            className="flex-1 bg-indigo-500/20 hover:bg-indigo-600 transition-all rounded-t-lg relative group cursor-pointer"
            style={{ height: `${Math.max(heightPercentage, 5)}%` }} // Minimum 5% height for visibility
          >
            {/* Tooltip on Hover */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              ₹{Number(s.amount).toLocaleString()}
            </div>
            
            {/* Customer Label at bottom */}
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[7px] text-slate-400 font-bold uppercase truncate w-full text-center">
              {s.customer?.split(' ')[0]}
            </span>
          </div>
        );
      })
    ) : (
      <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Sales Data Available</p>
      </div>
    )}
  </div>
</div>
            {/* AUDIT LOG */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
              <h4 className="text-xs font-black text-slate-400 uppercase mb-6 tracking-widest">Recent Sales Audit</h4>
              <div className="space-y-3">
                {sales.map((s) => (
                  <div key={s.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-black text-slate-800 uppercase text-xs">{s.customer}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {s.timestamp?.toDate ? s.timestamp.toDate().toLocaleString() : 'Syncing...'}
                      </p>
                    </div>
                    <p className="font-black text-lg text-indigo-600">₹{Number(s.amount || 0).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {user && (
              <div className="lg:col-span-4">
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200 sticky top-32">
                  <h3 className="text-lg font-black mb-6 uppercase text-indigo-600">Manage Asset</h3>
                  <input className="w-full p-4 mb-4 bg-slate-50 rounded-xl" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
                  <input className="w-full p-4 mb-4 bg-slate-50 rounded-xl" placeholder="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                  <input className="w-full p-4 mb-6 bg-slate-50 rounded-xl" placeholder="Stock" type="number" value={stock} onChange={e => setStock(e.target.value)} required />
                  <button className="w-full bg-slate-900 text-white p-4 rounded-xl font-black text-xs uppercase">Save Changes</button>
                </form>
              </div>
            )}
            <div className={`${user ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
              <input className="w-full p-5 rounded-2xl bg-white border border-slate-200" placeholder="Filter vault..." onChange={e => setSearchTerm(e.target.value)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-black text-slate-400 uppercase text-[10px]">{p.name}</h4>
                      <span className={`text-[10px] font-black ${p.stock < 10 ? 'text-red-500' : 'text-green-500'}`}>QTY: {p.stock}</span>
                    </div>
                    <p className="text-2xl font-black">₹{Number(p.price).toLocaleString()}</p>
                    {user && (
                      <div className="flex gap-4 mt-4 pt-4 border-t border-slate-50 text-[10px] font-black uppercase">
                        <button onClick={() => { setIsEditing(true); setEditId(p.id); setName(p.name); setPrice(p.price); setStock(p.stock); }} className="text-indigo-600">Edit</button>
                        <button onClick={() => deleteDoc(doc(db, "products", p.id))} className="text-red-500">Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TERMINAL TAB */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map(p => (
                <button key={p.id} disabled={p.stock <= 0} onClick={() => {
                  if(!user) return alert("Terminal Locked");
                  const ex = cart.find(c => c.id === p.id);
                  if(ex) setCart(cart.map(c => c.id === p.id ? {...c, qty: Math.min(p.stock, c.qty + 1)} : c));
                  else setCart([...cart, {...p, qty: 1}]);
                }} className="bg-white p-6 rounded-3xl border border-slate-200 text-left hover:border-indigo-500 shadow-sm transition-all active:scale-95 disabled:opacity-50">
                  <h4 className="font-black text-slate-400 uppercase text-[9px]">{p.name}</h4>
                  <p className="text-2xl font-black mt-1">₹{Number(p.price).toLocaleString()}</p>
                </button>
              ))}
            </div>
            <aside className="lg:col-span-4 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl h-fit sticky top-32">
              <h3 className="text-lg font-black text-indigo-400 uppercase mb-6 tracking-widest">Terminal</h3>
              {user ? (
                <>
                  <input className="w-full p-4 bg-slate-800 rounded-2xl mb-6 text-white border border-slate-700 font-bold" placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-2">
                    {cart.map(i => (
                      <div key={i.id} className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                        <p className="text-[10px] font-bold uppercase">{i.name} (x{i.qty})</p>
                        <button onClick={() => setCart(cart.filter(c => c.id !== i.id))} className="text-red-400 font-black">×</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={generatePDF} className="w-full bg-indigo-600 p-5 rounded-2xl font-black uppercase text-xs tracking-widest">Generate PDF</button>
                </>
              ) : <p className="text-center text-slate-500 font-black uppercase py-20 tracking-widest animate-pulse">Security Gate Locked</p>}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;