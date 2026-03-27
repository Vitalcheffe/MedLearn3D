import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  LayoutDashboard, 
  Dna, 
  Stethoscope, 
  Brain, 
  Bone, 
  Eye, 
  Activity, 
  Settings, 
  Menu, 
  X,
  Search,
  BookOpen,
  GraduationCap,
  Bell,
  ChevronRight,
  Rocket
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}

function SidebarItem({ icon: Icon, label, active, onClick, collapsed }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative",
        active 
          ? "nav-item-active text-white" 
          : "text-gray-body/70 hover:bg-medical-blue/5 hover:text-medical-blue"
      )}
    >
      <Icon className={cn("w-5 h-5 min-w-[20px]", active ? "text-white" : "text-medical-blue/60 group-hover:text-medical-blue")} />
      {!collapsed && (
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-semibold text-sm whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
      {active && !collapsed && (
        <motion.div 
          layoutId="active-pill"
          className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/80"
        />
      )}
    </button>
  );
}

export function MainLayout({ 
  children, 
  activeTab, 
  setActiveTab 
}: { 
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { i18n, t } = useTranslation();

  const menuItems = [
    { icon: LayoutDashboard, label: t("Tableau de bord") },
    { icon: BookOpen, label: t("Bibliothèque") },
    { icon: GraduationCap, label: t("Quiz") },
    { icon: Dna, label: t("Anatomie Générale") },
    { icon: Stethoscope, label: t("Odontologie") },
    { icon: Activity, label: t("Cardiologie") },
    { icon: Brain, label: t("Neurologie") },
    { icon: Bone, label: t("Orthopédie") },
    { icon: Eye, label: t("Ophtalmologie") },
    { icon: Rocket, label: t("Vision & Roadmap") },
  ];

  return (
    <div className="flex h-screen bg-light-gray overflow-hidden bg-mesh">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 88 }}
        className="bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col z-30 relative"
      >
        <div className="p-6 flex items-center justify-between h-20">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div 
                key="logo-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-medical-blue to-sky-blue rounded-xl flex items-center justify-center shadow-lg shadow-medical-blue/20">
                  <GraduationCap className="text-white w-6 h-6" />
                </div>
                <span className="font-extrabold text-xl text-slate-dark tracking-tight">MedLearn<span className="text-medical-blue">3D</span></span>
              </motion.div>
            ) : (
              <motion.div 
                key="logo-mini"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-10 h-10 bg-gradient-to-br from-medical-blue to-sky-blue rounded-xl flex items-center justify-center shadow-lg shadow-medical-blue/20 mx-auto"
              >
                <GraduationCap className="text-white w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.label}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.label}
              onClick={() => setActiveTab(item.label)}
              collapsed={!isSidebarOpen}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100/50">
          <SidebarItem 
            icon={Settings} 
            label="Paramètres" 
            active={activeTab === "Paramètres"}
            onClick={() => setActiveTab("Paramètres")}
            collapsed={!isSidebarOpen}
          />
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mt-2 w-full flex items-center justify-center p-3 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
          >
            <ChevronRight className={cn("w-5 h-5 transition-transform duration-300", isSidebarOpen ? "rotate-180" : "rotate-0")} />
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/40 backdrop-blur-md border-b border-gray-200/30 flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-6 flex-1 max-w-2xl">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-medical-blue transition-colors" />
              <input 
                type="text" 
                placeholder="Rechercher une structure, un organe, une pathologie..." 
                className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200/50 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-medical-blue/5 focus:border-medical-blue/20 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
                className="px-3 py-1.5 rounded-lg bg-medical-blue/10 text-medical-blue font-bold text-xs hover:bg-medical-blue/20 transition-all"
              >
                {i18n.language.toUpperCase()}
              </button>
              <button className="p-2.5 text-gray-500 hover:bg-white hover:text-medical-blue rounded-xl transition-all relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-white" />
              </button>
              <button 
                onClick={() => setActiveTab("Bibliothèque")}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-medical-blue hover:bg-white rounded-xl transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Bibliothèque</span>
              </button>
            </div>
            
            <div className="h-8 w-px bg-gray-200" />
            
            <button className="flex items-center gap-3 group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-dark group-hover:text-medical-blue transition-colors">Amine H.</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Étudiant Externe</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-blue to-medical-blue p-0.5 shadow-md group-hover:shadow-lg transition-all">
                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-medical-blue font-bold text-sm">
                  AH
                </div>
              </div>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
