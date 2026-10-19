import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  Shield,
  Coins,
  Sparkles,
  RefreshCw,
  Mail,
  Dices,
  ArrowLeftRight,
  PlusCircle,
  UserCheck,
  Lock,
  UserPlus,
  LogIn,
  Briefcase,
  CheckCircle,
} from 'lucide-react';

const ADMIN_SECRET_PASSWORD = 'KalosLockeAdmin2026!';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');

  // Formularios
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  // Datos de la App
  const [users, setUsers] = useState([
    {
      id: '1',
      email: 'ezekielantiman@gmail.com',
      name: 'Kairos',
      role: 'admin',
      status: 'approved',
      coins: 999,
      password: ADMIN_SECRET_PASSWORD,
    },
  ]);
  const [cards, setCards] = useState([
    {
      id: 'c1',
      title: 'Revivir Máximo',
      type: 'Objeto',
      effect: 'Permite revivir a un Pokémon caído.',
      price: 150,
      stock: 10,
    },
    {
      id: 'c2',
      title: 'Caramelo Raro',
      type: 'Objeto',
      effect: 'Sube 1 nivel a tu Pokémon instantáneamente.',
      price: 80,
      stock: 15,
    },
  ]);
  const [inventory, setInventory] = useState([]); // { id, userId, cardId, cardTitle, cardType, cardEffect, quantity }
  const [trades, setTrades] = useState([]);

  const [activeTab, setActiveTab] = useState('shop');
  const [spinning, setSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState(null);

  const [newCard, setNewCard] = useState({
    title: '',
    type: 'Pokémon',
    effect: '',
    price: 100,
    stock: 5,
  });
  const [newTrade, setNewTrade] = useState({
    offeredPokemon: '',
    level: 50,
    requestedItem: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: u } = await supabase.from('users').select('*');
      if (u && u.length > 0) setUsers(u);
      const { data: c } = await supabase.from('cards').select('*');
      if (c && c.length > 0) setCards(c);
      const { data: t } = await supabase.from('trades').select('*');
      if (t && t.length > 0) setTrades(t);
    } catch (e) {
      console.warn('Modo local:', e);
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    if (!emailInput || !passwordInput) return;

    const formattedEmail = emailInput.trim().toLowerCase();
    const isOwner = formattedEmail === 'ezekielantiman@gmail.com';

    if (isOwner && passwordInput !== ADMIN_SECRET_PASSWORD) {
      alert('❌ Contraseña de Administrador incorrecta.');
      return;
    }

    const existingUser = users.find((u) => u.email === formattedEmail);

    if (!existingUser) {
      alert("❌ El correo no está registrado. Ve a la pestaña 'Registrarse'.");
      return;
    }

    if (existingUser.password && existingUser.password !== passwordInput) {
      alert('❌ Contraseña incorrecta.');
      return;
    }

    const userToSet = {
      ...existingUser,
      role: isOwner ? 'admin' : existingUser.role,
      status: isOwner ? 'approved' : existingUser.status,
    };
    setCurrentUser(userToSet);
  }

  function handleRegister(e) {
    e.preventDefault();
    if (!emailInput || !passwordInput || !nameInput) {
      alert('Por favor completa todos los campos.');
      return;
    }

    const formattedEmail = emailInput.trim().toLowerCase();
    const isOwner = formattedEmail === 'ezekielantiman@gmail.com';

    const existingUser = users.find((u) => u.email === formattedEmail);
    if (existingUser) {
      alert("⚠️ Este correo ya está registrado. Ve a la pestaña 'Ingresar'.");
      return;
    }

    if (isOwner && passwordInput !== ADMIN_SECRET_PASSWORD) {
      alert(
        '❌ Para registrar la cuenta de Admin debes ingresar la clave maestra correcta.'
      );
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      email: formattedEmail,
      password: passwordInput,
      name: nameInput.trim(),
      role: isOwner ? 'admin' : 'player',
      status: isOwner ? 'approved' : 'pending',
      coins: isOwner ? 999 : 100,
    };

    setUsers([...users, newUser]);
    setCurrentUser(newUser);

    supabase
      .from('users')
      .insert([newUser])
      .then(() => {})
      .catch((err) => console.error(err));
  }

  // 🛒 LÓGICA DE COMPRA DE CARTAS
  function handleBuyCard(card) {
    if (currentUser.coins < card.price) {
      alert('❌ No tienes suficientes puntos/monedas.');
      return;
    }

    if (card.stock <= 0) {
      alert('❌ Carta agotada.');
      return;
    }

    // 1. Restar monedas al usuario
    const newCoins = currentUser.coins - card.price;
    setCurrentUser({ ...currentUser, coins: newCoins });
    setUsers(
      users.map((u) =>
        u.id === currentUser.id ? { ...u, coins: newCoins } : u
      )
    );

    // 2. Restar 1 al stock de la carta
    setCards(
      cards.map((c) => (c.id === card.id ? { ...c, stock: c.stock - 1 } : c))
    );

    // 3. Agregar al inventario personal
    const existingItem = inventory.find(
      (i) => i.userId === currentUser.id && i.cardId === card.id
    );
    if (existingItem) {
      setInventory(
        inventory.map((i) =>
          i.id === existingItem.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      const newItem = {
        id: Date.now().toString(),
        userId: currentUser.id,
        cardId: card.id,
        cardTitle: card.title,
        cardType: card.type,
        cardEffect: card.effect,
        quantity: 1,
      };
      setInventory([...inventory, newItem]);
    }

    alert(
      `🎉 ¡Compraste "${card.title}" con éxito! Revisa la pestaña 'Mi Inventario'.`
    );
  }

  // 🎒 LÓGICA PARA USAR CARTA DEL INVENTARIO
  function handleUseCard(item) {
    if (item.quantity <= 1) {
      setInventory(inventory.filter((i) => i.id !== item.id));
    } else {
      setInventory(
        inventory.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
        )
      );
    }
    alert(`✨ Has usado 1x "${item.cardTitle}".`);
  }

  function approveUser(userId) {
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, status: 'approved' } : u))
    );
    supabase
      .from('users')
      .update({ status: 'approved' })
      .eq('id', userId)
      .then(() => {});
  }

  function updateUserCoins(userId, amount) {
    setUsers(
      users.map((u) => {
        if (u.id === userId) {
          const newCoins = Math.max(0, u.coins + amount);
          return { ...u, coins: newCoins };
        }
        return u;
      })
    );

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => ({
        ...prev,
        coins: Math.max(0, prev.coins + amount),
      }));
    }
  }

  function handleCreateCard(e) {
    e.preventDefault();
    if (!newCard.title || newCard.price <= 0) return;

    const cardToAdd = {
      id: Date.now().toString(),
      title: newCard.title,
      type: newCard.type,
      effect: newCard.effect,
      price: Number(newCard.price),
      stock: Number(newCard.stock),
    };

    setCards([...cards, cardToAdd]);
    setNewCard({
      title: '',
      type: 'Pokémon',
      effect: '',
      price: 100,
      stock: 5,
    });
    setActiveTab('shop');

    supabase
      .from('cards')
      .insert([cardToAdd])
      .then(() => {});
  }

  function handleCreateTrade(e) {
    e.preventDefault();
    if (!newTrade.offeredPokemon) return;

    const tradeToAdd = {
      id: Date.now().toString(),
      user_email: currentUser.email,
      offered_pokemon: newTrade.offeredPokemon,
      level: Number(newTrade.level),
      requested_item: newTrade.requestedItem,
      status: 'open',
    };

    setTrades([...trades, tradeToAdd]);
    setNewTrade({ offeredPokemon: '', level: 50, requestedItem: '' });

    supabase
      .from('trades')
      .insert([tradeToAdd])
      .then(() => {});
  }

  function spinWheel() {
    if (currentUser.coins < 20 || spinning) return;
    setSpinning(true);
    setWheelResult(null);
    updateUserCoins(currentUser.id, -20);

    setTimeout(() => {
      const prizes = [
        { name: '50 Monedas', coins: 50 },
        { name: 'Carta Común', coins: 0 },
        { name: '100 Monedas (Super Premio)', coins: 100 },
        { name: 'Sin Premio', coins: 0 },
        { name: '20 Monedas (Reembolso)', coins: 20 },
      ];
      const win = prizes[Math.floor(Math.random() * prizes.length)];
      if (win.coins > 0) updateUserCoins(currentUser.id, win.coins);
      setWheelResult(win.name);
      setSpinning(false);
    }, 2000);
  }

  // LOGIN / REGISTRO PANTALLA
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black text-yellow-400 tracking-wider flex items-center justify-center gap-2">
              <Sparkles className="w-8 h-8" /> KALOS LOCKE HUB
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Plataforma Oficial del Torneo
            </p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                authMode === 'login'
                  ? 'bg-yellow-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Ingresar
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                authMode === 'register'
                  ? 'bg-yellow-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Registrarse
            </button>
          </div>

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="tu-correo@ejemplo.com"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3 rounded-lg transition text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" /> Entrar al Torneo
              </button>
            </form>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">
                  Nombre o Apodo
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Ej. Entrenador Red"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="tu-correo@ejemplo.com"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">
                  Crea tu Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3 rounded-lg transition text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Crear Cuenta y Solicitar Acceso
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (currentUser.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-yellow-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <Mail className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold">Acceso Pendiente</h2>
          <p className="text-slate-400 text-sm mt-2">
            El correo{' '}
            <span className="text-yellow-300 font-mono">
              {currentUser.email}
            </span>{' '}
            ha sido registrado.
          </p>
          <p className="text-slate-400 text-xs mt-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
            El administrador debe aprobar tu usuario para habilitar el uso de la
            tienda.
          </p>
          <button
            onClick={() => {
              setCurrentUser(null);
              setPasswordInput('');
            }}
            className="mt-6 text-xs text-slate-500 underline hover:text-white"
          >
            Cerrar e intentar con otra cuenta
          </button>
        </div>
      </div>
    );
  }

  const myItems = inventory.filter((i) => i.userId === currentUser.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-black text-2xl text-yellow-400 tracking-wider">
            KALOS LOCKE
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
              currentUser.role === 'admin'
                ? 'bg-purple-950 text-purple-300 border-purple-800'
                : 'bg-blue-950 text-blue-300 border-blue-800'
            }`}
          >
            Rol: {currentUser.role}
          </span>
        </div>

        <nav className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'shop'
                ? 'bg-yellow-500 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            Tienda
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              activeTab === 'inventory'
                ? 'bg-yellow-500 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Mi Inventario (
            {myItems.length})
          </button>
          <button
            onClick={() => setActiveTab('wheel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'wheel'
                ? 'bg-yellow-500 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            Ruleta Kalos
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'trades'
                ? 'bg-yellow-500 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            Intercambios X/Y
          </button>
          {currentUser.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('creator')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'creator'
                    ? 'bg-yellow-500 text-slate-950'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                + Crear Carta
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'admin'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                Panel Admin
              </button>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950 border border-yellow-500/40 px-4 py-1.5 rounded-full">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-yellow-400 text-sm">
              {currentUser.coins} Pts
            </span>
          </div>
          <button
            onClick={() => {
              setCurrentUser(null);
              setPasswordInput('');
            }}
            className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto w-full flex-1">
        {/* TIENDA */}
        {activeTab === 'shop' && (
          <section>
            <h2 className="text-xl font-bold mb-4 text-slate-200">
              Tienda de Cartas y Objetos
            </h2>
            {cards.length === 0 ? (
              <p className="text-slate-500 text-sm">
                No hay cartas disponibles.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-yellow-500/50 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-yellow-400 bg-yellow-950/50 px-2.5 py-1 rounded border border-yellow-800">
                          {card.type}
                        </span>
                        <span className="text-xs text-slate-400">
                          Stock: {card.stock}
                        </span>
                      </div>
                      <h3 className="font-bold text-xl text-white mt-1">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 min-h-[36px]">
                        {card.effect}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
                      <span className="font-bold text-lg text-yellow-400">
                        {card.price} Pts
                      </span>
                      <button
                        onClick={() => handleBuyCard(card)}
                        disabled={
                          currentUser.coins < card.price || card.stock <= 0
                        }
                        className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition"
                      >
                        Comprar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 🎒 MI INVENTARIO */}
        {activeTab === 'inventory' && (
          <section>
            <h2 className="text-xl font-bold mb-4 text-slate-200 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-yellow-400" /> Mi Mochila /
              Inventario
            </h2>
            {myItems.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center">
                <p className="text-slate-400 text-sm">
                  Aún no has comprado ninguna carta u objeto.
                </p>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="mt-4 bg-yellow-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg"
                >
                  Ir a la Tienda
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold text-yellow-400 bg-yellow-950/50 px-2 py-0.5 rounded border border-yellow-800">
                          {item.cardType}
                        </span>
                        <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                          Cantidad: x{item.quantity}
                        </span>
                      </div>
                      <h3 className="font-bold text-xl text-white mt-1">
                        {item.cardTitle}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 min-h-[36px]">
                        {item.cardEffect}
                      </p>
                    </div>
                    <div className="mt-6 border-t border-slate-800 pt-4">
                      <button
                        onClick={() => handleUseCard(item)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Usar Carta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* CREADOR DE CARTAS */}
        {activeTab === 'creator' && currentUser.role === 'admin' && (
          <section className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5" /> Creador de Cartas
            </h2>
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold">
                  Título de la Carta
                </label>
                <input
                  type="text"
                  required
                  value={newCard.title}
                  onChange={(e) =>
                    setNewCard({ ...newCard, title: e.target.value })
                  }
                  placeholder="Ej. Pokeball Especial"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-semibold">
                    Tipo
                  </label>
                  <select
                    value={newCard.type}
                    onChange={(e) =>
                      setNewCard({ ...newCard, type: e.target.value })
                    }
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-yellow-400"
                  >
                    <option value="Pokémon">Pokémon</option>
                    <option value="Objeto">Objeto</option>
                    <option value="Estado">Estado</option>
                    <option value="Batalla">Batalla</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-semibold">
                    Precio (Monedas)
                  </label>
                  <input
                    type="number"
                    required
                    value={newCard.price}
                    onChange={(e) =>
                      setNewCard({ ...newCard, price: e.target.value })
                    }
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold">
                  Efecto / Descripción
                </label>
                <textarea
                  value={newCard.effect}
                  onChange={(e) =>
                    setNewCard({ ...newCard, effect: e.target.value })
                  }
                  placeholder="Escribe lo que hace esta carta..."
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-yellow-400 h-24"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3 rounded-lg transition uppercase text-sm"
              >
                Guardar y Publicar
              </button>
            </form>
          </section>
        )}

        {/* RULETA */}
        {activeTab === 'wheel' && (
          <section className="max-w-md mx-auto text-center bg-slate-900 border border-slate-800 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2 flex items-center justify-center gap-2">
              <Dices className="w-6 h-6" /> Ruleta Kalos
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Costo por giro:{' '}
              <span className="text-yellow-400 font-bold">20 Monedas</span>
            </p>
            <div
              className={`w-48 h-48 mx-auto mb-6 rounded-full border-8 border-yellow-500 flex items-center justify-center bg-slate-950 transition-transform duration-1000 ${
                spinning ? 'animate-spin' : ''
              }`}
            >
              <Sparkles className="w-16 h-16 text-yellow-400" />
            </div>
            {wheelResult && (
              <div className="bg-slate-950 border border-yellow-500/50 p-4 rounded-xl mb-6">
                <p className="text-xs text-slate-400">¡Resultado!</p>
                <p className="text-lg font-bold text-yellow-400 mt-1">
                  {wheelResult}
                </p>
              </div>
            )}
            <button
              onClick={spinWheel}
              disabled={spinning || currentUser.coins < 20}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold py-3 rounded-lg transition uppercase text-sm"
            >
              {spinning ? 'Girando...' : 'Girar Ruleta'}
            </button>
          </section>
        )}

        {/* INTERCAMBIOS */}
        {activeTab === 'trades' && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h3 className="font-bold text-lg mb-4 text-yellow-400 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5" /> Ofrecer Pokémon
              </h3>
              <form onSubmit={handleCreateTrade} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-semibold">
                    Pokémon Ofrecido
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Greninja, Lucario"
                    value={newTrade.offeredPokemon}
                    onChange={(e) =>
                      setNewTrade({
                        ...newTrade,
                        offeredPokemon: e.target.value,
                      })
                    }
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-semibold">
                    Nivel
                  </label>
                  <input
                    type="number"
                    value={newTrade.level}
                    onChange={(e) =>
                      setNewTrade({ ...newTrade, level: e.target.value })
                    }
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-semibold">
                    ¿Qué pides a cambio?
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carta Revivir o 100 Pts"
                    value={newTrade.requestedItem}
                    onChange={(e) =>
                      setNewTrade({
                        ...newTrade,
                        requestedItem: e.target.value,
                      })
                    }
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3 rounded-lg transition text-xs uppercase"
                >
                  Publicar Oferta
                </button>
              </form>
            </div>

            <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h3 className="font-bold text-lg mb-4 text-slate-200">
                Mercado de Intercambios Activos
              </h3>
              {trades.length === 0 ? (
                <p className="text-slate-500 text-xs py-8 text-center">
                  No hay intercambios publicados aún.
                </p>
              ) : (
                <div className="space-y-3">
                  {trades.map((trade) => (
                    <div
                      key={trade.id}
                      className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] text-slate-500">
                          {trade.user_email}
                        </span>
                        <p className="font-bold text-yellow-400 text-base">
                          {trade.offered_pokemon}{' '}
                          <span className="text-xs text-slate-400">
                            (Nv. {trade.level})
                          </span>
                        </p>
                        <p className="text-xs text-slate-300 mt-1">
                          Busca:{' '}
                          <span className="text-slate-100 font-semibold">
                            {trade.requested_item}
                          </span>
                        </p>
                      </div>
                      <button className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-2 rounded-lg font-bold transition">
                        Aceptar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* PANEL ADMIN */}
        {activeTab === 'admin' && currentUser.role === 'admin' && (
          <section className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6" /> Control de Permisos y Monedas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-sm text-white">{u.name}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {u.email}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          u.status === 'approved'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-amber-950 text-amber-400'
                        }`}
                      >
                        {u.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                        {u.coins} Pts
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {u.status === 'pending' && (
                      <button
                        onClick={() => approveUser(u.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Aprobar
                      </button>
                    )}
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateUserCoins(u.id, 50)}
                        className="bg-yellow-600 hover:bg-yellow-500 text-xs px-2 py-1 rounded font-bold"
                      >
                        +50
                      </button>
                      <button
                        onClick={() => updateUserCoins(u.id, -50)}
                        className="bg-slate-800 hover:bg-slate-700 text-xs px-2 py-1 rounded font-bold"
                      >
                        -50
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
