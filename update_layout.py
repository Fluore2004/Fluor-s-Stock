import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

start_marker = '  return (\n    <div className="min-h-screen bg-[#F8FAFC] text-[#0D1B2A] flex flex-col font-sans selection:bg-[#0066FF] selection:text-white" id="app_root">'
end_marker = '        {/* MAIN MODULE CONTENT VIEWPORT */}\n        <main className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[600px]" id="main_content_viewport">'

new_code = '''  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-[#0D1B2A] font-sans overflow-hidden selection:bg-[#0066FF] selection:text-white" id="app_root">
      
      {/* TOP NOTIFICATION BANNER */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border text-sm max-w-md animate-bounce ${
            notification.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
          id="global_notification"
        >
          {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />}
          {notification.type === 'error' && <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />}
          {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />}
          <div>{notification.message}</div>
        </div>
      )}

      {/* SIDE BAR NAVIGATION */}
      <aside className="w-64 bg-[#0D1B2A] text-white flex flex-col flex-shrink-0 z-20" id="sidebar_nav_container">
        <div className="p-6 flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight text-white">FLORIXA</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#0066FF] font-semibold">Technologies</p>
        </div>

        <nav className="mt-6 flex-1 px-4 space-y-2" id="navigation_menu">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-[#0066FF] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === 'dashboard' ? 'bg-white' : 'bg-gray-500'}`}></div>
            <span>Tableau de Bord</span>
          </button>

          <button 
            onClick={() => setActiveTab('pos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'pos' ? 'bg-[#0066FF] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === 'pos' ? 'bg-white' : 'bg-gray-500'}`}></div>
            <span>Point de Vente (POS)</span>
          </button>

          <button 
            onClick={() => setActiveTab('stock')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'stock' ? 'bg-[#0066FF] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === 'stock' ? 'bg-white' : 'bg-gray-500'}`}></div>
            <span className="flex-1 text-left">Gestion Stocks</span>
            {metrics.lowStockCount > 0 && (
              <span className="bg-[#FACC15] text-amber-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {metrics.lowStockCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('debts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'debts' ? 'bg-[#0066FF] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === 'debts' ? 'bg-white' : 'bg-gray-500'}`}></div>
            <span className="flex-1 text-left">Dettes & Clients</span>
            {metrics.totalPendingDebts > 0 && (
              <span className="bg-[#F59E0B] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                !
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('code')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'code' ? 'bg-[#0066FF] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === 'code' ? 'bg-white' : 'bg-gray-500'}`}></div>
            <span>Code Production PHP</span>
          </button>
        </nav>

        <div className="p-6 border-t border-gray-800 text-[11px] text-gray-400 flex justify-between items-center">
          <div>
            <p>Connecté: <strong className="text-white capitalize">{currentUser.role}</strong></p>
            <p className="mt-1">Bujumbura, BI</p>
          </div>
          <div className="flex gap-2">
             <button onClick={toggleRole} className="p-1.5 bg-gray-800 hover:bg-gray-700 hover:text-white rounded text-gray-400 transition-colors" title="Changer rôle"><ShieldCheck className="h-4 w-4"/></button>
             <button onClick={resetDemoState} className="p-1.5 bg-gray-800 hover:bg-gray-700 hover:text-white rounded text-gray-400 transition-colors" title="Reset Demo"><RotateCcw className="h-4 w-4"/></button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]" id="main_content_viewport">
        
        {/* HEADER BAR */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              {activeTab === 'dashboard' && "Vue d'ensemble"}
              {activeTab === 'pos' && "Point de Vente (POS)"}
              {activeTab === 'stock' && "Gestion des Stocks"}
              {activeTab === 'debts' && "Dettes & Clients"}
              {activeTab === 'code' && "Code de Production"}
            </h2>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase tracking-wider font-bold">MVP v1.0</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center font-bold text-[#0066FF]">IF</div>
          </div>
        </header>

        <section className="p-8 flex-1 overflow-auto">'''

if start_marker in content and end_marker in content:
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker) + len(end_marker)
    new_content = content[:start_idx] + new_code + content[end_idx:]
    with open('src/App.tsx', 'w') as f:
        f.write(new_content)
    print("Success: Layout updated")
else:
    print("Error: Markers not found")
