import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { PRODUCTS } from './constants';
import ProductCard from './components/ProductCard';
import VoiceAgent from './components/VoiceAgent';
import { Cat, Mic, ShoppingBag, Home } from 'lucide-react';

const NavLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link 
            to={to} 
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-red-100 text-red-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </Link>
    );
};

const ShopPage = () => (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <ShoppingBag className="mr-3 text-red-600" />
            Naši Proizvodi
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    </div>
);

const HomePage = () => (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-200">
            <Cat className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Red Cat <span className="text-red-600">Professional</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10">
            Vrhunska nega kose za profesionalce i entuzijaste. 
            Isprobajte našeg novog AI asistenta za brze porudžbine!
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
             <Link to="/voice" className="flex items-center justify-center px-8 py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700 hover:shadow-red-500/30 transition-all transform hover:-translate-y-1">
                <Mic className="mr-2 w-5 h-5" />
                AI Voice Agent
            </Link>
            <Link to="/shop" className="flex items-center justify-center px-8 py-4 bg-white text-gray-800 border border-gray-200 rounded-xl font-bold shadow hover:bg-gray-50 transition-all">
                <ShoppingBag className="mr-2 w-5 h-5" />
                Pogledaj katalog
            </Link>
        </div>
    </div>
);

const VoicePage = () => (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center">
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Razgovarajte sa AI Asistentom</h1>
            <p className="text-gray-600">Pitajte za savet o bojama, šamponima ili jednostavno naručite glasom.</p>
        </div>
        <VoiceAgent />
    </div>
);

const App = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center space-x-2 font-bold text-xl text-gray-900">
                        <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white">
                            <Cat className="w-5 h-5" />
                        </span>
                        <span>Red Cat</span>
                    </Link>
                    
                    <div className="flex space-x-1">
                        <NavLink to="/" icon={Home} label="Početna" />
                        <NavLink to="/shop" icon={ShoppingBag} label="Katalog" />
                        <NavLink to="/voice" icon={Mic} label="AI Agent" />
                    </div>
                </div>
            </div>
        </nav>

        {/* Content */}
        <main className="flex-grow">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/voice" element={<VoicePage />} />
            </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-8">
            <div className="container mx-auto px-4 text-center">
                <p>&copy; {new Date().getFullYear()} Red Cat Professional. Sva prava zadržana.</p>
            </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
