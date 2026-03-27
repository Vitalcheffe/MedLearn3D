import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MainLayout } from "./components/layout/MainLayout";
import { Scene } from "./components/3d/Scene";
import { PlaceholderModel } from "./components/3d/models/PlaceholderModel";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip 
} from "recharts";
import { 
  Info, 
  Layers, 
  Maximize2, 
  RotateCw, 
  Activity, 
  Sparkles,
  Brain, 
  Bone, 
  Eye, 
  Stethoscope, 
  Trophy, 
  Clock, 
  ChevronRight,
  Play,
  Bookmark,
  Share2,
  Download,
  EyeOff,
  GraduationCap,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Loader2,
  RefreshCw,
  LogIn,
  LogOut,
  User as UserIcon,
  Rocket
} from "lucide-react";
import { cn } from "./lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { MedicalModel } from "./components/3d/models/MedicalModel";
import { generateQuiz, getMedicalExplanation, type QuizQuestion } from "./services/gemini";
import { 
  auth, 
  db, 
  signInWithGoogle, 
  handleFirestoreError, 
  OperationType 
} from "./firebase";
import { 
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  addDoc,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";

import { Quiz } from "./components/quiz/Quiz";
import { VisionRoadmap } from "./components/VisionRoadmap";
import { type CameraControlType } from "./components/3d/Scene";

export default function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(t("Tableau de bord"));
  const [selectedLayer, setSelectedLayer] = useState(t("Squelette"));
  const [selectedPathology, setSelectedPathology] = useState<string | null>(null);
  const [cameraControl, setCameraControl] = useState<CameraControlType>("Orbit");
  const [quizDifficulty, setQuizDifficulty] = useState(t("Débutant"));
  const [quizType, setQuizType] = useState(t("QCM"));

  const anatomicalLayers = [
    t("Peau"), 
    t("Système Musculaire"), 
    t("Système Squelettique"), 
    t("Système Cardiovasculaire"), 
    t("Système Nerveux"), 
    t("Système Respiratoire"), 
    t("Système Digestif"), 
    t("Système Urinaire"), 
    t("Système Endocrinien"), 
    t("Système Lymphatique")
  ];
  
  // Auth & User Data State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [learningProgress, setLearningProgress] = useState<any[]>([]);

  // Quiz State
  const [quizStep, setQuizStep] = useState<"intro" | "loading" | "questions" | "results">("intro");
  const [quizTopic, setQuizTopic] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await ensureUserDocument(firebaseUser);
      } else {
        setUserData(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Data Listeners
  useEffect(() => {
    if (!user) return;

    // User Data
    const userDocRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));

    // Activities
    const activitiesQuery = query(
      collection(db, "activities"),
      where("uid", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(5)
    );
    const unsubActivities = onSnapshot(activitiesQuery, (snapshot) => {
      setRecentActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, "activities"));

    // Learning Progress
    const progressQuery = query(
      collection(db, "learningProgress"),
      where("uid", "==", user.uid)
    );
    const unsubProgress = onSnapshot(progressQuery, (snapshot) => {
      setLearningProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, "learningProgress"));

    // Quiz History (for chart)
    const quizQuery = query(
      collection(db, "quizResults"),
      where("uid", "==", user.uid),
      orderBy("timestamp", "asc"),
      limit(30)
    );
    const unsubQuiz = onSnapshot(quizQuery, (snapshot) => {
      setQuizHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, "quizResults"));

    return () => {
      unsubUser();
      unsubActivities();
      unsubProgress();
      unsubQuiz();
    };
  }, [user]);

  const ensureUserDocument = async (firebaseUser: FirebaseUser) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    try {
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        const initialData = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          xp: 0,
          level: 1,
          badges: [],
          lastActive: new Date().toISOString(),
          role: 'user'
        };
        await setDoc(userDocRef, initialData);
        setUserData(initialData);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  const addActivity = async (type: string, description: string, xpGained: number = 0) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "activities"), {
        uid: user.uid,
        type,
        description,
        timestamp: new Date().toISOString(),
        xpGained
      });
      
      if (xpGained > 0) {
        const userDocRef = doc(db, "users", user.uid);
        const newXp = (userData?.xp || 0) + xpGained;
        const newLevel = Math.floor(newXp / 1000) + 1;
        await updateDoc(userDocRef, {
          xp: newXp,
          level: newLevel,
          lastActive: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "activities");
    }
  };

  const updateProgress = async (module: string, progress: number) => {
    if (!user) return;
    try {
      const progressId = `${user.uid}_${module}`;
      const progressDocRef = doc(db, "learningProgress", progressId);
      await setDoc(progressDocRef, {
        uid: user.uid,
        module,
        progress,
        lastAccessed: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `learningProgress/${user.uid}_${module}`);
    }
  };

  // Medical Explanation State
  const [selectedStructure, setSelectedStructure] = useState("Squelette Humain");
  const [medicalExplanation, setMedicalExplanation] = useState("");
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [activeAnnotation, setActiveAnnotation] = useState<{ title: string; description: string; x: number; y: number } | null>(null);
  
  // Guided Learning State
  const [isGuidedLearning, setIsGuidedLearning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const guidedSteps = [
    { part: "Crâne", title: "Le Crâne", description: "Le crâne protège le cerveau et les organes sensoriels." },
    { part: "Fémur", title: "Le Fémur", description: "Le fémur est l'os le plus long et le plus robuste du corps humain." },
    { part: "Muscle", title: "Muscle", description: "Les muscles permettent le mouvement et maintiennent la posture." }
  ];

  // Fetch initial explanation
  useEffect(() => {
    fetchExplanation(selectedStructure);
  }, []);

  const fetchExplanation = async (structure: string) => {
    setIsLoadingExplanation(true);
    try {
      const explanation = await getMedicalExplanation(structure);
      setMedicalExplanation(explanation);
    } catch (error) {
      console.error("Error fetching explanation:", error);
      setMedicalExplanation("Impossible de charger l'explication médicale.");
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  const handleStartQuiz = async (topic: string) => {
    if (!topic.trim()) return;
    
    setQuizTopic(topic);
    setQuizStep("loading");
    setIsGeneratingQuiz(true);
    
    try {
      const questions = await generateQuiz(topic);
      if (questions.length > 0) {
        setQuizQuestions(questions);
        setQuizStep("questions");
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setSelectedAnswerIndex(null);
        setIsAnswered(false);
        setScore(0);
      } else {
        setQuizStep("intro");
        alert("Désolé, nous n'avons pas pu générer de quiz pour ce sujet.");
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      setQuizStep("intro");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswerIndex(answerIndex);
    setIsAnswered(true);
    
    const newUserAnswers = [...userAnswers, answerIndex];
    setUserAnswers(newUserAnswers);
    
    if (answerIndex === quizQuestions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswerIndex(null);
      setIsAnswered(false);
    } else {
      setQuizStep("results");
      // Save results to Firebase
      if (user) {
        const xpGained = score * 100;
        addDoc(collection(db, "quizResults"), {
          uid: user.uid,
          topic: quizTopic,
          score: score,
          totalQuestions: quizQuestions.length,
          timestamp: new Date().toISOString(),
          difficulty: "Intermédiaire"
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, "quizResults"));
        
        addActivity("quiz_completed", `Quiz réussi sur ${quizTopic} (${score}/${quizQuestions.length})`, xpGained);
      }
    }
  };

  const resetQuiz = () => {
    setQuizStep("intro");
    setQuizTopic("");
    setQuizQuestions([]);
    setSelectedAnswerIndex(null);
    setIsAnswered(false);
    setScore(0);
  };

  const renderContent = () => {
    if (isAuthLoading) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-12 h-12 text-medical-blue animate-spin" />
        </div>
      );
    }

    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-8 text-center px-6">
          <div className="w-24 h-24 rounded-[2.5rem] bg-medical-blue/10 flex items-center justify-center text-medical-blue">
            <LogIn className="w-12 h-12" />
          </div>
          <div className="space-y-3 max-w-md">
            <h2 className="text-3xl font-bold text-slate-dark">Connectez-vous pour commencer</h2>
            <p className="text-gray-body/60 text-lg">Suivez vos progrès, gagnez de l'XP et accédez à tous les modules anatomiques en temps réel.</p>
          </div>
          <button 
            onClick={signInWithGoogle}
            className="btn-primary px-10 py-4 rounded-2xl flex items-center gap-4 text-lg shadow-2xl shadow-medical-blue/20"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 bg-white rounded-full p-1" alt="Google" />
            Se connecter avec Google
          </button>
        </div>
      );
    }

    if (activeTab === "Tableau de bord") {
      const chartData = quizHistory.length > 0 
        ? quizHistory.map(q => ({ name: new Date(q.timestamp).toLocaleDateString('fr-FR', { weekday: 'short' }), xp: q.score * 100 }))
        : [
            { name: 'Lun', xp: 0 },
            { name: 'Mar', xp: 0 },
            { name: 'Mer', xp: 0 },
            { name: 'Jeu', xp: 0 },
            { name: 'Ven', xp: 0 },
            { name: 'Sam', xp: 0 },
            { name: 'Dim', xp: 0 },
          ];

      return (
        <div className="space-y-10 pb-12">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl font-extrabold text-slate-dark tracking-tight"
              >
                {t("Bonjour, ")}{user.displayName?.split(' ')[0] || t("Étudiant")} 👋
              </motion.h1>
              <p className="text-gray-body/60 text-lg font-medium">{t("Continuez votre apprentissage là où vous vous êtes arrêté.")}</p>
            </div>
            <div className="flex gap-3">
              <div className="glass-panel px-5 py-3 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-attention/10 flex items-center justify-center text-attention">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Points de Savoir")}</p>
                  <p className="text-lg font-bold text-slate-dark">{userData?.xp || 0} XP</p>
                </div>
              </div>
              <div className="glass-panel px-5 py-3 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Niveau")}</p>
                  <p className="text-lg font-bold text-slate-dark">{t("Lvl")} {userData?.level || 1}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Module & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 relative group overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl shadow-medical-blue/10">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent z-10" />
              <img 
                src={`https://picsum.photos/seed/${learningProgress[0]?.module || 'anatomy'}/1200/600`} 
                alt="Featured" 
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="relative z-20 p-10 h-full flex flex-col justify-center max-w-md space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-blue/20 text-sky-blue text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border border-white/10">
                  <Activity className="w-3 h-3" />
                  {learningProgress[0] ? t('Reprendre l\'étude') : t('Module à la une')}
                </div>
                <h2 className="text-4xl font-bold text-white leading-tight">
                  {learningProgress[0]?.module || t('Le Système Cardiovasculaire')}
                </h2>
                <p className="text-white/70 text-lg leading-relaxed">
                  {learningProgress[0] 
                    ? `${t('Continuez votre exploration du module ')}${learningProgress[0].module}. ${t('Vous en êtes à ')}${learningProgress[0].progress}%.`
                    : t('Explorez la dynamique complexe du corps humain avec nos modèles 3D haute résolution.')}
                </p>
                <button 
                  onClick={() => {
                    const targetModule = learningProgress[0]?.module || "Anatomie";
                    setActiveTab(targetModule);
                    updateProgress(targetModule, learningProgress[0]?.progress || 0);
                  }}
                  className="btn-primary w-fit flex items-center gap-3 group/btn"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{learningProgress[0] ? t('Continuer') : t('Commencer')}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-[2.5rem] p-8 flex flex-col gap-6">
              <h3 className="text-xl font-bold flex items-center justify-between">
                Progrès Réel
                <span className="text-xs font-bold text-medical-blue hover:underline cursor-pointer">Détails</span>
              </h3>
              <div className="space-y-6">
                {learningProgress.length > 0 ? learningProgress.map((item) => (
                  <div key={item.module} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-dark">{item.module}</span>
                      <span className="text-gray-400">{item.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full bg-medical-blue"
                      />
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 space-y-3">
                    <BookOpen className="w-8 h-8 text-gray-200 mx-auto" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aucun progrès enregistré</p>
                  </div>
                )}
              </div>
              {quizHistory.length > 0 && (
                <div className="mt-4 p-5 rounded-3xl bg-success/5 border border-success/10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-success">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-dark tracking-tight">Dernier Quiz</p>
                    <p className="text-xs font-medium text-gray-500">
                      {quizHistory[0].topic} • {Math.round((quizHistory[0].score / quizHistory[0].totalQuestions) * 100)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats & Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-panel rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{t("Statistiques d'Apprentissage")}</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded-lg bg-gray-100 text-[10px] font-bold text-gray-500 hover:bg-medical-blue hover:text-white transition-all">{t("7 JOURS")}</button>
                  <button className="px-3 py-1 rounded-lg bg-medical-blue text-[10px] font-bold text-white shadow-sm">{t("30 JOURS")}</button>
                </div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis hide />
                    <RechartsTooltip 
                      contentStyle={{ 
                        borderRadius: '1rem', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="xp" 
                      stroke="#0ea5e9" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorXp)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel rounded-[2.5rem] p-8 space-y-6">
              <h3 className="text-xl font-bold">{t("Activités Récentes")}</h3>
              <div className="space-y-6">
                {recentActivities.length > 0 ? recentActivities.map((activity, i) => {
                  const Icon = activity.type === 'quiz_completed' ? CheckCircle2 : activity.type === 'badge_obtained' ? Trophy : Eye;
                  const color = activity.type === 'quiz_completed' ? "text-success bg-success/10" : activity.type === 'badge_obtained' ? "text-attention bg-attention/10" : "text-medical-blue bg-medical-blue/10";
                  return (
                    <div key={activity.id} className="flex items-center gap-4 group cursor-pointer">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", color)}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-dark group-hover:text-medical-blue transition-colors">
                          {activity.type === 'quiz_completed' ? t('Quiz Réussi') : activity.type === 'badge_obtained' ? t('Badge Obtenu') : t('Activité')}
                        </p>
                        <p className="text-xs font-medium text-gray-400">{activity.description}</p>
                      </div>
                      <p className="text-[10px] font-bold text-gray-300 uppercase">
                        {new Date(activity.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  );
                }) : (
                  <div className="text-center py-12 space-y-3">
                    <Activity className="w-10 h-10 text-gray-100 mx-auto" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("Aucune activité")}</p>
                  </div>
                )}
              </div>
              <button className="w-full py-4 rounded-2xl bg-gray-50 text-xs font-bold text-gray-400 hover:bg-gray-100 transition-all">
                {t("Voir l'historique complet")}
              </button>
            </div>
          </div>

          {/* Modules Grid */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">{t("Explorer les Spécialités")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: t("Anatomie Générale"), icon: Activity, color: "bg-primary", desc: t("80+ modèles (10 systèmes)") },
                { title: t("Odontologie"), icon: Stethoscope, color: "bg-accent", desc: t("8 modèles dentaires + 7 pathologies") },
                { title: t("Cardiologie"), icon: Activity, color: "bg-error", desc: t("6 modèles cardiaques") },
                { title: t("Neurologie"), icon: Brain, color: "bg-anatomy", desc: t("6 structures cérébrales") },
                { title: t("Orthopédie"), icon: Bone, color: "bg-warning", desc: t("7 régions ostéo-articulaires") },
                { title: t("Ophtalmologie"), icon: Eye, color: "bg-info", desc: t("5 modèles oculaires") },
              ].map((module) => (
                <motion.div 
                  key={module.title}
                  whileHover={{ y: -5 }}
                  onClick={() => {
                    setActiveTab(module.title);
                    updateProgress(module.title, 5); // Start with 5% progress
                  }}
                  className="glass-card p-6 rounded-[2rem] cursor-pointer group"
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg", module.color)}>
                    <module.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-medical-blue transition-colors">{module.title}</h3>
                  <p className="text-gray-body/50 text-xs font-medium mb-4">{module.desc}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("Voir le modèle")}</span>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-medical-blue group-hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "Vision & Roadmap") {
      return <VisionRoadmap />;
    }

    if (activeTab === "Quiz") {
      return (
        <div className="space-y-10 pb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold text-slate-dark tracking-tight">{t("Centre de Quiz IA")}</h1>
              <p className="text-gray-body/60 text-lg font-medium">{t("Générez des quiz personnalisés avec Gemini 1.5 Flash.")}</p>
            </div>
            <div className="flex gap-3">
              <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-attention/10 flex items-center justify-center text-attention">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Niveau")}</p>
                  <p className="text-lg font-bold text-slate-dark">{userData?.level || 1}</p>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {quizStep === "intro" && (
              <motion.div 
                key="quiz-intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                <div className="lg:col-span-2 space-y-8">
                  <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group min-w-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-medical-blue/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-medical-blue/10 transition-colors" />
                    <div className="relative z-10 space-y-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase tracking-widest">
                        {t("Générateur IA")}
                      </div>
                      <h2 className="text-3xl font-bold text-slate-dark">{t("Quiz Personnalisé")}</h2>
                      <p className="min-w-0 w-full whitespace-normal break-words text-gray-body/70 text-lg max-w-xl">
                        {t("Entrez un sujet médical et laissez l'IA générer un quiz sur mesure pour tester vos connaissances.")}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("Difficulté")}</label>
                          <select 
                            value={quizDifficulty}
                            onChange={(e) => setQuizDifficulty(e.target.value)}
                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm outline-none"
                          >
                            {["Débutant", "Intermédiaire", "Avancé", "Expert"].map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("Type de Quiz")}</label>
                          <select 
                            value={quizType}
                            onChange={(e) => setQuizType(e.target.value)}
                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm outline-none"
                          >
                            {["QCM", "Identification 3D", "Drag&Drop", "Flashcards", "Intrus", "Temporel", "Examen"].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3 max-w-md">
                        <input 
                          type="text" 
                          value={quizTopic}
                          onChange={(e) => setQuizTopic(e.target.value)}
                          placeholder={t("Ex: Système Nerveux, Cardiologie...")}
                          className="flex-1 px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-medical-blue/20 outline-none"
                        />
                        <button 
                          onClick={() => handleStartQuiz(quizTopic)}
                          className="btn-primary px-6 py-4 rounded-2xl flex items-center gap-3 shadow-xl shadow-medical-blue/20"
                        >
                          <Sparkles className="w-5 h-5" />
                          {t("Générer")}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-bold">{t("Sujets Suggérés")}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { title: t("Ostéologie"), color: "bg-medical-blue" },
                        { title: t("Myologie"), color: "bg-anatomy" },
                        { title: t("Neurologie"), color: "bg-teal-accent" },
                        { title: t("Splanchnologie"), color: "bg-attention" },
                      ].map((cat) => (
                        <div 
                          key={cat.title} 
                          onClick={() => handleStartQuiz(cat.title)}
                          className="glass-card p-6 rounded-3xl flex items-center justify-between group cursor-pointer hover:border-medical-blue/30 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md", cat.color)}>
                              <HelpCircle className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-dark group-hover:text-medical-blue transition-colors">{cat.title}</p>
                              <p className="text-xs font-medium text-gray-400">{t("Générer un quiz IA")}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-medical-blue transition-all" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="glass-panel p-8 rounded-[2.5rem] space-y-6">
                    <h3 className="text-xl font-bold">{t("Votre Progression")}</h3>
                    <div className="space-y-4">
                      <div className="p-5 rounded-3xl bg-medical-blue/5 border border-medical-blue/10">
                        <p className="text-[10px] font-bold text-medical-blue uppercase tracking-widest mb-1">{t("Score Total")}</p>
                        <p className="text-2xl font-black text-slate-dark">{userData?.xp || 0} XP</p>
                      </div>
                      <div className="p-5 rounded-3xl bg-success/5 border border-success/10">
                        <p className="text-[10px] font-bold text-success uppercase tracking-widest mb-1">{t("Quiz Complétés")}</p>
                        <p className="text-2xl font-black text-slate-dark">{quizHistory.length}</p>
                      </div>
                      <div className="p-5 rounded-3xl bg-attention/5 border border-attention/10">
                        <p className="text-[10px] font-bold text-attention uppercase tracking-widest mb-1">{t("Moyenne")}</p>
                        <p className="text-2xl font-black text-slate-dark">
                          {quizHistory.length > 0 
                            ? Math.round(quizHistory.reduce((acc, q) => acc + (q.score / q.totalQuestions), 0) / quizHistory.length * 100) 
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {quizStep === "loading" && (
              <motion.div 
                key="quiz-loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel p-20 rounded-[3rem] flex flex-col items-center justify-center space-y-6 text-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-medical-blue/20 blur-2xl rounded-full animate-pulse" />
                  <Loader2 className="w-16 h-16 text-medical-blue animate-spin relative z-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{t("Génération du Quiz...")}</h3>
                  <p className="text-gray-400">{t("Gemini 1.5 Flash prépare vos questions sur ")}{quizTopic}.</p>
                </div>
              </motion.div>
            )}

            {quizStep === "questions" && quizQuestions.length > 0 && (
              <Quiz 
                questions={quizQuestions} 
                topic={quizTopic} 
                onComplete={(score) => { setScore(score); setQuizStep("results"); }} 
                onBack={() => setQuizStep("intro")} 
              />
            )}

            {quizStep === "results" && (
              <motion.div 
                key="quiz-results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto glass-panel p-12 rounded-[3rem] text-center space-y-8"
              >
                <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center text-success mx-auto">
                  <Trophy className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-slate-dark">{t("Quiz Terminé !")}</h2>
                  <p className="text-gray-400 text-lg">{t("Excellent travail sur le sujet : ")}{quizTopic}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t("Score")}</p>
                    <p className="text-3xl font-black text-slate-dark">{score} / {quizQuestions.length}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-medical-blue/5 border border-medical-blue/10">
                    <p className="text-xs font-bold text-medical-blue uppercase tracking-widest mb-1">{t("XP Gagnés")}</p>
                    <p className="text-3xl font-black text-medical-blue">+{score * 100}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={resetQuiz}
                    className="w-full btn-primary py-4 rounded-2xl font-bold text-lg"
                  >
                    {t("Retour au Centre de Quiz")}
                  </button>
                  <button className="w-full btn-secondary py-4 rounded-2xl font-bold text-lg">
                    {t("Revoir les Réponses")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (activeTab === "Bibliothèque") {
      return (
        <div className="space-y-10 pb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold text-slate-dark tracking-tight">{t("Bibliothèque Médicale")}</h1>
              <p className="text-gray-body/60 text-lg font-medium">{t("Accédez à tous nos modèles 3D et ressources pédagogiques.")}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={t("Rechercher un modèle...")} 
                  className="pl-11 pr-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue transition-all w-64"
                />
              </div>
              <button className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-medical-blue transition-all">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[
              { title: t("Cœur Humain"), cat: t("Cardiologie"), img: "heart" },
              { title: t("Cerveau"), cat: t("Neurologie"), img: "brain" },
              { title: t("Squelette Complet"), cat: t("Anatomie Générale"), img: "skeleton" },
              { title: t("Mâchoire"), cat: t("Odontologie"), img: "jaw" },
            ].map((item, i) => (
              <motion.div 
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -8 }}
                className="glass-card rounded-[2.5rem] overflow-hidden group cursor-pointer"
                onClick={() => setActiveTab(item.cat)}
              >
                <div className="h-48 relative overflow-hidden bg-slate-100">
                  <img 
                    src={`https://picsum.photos/seed/${item.img}/600/400`} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-medical-blue uppercase tracking-widest mb-1">{item.cat}</p>
                    <h3 className="text-xl font-bold text-slate-dark group-hover:text-medical-blue transition-colors">{item.title}</h3>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                      <Activity className="w-3 h-3" />
                      {t("Modèle 3D")}
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-medical-blue group-hover:text-white transition-all">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === "Paramètres") {
      return (
        <div className="space-y-10 pb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-slate-dark tracking-tight">{t("Paramètres")}</h1>
            <p className="text-gray-body/60 text-lg font-medium">{t("Gérez vos préférences et votre compte.")}</p>
          </div>

          <div className="max-w-4xl space-y-8">
            <div className="glass-panel p-8 rounded-[2.5rem] space-y-8">
              <div className="space-y-6">
                <h3 className="text-xl font-bold">{t("Profil")}</h3>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-sky-blue to-medical-blue p-1 shadow-xl">
                    <div className="w-full h-full rounded-[20px] bg-white flex items-center justify-center text-medical-blue font-bold text-3xl overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || ""} className="w-full h-full object-cover" />
                      ) : (
                        (user.displayName || "U").substring(0, 2).toUpperCase()
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button className="btn-primary px-6 py-2 rounded-xl text-sm">{t("Changer la photo")}</button>
                    <p className="text-xs text-gray-400">{t("JPG, GIF ou PNG. Max 2MB.")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("Nom Complet")}</label>
                    <input type="text" readOnly value={user.displayName || ""} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("Email")}</label>
                    <input type="email" readOnly value={user.email || ""} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none cursor-not-allowed" />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100 space-y-6">
                <h3 className="text-xl font-bold">{t("Compte")}</h3>
                <button 
                  onClick={() => signOut(auth)}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-destructive/10 text-destructive font-bold text-sm hover:bg-destructive hover:text-white transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  {t("Se déconnecter")}
                </button>
              </div>
                <div className="space-y-4">
                  <p className="text-sm text-gray-400 italic">{t("Préférences bientôt disponibles...")}</p>
                </div>
              </div>
            </div>
          </div>
        );
      }

    // Module Specific Sidebar Data
    const getModuleSidebarData = () => {
      switch (activeTab) {
        case "Odontologie":
          return {
            pathologies: [
              { title: "Carie Stade 1", desc: "Lésion émail", icon: Activity },
              { title: "Gingivite", desc: "Inflammation gencive", icon: Activity },
              { title: "Parodontite", desc: "Perte osseuse", icon: Activity },
            ],
            models: [
              { title: "Incisive Centrale", icon: Stethoscope, type: "Dent" },
              { title: "Molaire", icon: Stethoscope, type: "Dent" },
              { title: "Mâchoire Complète", icon: Stethoscope, type: "Os" },
            ]
          };
        case "Cardiologie":
          return {
            pathologies: [
              { title: "Sténose", desc: "Rétrécissement valve", icon: Activity },
              { title: "Infarctus", desc: "Nécrose myocardique", icon: Activity },
            ],
            models: [
              { title: "Cœur Externe", icon: Activity, type: "Organe" },
              { title: "Cœur Interne", icon: Activity, type: "Organe" },
              { title: "Système Conduction", icon: Activity, type: "Nerveux" },
            ]
          };
        case "Neurologie":
          return {
            pathologies: [
              { title: "AVC", desc: "Accident vasculaire", icon: Brain },
              { title: "Sclérose", desc: "Atteinte myéline", icon: Brain },
            ],
            models: [
              { title: "Cerveau Complet", icon: Brain, type: "Organe" },
              { title: "Cortex Cérébral", icon: Brain, type: "Organe" },
              { title: "Tronc Cérébral", icon: Brain, type: "Nerveux" },
            ]
          };
        case "Ophtalmologie":
          return {
            pathologies: [
              { title: "Cataracte", desc: "Opacification cristallin", icon: Eye },
              { title: "Glaucome", desc: "Pression intraoculaire", icon: Eye },
            ],
            models: [
              { title: "Globe Oculaire", icon: Eye, type: "Organe" },
              { title: "Rétine", icon: Eye, type: "Organe" },
              { title: "Nerf Optique", icon: Eye, type: "Nerveux" },
            ]
          };
        case "Orthopédie":
          return {
            pathologies: [
              { title: "Fracture", desc: "Rupture osseuse", icon: Bone },
              { title: "Arthrose", desc: "Usure cartilage", icon: Bone },
            ],
            models: [
              { title: "Fémur", icon: Bone, type: "Os" },
              { title: "Articulation Genou", icon: Bone, type: "Os" },
              { title: "Hanche", icon: Bone, type: "Os" },
            ]
          };
        default:
          return {
            pathologies: [],
            models: [
              { title: "Crâne Humain", icon: Bone, type: "Os" },
              { title: "Colonne Vertébrale", icon: Bone, type: "Os" },
              { title: "Cage Thoracique", icon: Bone, type: "Os" },
              { title: "Cœur Humain", icon: Activity, type: "Organe" },
            ]
          };
      }
    };

    const moduleData = getModuleSidebarData();

    return (
      <div className="flex flex-col h-full gap-8">
        {/* Top Navigation Bar for 3D View */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab("Tableau de bord")}
              className="p-2.5 hover:bg-white rounded-xl text-gray-400 transition-all"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-dark tracking-tight">{activeTab}</h2>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span>Modèle Interactif</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="text-medical-blue">V1.2.0</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Partager</span>
            </button>
            <button className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exporter</span>
            </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-8 min-h-0">
          {/* 3D Viewer Area */}
          <div className="xl:col-span-3 flex flex-col gap-6 min-h-[500px]">
            <div className="flex-1 rounded-[2.5rem] overflow-hidden border border-white/40 shadow-2xl relative group bg-slate-900">
              <Scene controlType={cameraControl}>
                <MedicalModel 
                  selectedLayer={selectedLayer} 
                  module={activeTab} 
                  onAnnotation={setActiveAnnotation} 
                  highlightedPart={isGuidedLearning ? guidedSteps[currentStep].part : null}
                />
              </Scene>
              
              {isGuidedLearning && (
                <div className="absolute top-8 right-8 z-50 bg-white p-6 rounded-2xl shadow-xl border border-gray-200 w-80">
                  <h3 className="font-bold text-xl mb-2">{guidedSteps[currentStep].title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{guidedSteps[currentStep].description}</p>
                  <div className="flex justify-between items-center">
                    <button 
                      className="text-xs text-gray-500 hover:underline"
                      onClick={() => {
                        setIsGuidedLearning(false);
                        setCurrentStep(0);
                      }}
                    >
                      {t("Quitter")}
                    </button>
                    <button 
                      className="px-4 py-2 bg-medical-blue text-white rounded-lg text-sm font-bold"
                      onClick={() => {
                        if (currentStep < guidedSteps.length - 1) {
                          setCurrentStep(currentStep + 1);
                        } else {
                          setIsGuidedLearning(false);
                          setCurrentStep(0);
                        }
                      }}
                    >
                      {currentStep < guidedSteps.length - 1 ? t("Suivant") : t("Terminer")}
                    </button>
                  </div>
                </div>
              )}
              
              {/* 3D Tools Overlay - Top Left */}
              <div className="absolute top-8 left-8 flex flex-col gap-3">
                <div className="glass-panel p-2 rounded-2xl flex flex-col gap-1">
                  {[
                    { id: "Orbit", icon: RotateCw, label: t("Orbit") },
                    { id: "Trackball", icon: Maximize2, label: t("Trackball") },
                    { id: "FirstPerson", icon: UserIcon, label: t("First Person") },
                    { id: "Fly", icon: Rocket, label: t("Fly") },
                    { id: "Gestures", icon: Activity, label: t("Gestures") },
                    { id: "Guided", icon: Sparkles, label: t("Guided Learning") },
                  ].map((tool) => (
                    <button 
                      key={tool.id} 
                      onClick={() => {
                        if (tool.id === "Guided") {
                          setIsGuidedLearning(true);
                          setCurrentStep(0);
                        } else {
                          setCameraControl(tool.id as CameraControlType);
                        }
                      }}
                      className={cn(
                        "p-3 rounded-xl transition-all group/tool relative",
                        cameraControl === tool.id ? "bg-primary text-white" : "hover:bg-primary/10 text-primary"
                      )}
                    >
                      <tool.icon className="w-5 h-5" />
                      <span className="absolute left-full ml-3 px-2 py-1 bg-dark text-white text-[10px] font-bold rounded opacity-0 group-hover/tool:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                        {tool.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layers Control - Bottom Left */}
              <div className="absolute bottom-8 left-8 max-w-md w-full">
                <div className="glass-panel p-5 rounded-[2rem] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-dark uppercase tracking-widest">{t("Couches Anatomiques (10)")}</h4>
                    <Layers className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {anatomicalLayers.map((layer) => (
                      <button 
                        key={layer}
                        onClick={() => setSelectedLayer(layer)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border",
                          selectedLayer === layer 
                            ? "bg-primary text-white border-primary shadow-md" 
                            : "bg-white/50 text-body/60 border-gray-200/50 hover:bg-white hover:border-primary/30"
                        )}
                      >
                        {layer}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Annotations Toggle - Top Right */}
              <div className="absolute top-8 right-8">
                <button className="glass-panel px-6 py-3 rounded-full flex items-center gap-3 text-xs font-bold text-medical-blue uppercase tracking-widest hover:bg-white transition-all">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  {t("Annotations Actives")}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Panel */}
          <div className="xl:col-span-1 flex flex-col gap-6 overflow-y-auto pr-2">
            <div className="glass-panel rounded-[2.5rem] p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{t("Détails")}</h3>
                  <button className="p-2 text-gray-400 hover:text-medical-blue transition-colors">
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 rounded-3xl bg-medical-blue/5 border border-medical-blue/10">
                  <h4 className="text-[10px] font-extrabold text-medical-blue uppercase tracking-widest mb-2">{t("Structure Sélectionnée")}</h4>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-slate-dark">{selectedStructure}</p>
                    {isLoadingExplanation && <Loader2 className="w-4 h-4 text-medical-blue animate-spin" />}
                  </div>
                </div>
                <div className="relative">
                  <AnimatePresence mode="wait">
                    {isLoadingExplanation ? (
                      <motion.div 
                        key="explaining"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-3"
                      >
                        <div className="h-4 bg-gray-100 rounded-full w-full animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded-full w-5/6 animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded-full w-4/6 animate-pulse" />
                      </motion.div>
                    ) : (
                      <motion.p 
                        key="explanation"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-gray-body/70 text-sm leading-relaxed"
                      >
                        {medicalExplanation}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {moduleData.pathologies.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-dark uppercase tracking-widest">{t("Pathologies Simulées")}</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {moduleData.pathologies.map((patho) => (
                      <button 
                        key={patho.title}
                        onClick={() => setSelectedPathology(patho.title)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group",
                          selectedPathology === patho.title 
                            ? "bg-error/5 border-error/20" 
                            : "bg-white/50 border-gray-100 hover:border-error/20 hover:bg-white"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          selectedPathology === patho.title ? "bg-error text-white" : "bg-gray-50 text-error/40 group-hover:bg-error group-hover:text-white"
                        )}>
                          <patho.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={cn(
                            "text-sm font-bold transition-colors",
                            selectedPathology === patho.title ? "text-error" : "text-slate-dark group-hover:text-error"
                          )}>{patho.title}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{patho.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-dark uppercase tracking-widest">{t("Modèles Connexes")}</h4>
                <div className="grid grid-cols-1 gap-3">
                  {moduleData.models.map((model) => (
                    <button 
                      key={model.title}
                      onClick={() => {
                        setSelectedStructure(model.title);
                        fetchExplanation(model.title);
                      }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group",
                        selectedStructure === model.title 
                          ? "bg-medical-blue/10 border-medical-blue/30" 
                          : "bg-white/50 border-gray-100 hover:border-medical-blue/20 hover:bg-white"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          selectedStructure === model.title ? "bg-medical-blue text-white" : "bg-gray-50 text-gray-400 group-hover:bg-medical-blue group-hover:text-white"
                        )}>
                          <model.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={cn(
                            "text-sm font-bold transition-colors",
                            selectedStructure === model.title ? "text-medical-blue" : "text-slate-dark group-hover:text-medical-blue"
                          )}>{model.title}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{model.type}</p>
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-all",
                        selectedStructure === model.title ? "text-medical-blue translate-x-1" : "text-gray-300 group-hover:text-medical-blue group-hover:translate-x-1"
                      )} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </MainLayout>
  );
}
