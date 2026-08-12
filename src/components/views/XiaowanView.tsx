import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Zap,
  ShieldAlert,
  Calculator,
  Car,
  Radio,
  Share2,
  X,
  PhoneOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface XiaowanViewProps {
  advisorName: string;
  storeName: string;
  onAnalyticsAction?: (action: 'quick_prompt_sent' | 'message_sent' | 'voice_started') => void;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  category?: 'competitor' | 'finance' | 'objection' | 'general';
}

export const XiaowanView: React.FC<XiaowanViewProps> = ({ advisorName, storeName, onAnalyticsAction }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: `你好，${advisorName}！我是你的专属 AI 汽车销售 Copilot【小万】✨。\n\n针对【${storeName}】，我已经为你实时同步了车型参数、金融贴息、竞品对比与客户异议化解击杀话术。点击顶部【实时对讲】进入全屏 Gemini Live 对讲模式，或在此打字与我协同攻单！`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Fullscreen Voice Live overlay state
  const [isVoiceLiveOpen, setIsVoiceLiveOpen] = useState(false);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Auto scroll
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, liveTranscript]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setLiveTranscript(transcript);
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Voice recording toggle
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('您的浏览器暂不支持语音识别，请直接使用文本输入或键盘语音输入法。');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (liveTranscript.trim()) {
        handleSend(liveTranscript);
      }
    } else {
      setInput('');
      setLiveTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
      onAnalyticsAction?.('voice_started');
    }
  };

  // Text-To-Speech Playback
  const handleSpeak = (msgId: string, text: string) => {
    if (playingId === msgId) {
      window.speechSynthesis?.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis?.cancel();

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
      utterance.lang = 'zh-CN';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);

      setPlayingId(msgId);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('您的设备暂不支持语音合成。');
    }
  };

  // Copy to clipboard
  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Send message to Gemini backend
  const handleSend = async (customPrompt?: string) => {
    const query = customPrompt || input;
    if (!query.trim() || loading) return;
    onAnalyticsAction?.(customPrompt ? 'quick_prompt_sent' : 'message_sent');

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput('');
    setLiveTranscript('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          history: messages.slice(-6),
          advisorName,
          storeName,
        }),
      });

      const data = await res.json();
      const botReply = data.reply || '小万响应超时，请重试。';

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);

      // If in Voice Live mode, auto play TTS voice response
      if (isVoiceLiveOpen) {
        handleSpeak(botMessage.id, botReply);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `【小万离线击杀话术】针对“${query}”：\n1. **强调核心竞品优势**：突出全系标配CDC悬架、800V高压超充与终身质保保障；\n2. **推进试驾攻单**：邀请客户现场体验座舱NVH与智能驾控。`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Preset Scenario Accelerators
  const scenarios = [
    {
      label: '竞品PK话术',
      icon: <Car className="w-3.5 h-3.5 text-blue-500" />,
      prompt: '对比 星纪元 ES 与 极氪 001 的核心配置优势与战败反击话术',
    },
    {
      label: '金融算价',
      icon: <Calculator className="w-3.5 h-3.5 text-amber-500" />,
      prompt: '客户考虑 15 万元裸车，算一下 2 年 0 息与置换补贴后的落地首付与月供',
    },
    {
      label: '嫌贵破局',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />,
      prompt: '客户嫌贵要求再降 5000 元现金，顾问该如何回应并守住销售底线？',
    },
    {
      label: '试驾逼单',
      icon: <Zap className="w-3.5 h-3.5 text-emerald-500" />,
      prompt: '提供 iCAR 03 试驾前 3 分钟的开场白与逼单提问技巧',
    },
  ];

  const latestBotMessage = [...messages].reverse().find((m) => m.sender === 'bot')?.text;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-h-[720px] bg-transparent select-none relative overflow-hidden font-sans">
      {/* Apple-style Glassmorphic Floating Header */}
      <div className="sticky top-0 z-20 px-5 py-4 bg-white/85 backdrop-blur-xl border-b border-[#eaf0f7] flex items-center justify-between shadow-none">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            {/* Iridescent Apple Intelligence Ring */}
            <div className="absolute -inset-1 rounded-xl bg-blue-200 opacity-70 blur-xs animate-pulse" />
            <div className="relative w-8 h-8 rounded-xl bg-[#1a6fd4] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-white stroke-[2]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-slate-900 text-xs tracking-tight">小万 AI Copilot</h2>
              <span className="px-1.5 py-0.2 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 text-[9px] rounded-full font-medium border border-indigo-200/50 flex items-center gap-1 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                Gemini 3.6 驱动
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-normal">话术攻单 · 实时参数 · 智能对讲</p>
          </div>
        </div>

        {/* Enter Fullscreen Live Intercom Button */}
        <button
          onClick={() => {
            setIsVoiceLiveOpen(true);
          }}
          className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-black hover:to-indigo-900 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer border border-white/10"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-300 stroke-[2.5]" />
          实时对讲
        </button>
      </div>

      {/* Main Text Chat Scroll View */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 font-bold ${
                m.sender === 'user'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-xs'
              }`}
            >
              {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div className="space-y-1.5 max-w-[85%] min-w-0">
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white font-medium rounded-tr-xs shadow-xs'
                    : 'bg-white border border-slate-200/70 text-slate-800 rounded-tl-xs shadow-[0_2px_12px_rgba(0,0,0,0.03)] font-normal'
                }`}
              >
                {m.text}
              </div>

              {/* Bot Action Tools */}
              {m.sender === 'bot' && (
                <div className="flex items-center gap-3 pl-1 text-[10px] text-slate-400">
                  <span className="font-mono text-slate-400">{m.time}</span>
                  <button
                    onClick={() => handleCopy(m.id, m.text)}
                    className="hover:text-blue-600 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    {copiedId === m.id ? '已复制话术' : '一键复制'}
                  </button>

                  <button
                    onClick={() => handleSpeak(m.id, m.text)}
                    className={`flex items-center gap-1 cursor-pointer transition-colors ${
                      playingId === m.id ? 'text-indigo-600 font-bold' : 'hover:text-slate-700'
                    }`}
                  >
                    {playingId === m.id ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    {playingId === m.id ? '停止朗读' : '话术朗读'}
                  </button>

                  <button
                    onClick={() => alert('已将该话术同步至销售剪贴板与跟进日志')}
                    className="hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" />
                    发送客户
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-slate-500 font-medium p-2.5 bg-white/80 backdrop-blur-md rounded-2xl w-fit border border-slate-200/60 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            小万正在调取 DMS 车型数据并精算话术...
          </motion.div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Text Chat Bottom Input Bar */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-slate-200/60 p-2.5 space-y-2 shadow-lg">
        {/* Scenario Chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-1">
          {scenarios.map((sc, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sc.prompt)}
              className="px-2.5 py-1 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/60 text-slate-700 text-[11px] font-medium rounded-xl shrink-0 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              {sc.icon}
              {sc.label}
            </button>
          ))}
        </div>

        {/* Input Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setIsVoiceLiveOpen(true);
              toggleListening();
            }}
            className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/60 transition-all cursor-pointer active:scale-95"
            title="开启实时对讲"
          >
            <Radio className="w-4 h-4 text-indigo-600 stroke-[2]" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="问小万话术、车型参数或金融算价..."
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200/70 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-medium transition-all"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <Send className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FULLSCREEN GEMINI LIVE REALTIME VOICE INTERCOM OVERLAY   */}
      {/* ELEGANT APPLE-GRADE MINIMALIST DESIGN (NO VERTICAL BOUNCE) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isVoiceLiveOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] bg-[#050608] text-white flex flex-col justify-between p-6 sm:p-10 overflow-hidden font-sans select-none"
          >
            {/* Soft Ambient Siri Radial Lighting (Smooth, stationary, no jump) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/15 to-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

            {/* Top Bar with Clean Exit Button */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-4 h-4 text-cyan-300 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm tracking-tight text-white/95">Gemini Live 对讲</h3>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full border border-emerald-500/20 font-mono font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      实时响应
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-normal">
                    顾问：{advisorName} · {storeName}
                  </p>
                </div>
              </div>

              {/* Minimal Exit Button */}
              <button
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  if (isListening && recognitionRef.current) {
                    recognitionRef.current.stop();
                    setIsListening(false);
                  }
                  setIsVoiceLiveOpen(false);
                }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center cursor-pointer active:scale-95 transition-all backdrop-blur-xl"
                title="退出对讲"
              >
                <X className="w-4 h-4 text-slate-200 stroke-[2.5]" />
              </button>
            </div>

            {/* Centerpiece: Calm Siri Fluid Orb (Smooth breathing scale only, no up-and-down movement) */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-8 my-auto">
              <div className="relative flex items-center justify-center">
                {/* Outer Liquid Glow Ring */}
                <motion.div
                  animate={{
                    scale: isListening ? [1, 1.15, 1] : loading ? [1, 1.08, 1] : 1,
                    opacity: isListening ? 0.85 : 0.5,
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: isListening ? 2.5 : 4,
                    ease: 'easeInOut',
                  }}
                  className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 blur-2xl pointer-events-none"
                />

                {/* Inner Fluid Orb */}
                <button
                  onClick={toggleListening}
                  className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-slate-950/90 text-white flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border backdrop-blur-3xl shadow-[0_0_60px_rgba(99,102,241,0.25)] active:scale-95 ${
                    isListening
                      ? 'border-rose-400/80 shadow-[0_0_80px_rgba(244,63,94,0.4)]'
                      : 'border-white/20 hover:border-cyan-300/60'
                  }`}
                >
                  <Mic
                    className={`w-10 h-10 transition-colors stroke-[2] ${
                      isListening ? 'text-rose-400' : 'text-cyan-300'
                    }`}
                  />
                  <span className="text-[11px] font-mono mt-2 text-slate-300 tracking-wider font-medium">
                    {isListening ? '点击完成说话' : '点击开始对讲'}
                  </span>
                </button>
              </div>

              {/* Subtitle / Realtime Response Text Display */}
              <div className="w-full max-w-lg bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 text-center space-y-2 shadow-2xl">
                <div className="text-[10px] font-mono text-cyan-300/80 uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  {isListening
                    ? '正在实时聆听...'
                    : loading
                    ? '小万思考中...'
                    : '实时对讲字幕'}
                </div>

                <div className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed max-h-36 overflow-y-auto font-sans pr-1">
                  {liveTranscript ? (
                    <span className="text-cyan-200 font-medium">“{liveTranscript}”</span>
                  ) : latestBotMessage ? (
                    <span className="text-slate-200 whitespace-pre-wrap">{latestBotMessage}</span>
                  ) : (
                    <span className="text-slate-400 italic">点击上方图示开始与小万对讲...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="relative z-10 space-y-4 pt-2">
              {/* Preset Scenario Pills */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar justify-center px-1">
                {scenarios.map((sc, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(sc.prompt)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-medium rounded-full shrink-0 flex items-center gap-1.5 backdrop-blur-md cursor-pointer active:scale-95 transition-all whitespace-nowrap"
                  >
                    {sc.icon}
                    {sc.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={toggleListening}
                  className={`px-8 py-3 rounded-full font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xl ${
                    isListening
                      ? 'bg-rose-500 hover:bg-rose-600 text-white'
                      : 'bg-white text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <Mic className="w-4 h-4 stroke-[2.5]" />
                  {isListening ? '点击结束说话' : '说话'}
                </button>

                <button
                  onClick={() => {
                    window.speechSynthesis?.cancel();
                    if (isListening && recognitionRef.current) {
                      recognitionRef.current.stop();
                      setIsListening(false);
                    }
                    setIsVoiceLiveOpen(false);
                  }}
                  className="px-6 py-3 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <PhoneOff className="w-4 h-4" />
                  挂断
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
