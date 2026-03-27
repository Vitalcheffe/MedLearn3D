import { motion } from "motion/react";
import { 
  Target, 
  Users, 
  Rocket, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Award
} from "lucide-react";

export function VisionRoadmap() {
  const objectives = [
    { title: "Précision Anatomique", desc: "80+ modèles haute fidélité validés médicalement.", icon: Target, indicator: "Validation par 3 experts" },
    { title: "Accessibilité Universelle", desc: "Interface intuitive pour tous les niveaux d'études.", icon: Globe, indicator: "Score SUS > 85" },
    { title: "Apprentissage Actif", desc: "7 types de quiz interactifs pour une mémorisation durable.", icon: Award, indicator: "+40% rétention" },
    { title: "Performance 3D", desc: "Optimisation Draco et LOD pour une fluidité maximale.", icon: Zap, indicator: "60 FPS stable" },
    { title: "Sécurité des Données", desc: "Infrastructure Firebase sécurisée et conforme.", icon: Shield, indicator: "Audit SOC2" },
  ];

  const userGroups = [
    { title: "Étudiants en Médecine", desc: "Apprentissage initial et révisions d'examens.", icon: Users },
    { title: "Chirurgiens-Dentistes", desc: "Spécialisation en odontologie et pathologies.", icon: Users },
    { title: "Enseignants", desc: "Outils de démonstration pour les cours magistraux.", icon: Users },
    { title: "Professionnels de Santé", desc: "Formation continue et mise à jour des connaissances.", icon: Users },
  ];

  const roadmap = [
    { phase: "Phase 1 - MVP", duration: "4-6 sem", status: "Terminé", items: ["Infrastructure", "2-3 modèles 3D", "Auth Firebase"] },
    { phase: "Phase 2 - Expansion", duration: "6-8 sem", status: "En cours", items: ["Odontologie", "Cardiologie", "Système de Quiz"] },
    { phase: "Phase 3 - Spécialisation", duration: "8-10 sem", status: "À venir", items: ["Neurologie", "Orthopédie", "Pathologies"] },
    { phase: "Phase 4 - Communauté", duration: "Continue", status: "À venir", items: ["API publique", "Traductions", "Collaboratif"] },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Vision Section */}
      <section className="space-y-8">
        <div className="max-w-3xl">
          <h2 className="text-display-md text-dark mb-4">Vision Globale</h2>
          <p className="text-body-lg text-body/70">
            MedLearn 3D aspire à devenir la référence mondiale de l'éducation médicale interactive. 
            En combinant la puissance de Three.js et de l'IA, nous offrons une expérience 
            d'apprentissage immersive qui transcende les manuels traditionnels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {objectives.map((obj, i) => (
            <motion.div 
              key={obj.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 rounded-3xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <obj.icon className="w-6 h-6" />
              </div>
              <h3 className="text-h3 text-lg">{obj.title}</h3>
              <p className="text-caption">{obj.desc}</p>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Indicateur de succès</p>
                <p className="text-xs font-medium text-dark">{obj.indicator}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* User Groups */}
      <section className="space-y-8">
        <h2 className="text-h2 text-dark">Groupes d'Utilisateurs Cibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {userGroups.map((group, i) => (
            <div key={group.title} className="glass-panel p-8 rounded-[2rem] flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <group.icon className="w-8 h-8" />
              </div>
              <h3 className="text-h3">{group.title}</h3>
              <p className="text-body-md text-body/60">{group.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="space-y-8">
        <h2 className="text-h2 text-dark">Feuille de Route</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {roadmap.map((step, i) => (
            <div key={step.phase} className="relative">
              {i < roadmap.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gray-100 -translate-x-1/2 z-0" />
              )}
              <div className="relative z-10 glass-card p-8 rounded-[2.5rem] space-y-6 border-2 border-transparent hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    step.status === "Terminé" ? "bg-success/10 text-success" : 
                    step.status === "En cours" ? "bg-warning/10 text-warning" : "bg-gray-100 text-gray-400"
                  )}>
                    {step.status}
                  </span>
                  <span className="text-caption font-bold">{step.duration}</span>
                </div>
                <div>
                  <h3 className="text-h3 mb-2">{step.phase}</h3>
                  <ul className="space-y-2">
                    {step.items.map(item => (
                      <li key={item} className="flex items-center gap-2 text-caption">
                        <CheckCircle2 className={cn("w-4 h-4", step.status === "Terminé" ? "text-success" : "text-gray-300")} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack Summary */}
      <section className="space-y-12">
        <div className="max-w-3xl">
          <h2 className="text-h2 text-dark mb-4">Architecture Technique</h2>
          <p className="text-body-lg text-body/70">
            Une stack de pointe pour garantir performance, sécurité et évolutivité.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-panel p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-h3 flex items-center gap-3">
              <Zap className="text-primary w-6 h-6" />
              Frontend & 3D
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-caption font-bold">Framework</span>
                <span className="text-body-md font-medium">Next.js 15 / React 19</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-caption font-bold">3D Engine</span>
                <span className="text-body-md font-medium">Three.js r165+</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-caption font-bold">Styling</span>
                <span className="text-body-md font-medium">Tailwind CSS v4</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-caption font-bold">Animations</span>
                <span className="text-body-md font-medium">Framer Motion</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-h3 flex items-center gap-3">
              <Shield className="text-secondary w-6 h-6" />
              Backend & Data
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-caption font-bold">Database</span>
                <span className="text-body-md font-medium">PostgreSQL / Firestore</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-caption font-bold">ORM</span>
                <span className="text-body-md font-medium">Prisma</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-caption font-bold">Auth</span>
                <span className="text-body-md font-medium">NextAuth.js / Firebase Auth</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-caption font-bold">Cache</span>
                <span className="text-body-md font-medium">Vercel KV / Redis</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-12 rounded-[3rem] bg-mesh">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-h3">Optimisations 3D Avancées</h3>
              <p className="text-body-md text-body/70">
                Nous utilisons des techniques de pointe pour assurer une fluidité maximale même sur les appareils mobiles.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "Compression Draco",
                  "LOD (Level of Detail)",
                  "GPU Instancing",
                  "Texture Atlasing",
                  "Frustum Culling",
                  "Occlusion Culling"
                ].map(opt => (
                  <div key={opt} className="flex items-center gap-2 text-caption font-bold">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    {opt}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-[2rem] bg-dark overflow-hidden shadow-2xl p-8 flex items-center justify-center">
                <div className="font-mono text-xs text-primary/80 space-y-2">
                  <p className="text-success">// Initializing Medical Engine v2.5</p>
                  <p>const engine = new Medical3DEngine({`{`}</p>
                  <p className="pl-4">precision: "high",</p>
                  <p className="pl-4">antialiasing: true,</p>
                  <p className="pl-4">draco: true,</p>
                  <p className="pl-4">lodLevels: 3</p>
                  <p>{`}`});</p>
                  <p>engine.loadSystem("cardiovascular");</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
