import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  ChevronRight, 
  Play, 
  RotateCcw, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Command as CommandIcon,
  Info,
  History,
  HelpCircle,
  X,
  FileText,
  Folder,
  Cpu,
  Globe,
  Copy,
  Check
} from 'lucide-react';
import { COMMAND_LIST, COMMAND_CATEGORIES, APP_THEME } from './constants';
import { AppState, Challenge, GradingResult, SessionState, Difficulty } from './types';
import { generateChallenge, gradeSubmission } from './services/aiService';

export default function App() {
  const [appState, setAppState] = useState<AppState>('DASHBOARD');
  const [session, setSession] = useState<SessionState>({
    selectedCommand: null,
    currentChallenge: null,
    lastResult: null,
    history: [],
  });
  const [userInput, setUserInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('BEGINNER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = COMMAND_LIST.filter(cmd => {
    const matchesSearch = cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         cmd.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || (cmd as any).category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (appState === 'PRACTICE' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [appState]);

  const handleSelectCommand = async (commandId: string) => {
    setIsLoading(true);
    setAppState('LOADING_CHALLENGE');
    setError(null);
    try {
      const challenge = await generateChallenge(commandId, selectedDifficulty);
      setSession(prev => ({
        ...prev,
        selectedCommand: commandId,
        currentChallenge: challenge,
        lastResult: null,
      }));
      setAppState('PRACTICE');
      setUserInput('');
    } catch (err) {
      setError("The teacher is currently unavailable. Please try again.");
      setAppState('DASHBOARD');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText': return <FileText className="w-4 h-4" />;
      case 'Folder': return <Folder className="w-4 h-4" />;
      case 'Cpu': return <Cpu className="w-4 h-4" />;
      case 'Globe': return <Globe className="w-4 h-4" />;
      default: return <Terminal className="w-4 h-4" />;
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || !session.currentChallenge || isLoading) return;

    setIsLoading(true);
    setAppState('GRADING');
    try {
      const result = await gradeSubmission(session.currentChallenge, userInput);
      setSession(prev => ({
        ...prev,
        lastResult: result,
        history: [...prev.history, { 
          challenge: prev.currentChallenge!, 
          result, 
          submission: userInput 
        }]
      }));
      setAppState('FEEDBACK');
    } catch (err) {
      setError("Grading failed. Please try again.");
      setAppState('PRACTICE');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextChallenge = async () => {
    if (!session.selectedCommand) return;
    setIsLoading(true);
    setAppState('LOADING_CHALLENGE');
    try {
      const challenge = await generateChallenge(session.selectedCommand, selectedDifficulty);
      setSession(prev => ({
        ...prev,
        currentChallenge: challenge,
        lastResult: null,
      }));
      setAppState('PRACTICE');
      setUserInput('');
    } catch (err) {
      setError("Failed to load next challenge.");
      setAppState('FEEDBACK');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuit = () => {
    setAppState('DASHBOARD');
    setSession({
      selectedCommand: null,
      currentChallenge: null,
      lastResult: null,
      history: [],
    });
    setUserInput('');
    setError(null);
  };

  return (
    <div className={`min-h-screen ${APP_THEME.bg} ${APP_THEME.text} ${APP_THEME.fontMono} p-4 md:p-8 flex flex-col items-center`}>
      {/* Header */}
      <header className="w-full max-w-4xl mb-8 flex justify-between items-center border-b border-emerald-900/30 pb-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tighter uppercase">BashMaster AI</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowHelp(true)}
            className="text-emerald-500/50 hover:text-emerald-500 transition-colors"
            title="How to use"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          {appState !== 'DASHBOARD' && (
            <button 
              onClick={handleQuit}
              className="flex items-center gap-2 px-3 py-1 border border-emerald-900/50 hover:bg-emerald-900/20 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              QUIT SESSION
            </button>
          )}
        </div>
      </header>

      <main className="w-full max-w-4xl flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {appState === 'DASHBOARD' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <div className="col-span-full mb-8 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl mb-2 flex items-center gap-2">
                      <CommandIcon className="w-5 h-5" />
                      Bash Scripting Trainer
                    </h2>
                    <p className="text-emerald-500/60 text-md">Select a command to practice your skills and master Bash Scripting</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Difficulty Selector */}
                    <div className="flex bg-emerald-900/10 border border-emerald-900/30 p-1 rounded-sm">
                      {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as Difficulty[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => setSelectedDifficulty(d)}
                          className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all ${selectedDifficulty === d ? 'bg-emerald-500 text-black' : 'text-emerald-500/40 hover:text-emerald-500'}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full md:w-44">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <span className="text-emerald-500/80 text-xs">$</span>
                      </div>
                      <input
                        type="text"
                        placeholder="search_command"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-emerald-900/10 border border-emerald-900/30 py-2 pl-8 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 placeholder:text-emerald-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-all ${!selectedCategory ? 'bg-emerald-500 text-black border-emerald-500' : 'border-emerald-900/30 text-emerald-500/60 hover:border-emerald-500/50'}`}
                  >
                    All Commands
                  </button>
                  {COMMAND_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-all ${selectedCategory === cat.id ? 'bg-emerald-500 text-black border-emerald-500' : 'border-emerald-900/30 text-emerald-500/60 hover:border-emerald-500/50'}`}
                    >
                      {getCategoryIcon(cat.icon)}
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelectCommand(cmd.id)}
                    disabled={isLoading}
                    className="group relative p-6 border border-emerald-900/30 bg-emerald-900/5 hover:bg-emerald-900/10 hover:border-emerald-500/50 transition-all text-left overflow-hidden"
                  >
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold mb-1 group-hover:text-white transition-colors">{cmd.name}</h3>
                      <p className="text-xs text-emerald-500/60 leading-relaxed">{cmd.description}</p>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    {isLoading && session.selectedCommand === cmd.id && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="col-span-full py-12 text-center border border-dashed border-emerald-900/20">
                  <p className="text-emerald-500/40 italic">No commands matching "{searchQuery}" found in database.</p>
                </div>
              )}

              {/* History Section */}
              {session.history.length > 0 && (
                <div className="col-span-full mt-12">
                  <div className="flex items-center justify-between mb-6 border-b border-emerald-900/30 pb-2">
                    <h2 className="text-xl flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Recent Training History
                    </h2>
                    <button 
                      onClick={() => setSession(prev => ({ ...prev, history: [] }))}
                      className="text-[10px] text-emerald-500/40 hover:text-emerald-500 transition-colors uppercase tracking-widest"
                    >
                      Clear History
                    </button>
                  </div>
                  <div className="space-y-3">
                    {session.history.slice().reverse().map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-4 border border-emerald-900/20 bg-emerald-900/5 flex items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {item.result.correct ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-amber-500" />
                            )}
                            <span className="text-xs font-bold text-white uppercase tracking-tighter">
                              {item.challenge.description.slice(0, 60)}...
                            </span>
                          </div>
                          <div className="font-mono text-[10px] text-emerald-500/60 truncate">
                            $ {item.submission}
                          </div>
                        </div>
                        <div className={`text-[10px] font-bold uppercase tracking-widest ${item.result.correct ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {item.result.correct ? 'Passed' : 'Failed'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {appState === 'LOADING_CHALLENGE' && (
            <motion.div
              key="loading-challenge"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center flex-1 py-20"
            >
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-emerald-500/20" />
                <Terminal className="w-8 h-8 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h2 className="mt-8 text-2xl font-bold tracking-tighter uppercase animate-pulse">
                {session.currentChallenge ? 'Generating Next Question' : 'Preparing Challenge'}
              </h2>
              <p className="mt-2 text-emerald-500/40 text-sm tracking-widest uppercase">
                Consulting the manual pages...
              </p>
            </motion.div>
          )}

          {(appState === 'PRACTICE' || appState === 'GRADING') && session.currentChallenge && (
            <motion.div 
              key="practice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6 flex-1"
            >
              {/* Challenge Card */}
              <div className="p-6 border border-emerald-900/30 bg-emerald-900/5 rounded-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs text-emerald-500/50 uppercase tracking-widest">
                    <Info className="w-4 h-4" />
                    Challenge: {session.selectedCommand}
                  </div>
                  <div className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${
                    session.currentChallenge.difficulty === 'BEGINNER' ? 'border-emerald-500/50 text-emerald-500' :
                    session.currentChallenge.difficulty === 'INTERMEDIATE' ? 'border-amber-500/50 text-amber-500' :
                    'border-red-500/50 text-red-500'
                  }`}>
                    {session.currentChallenge.difficulty}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-white leading-tight">
                  {session.currentChallenge.description}
                </h3>
                <div className="bg-black/40 p-4 border-l-2 border-emerald-500/50 mb-4">
                  <p className="text-sm italic text-emerald-500/80">
                    {session.currentChallenge.context}
                  </p>
                </div>
                <div className="text-xs text-emerald-500/40">
                  Hint: {session.currentChallenge.expectedCommandHint}
                </div>
              </div>

              {/* Mock Shell */}
              <div className="flex-1 flex flex-col border border-emerald-900/30 bg-[#050505] rounded-sm overflow-hidden shadow-2xl">
                <div className="bg-emerald-900/10 px-4 py-2 border-b border-emerald-900/30 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                  <span className="ml-2 text-[10px] text-emerald-500/40 tracking-widest uppercase">bash — 80x24</span>
                </div>
                
                <form 
                  onSubmit={handleSubmit}
                  className="p-6 flex-1 flex flex-col font-mono text-lg"
                  onClick={() => inputRef.current?.focus()}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-500 font-bold mt-1">$</span>
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={appState === 'GRADING'}
                        className={`w-full bg-transparent border-none outline-none text-white caret-emerald-500 resize-none ${appState === 'GRADING' ? 'opacity-0' : 'opacity-100'}`}
                        autoFocus
                        spellCheck={false}
                        autoComplete="off"
                      />
                      {appState === 'GRADING' && (
                        <div className="absolute inset-0 bg-[#050505] flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                          <span className="text-sm animate-pulse text-emerald-500/80">Grading submission...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={!userInput.trim() || appState === 'GRADING'}
                      className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-black font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors uppercase text-sm tracking-tighter"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Execute & Grade
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {appState === 'FEEDBACK' && session.lastResult && (
            <motion.div 
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-6 items-center justify-center flex-1 py-12"
            >
              <div className={`w-full max-w-2xl p-8 border ${session.lastResult.correct ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-amber-500/50 bg-amber-500/5'} rounded-sm text-center`}>
                <div className="flex justify-center mb-6">
                  {session.lastResult.correct ? (
                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                  ) : (
                    <XCircle className="w-16 h-16 text-amber-500" />
                  )}
                </div>
                
                <h2 className={`text-3xl font-bold mb-4 uppercase tracking-tighter ${session.lastResult.correct ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {session.lastResult.correct ? 'Success!' : 'Not quite right'}
                </h2>
                
                <p className="text-lg text-white/90 mb-8 leading-relaxed">
                  {session.lastResult.feedback}
                </p>

                {!session.lastResult.correct && (
                  <div className="mb-8 text-left w-full">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs uppercase tracking-widest text-emerald-500/50">Ideal Solution:</h4>
                      <button 
                        onClick={() => handleCopy(session.lastResult!.solution)}
                        className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-500/40 hover:text-emerald-500 transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-black/60 p-4 border border-emerald-900/30 font-mono text-emerald-400 break-all">
                      <code>{session.lastResult.solution}</code>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleNextChallenge}
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors uppercase text-sm tracking-tighter"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {session.lastResult.correct ? 'Next Challenge' : 'Try Another'}
                  </button>
                  <button
                    onClick={handleQuit}
                    className="flex items-center justify-center gap-2 px-8 py-3 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors uppercase text-sm tracking-tighter"
                  >
                    <LogOut className="w-4 h-4" />
                    Quit Session
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-4 p-4 border border-red-500/30 bg-red-500/5 text-red-400 text-sm flex items-center gap-3">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}
      </main>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-[#0a0a0a] border border-emerald-900/50 p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 text-emerald-500/50 hover:text-emerald-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 uppercase tracking-tighter">
                <HelpCircle className="w-6 h-6" />
                Training Protocol
              </h2>
              
              <div className="space-y-6 text-sm leading-relaxed text-emerald-500/80">
                <section>
                  <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">01. Select Command</h3>
                  <p>Choose a Linux command from the dashboard to start a focused training session. Each session generates unique challenges based on that command.</p>
                </section>
                
                <section>
                  <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">02. Solve Challenge</h3>
                  <p>Read the scenario and requirements. Type your Bash one-liner into the terminal. AI will analyze your command for correctness and efficiency.</p>
                </section>
                
                <section>
                  <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">03. Review Feedback</h3>
                  <p>Get instant grading. If you're stuck, the system provides an ideal solution and explains why it works. Your progress is tracked in your session history.</p>
                </section>

                <div className="pt-4 border-t border-emerald-900/30">
                  <p className="italic text-[10px] uppercase tracking-widest text-emerald-500/40">
                    Tip: The system accepts valid alternative solutions, so don't be afraid to experiment with pipes and flags.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowHelp(false)}
                className="w-full mt-8 py-3 bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors uppercase text-xs tracking-widest"
              >
                Acknowledge & Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="w-full max-w-4xl mt-12 pt-4 border-t border-emerald-900/30 flex justify-between items-center text-[10px] text-emerald-500/30 uppercase tracking-[0.2em]">
        <div>System Status: Online</div>
        <div>&copy; 2024 BashMaster AI — Learning Protocol Active</div>
      </footer>
    </div>
  );
}
