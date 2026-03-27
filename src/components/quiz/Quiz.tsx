import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, ChevronRight, Sparkles, HelpCircle, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { type QuizQuestion } from "../../services/gemini";

interface QuizProps {
  questions: QuizQuestion[];
  topic: string;
  onComplete: (score: number) => void;
  onBack: () => void;
}

export function Quiz({ questions, topic, onComplete, onBack }: QuizProps) {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      setIsAnswered(true);
    }
  }, [timeLeft, isAnswered]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswerIndex(answerIndex);
    setIsAnswered(true);
    
    if (answerIndex === questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswerIndex(null);
      setIsAnswered(false);
      setTimeLeft(30);
    } else {
      onComplete(score);
    }
  };

  const question = questions[currentQuestionIndex];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{topic}</h2>
        <div className="text-lg font-bold text-medical-blue">{timeLeft}s</div>
      </div>
      
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-medical-blue"
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="glass-panel p-8 rounded-[2.5rem] space-y-6">
        <h3 className="text-xl font-bold">{question.question}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={cn(
                "p-4 rounded-2xl border transition-all text-left",
                isAnswered
                  ? index === question.correctAnswer
                    ? "bg-success/10 border-success text-success"
                    : selectedAnswerIndex === index
                      ? "bg-error/10 border-error text-error"
                      : "bg-gray-50 border-gray-100 text-gray-400"
                  : "bg-white border-gray-100 hover:border-medical-blue/30"
              )}
            >
              {option}
            </button>
          ))}
        </div>
        {isAnswered && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-medical-blue/5 border border-medical-blue/10"
          >
            <p className="text-sm font-bold text-medical-blue mb-1">{t("Explication")}</p>
            <p className="text-sm text-slate-dark">{question.explanation}</p>
          </motion.div>
        )}
      </div>

      <button 
        onClick={handleNextQuestion}
        disabled={!isAnswered}
        className="btn-primary w-full flex items-center justify-center gap-3"
      >
        {currentQuestionIndex < questions.length - 1 ? t("Question Suivante") : t("Voir les Résultats")}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
