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
  Info
} from 'lucide-react';
import { COMMAND_LIST, APP_THEME } from './constants';
import { AppState, Challenge, GradingResult, SessionState } from './types';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = COMMAND_LIST.filter(cmd => 
    cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      const challenge = await generateChallenge(commandId);
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
      const challenge = await generateChallenge(session.selectedCommand);
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
        {appState !== 'DASHBOARD' && (
          <button 
            onClick={handleQuit}
            className="flex items-center gap-2 px-3 py-1 border border-emerald-900/50 hover:bg-emerald-900/20 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            QUIT SESSION
          </button>
        )}
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
              <div className="col-span-full mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl mb-2 flex items-center gap-2">
                    <CommandIcon className="w-5 h-5" />
                    Select a Command to Master
                  </h2>
                  <p className="text-emerald-500/60 text-sm">Choose a tool to practice your one-liner skills.</p>
                </div>
                
                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <span className="text-emerald-500/50 text-xs">$</span>
                  </div>
                  <input
                    type="text"
                    placeholder="search_command..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-emerald-900/10 border border-emerald-900/30 py-2 pl-8 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 placeholder:text-emerald-900/50"
                  />
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
                <div className="flex items-center gap-2 text-xs text-emerald-500/50 mb-4 uppercase tracking-widest">
                  <Info className="w-4 h-4" />
                  Challenge: {session.selectedCommand}
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
                  <div className="mb-8 text-left">
                    <h4 className="text-xs uppercase tracking-widest text-emerald-500/50 mb-2">Ideal Solution:</h4>
                    <div className="bg-black/60 p-4 border border-emerald-900/30 font-mono text-emerald-400">
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

      <footer className="w-full max-w-4xl mt-12 pt-4 border-t border-emerald-900/30 flex justify-between items-center text-[10px] text-emerald-500/30 uppercase tracking-[0.2em]">
        <div>System Status: Online</div>
        <div>&copy; 2024 BashMaster AI — Learning Protocol Active</div>
      </footer>
    </div>
  );
}
