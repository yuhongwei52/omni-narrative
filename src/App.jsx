import React, { useState, useEffect, useRef } from 'react';
import { Play, Send, BookOpen, Settings, RefreshCw, Cpu, User, AlertCircle } from 'lucide-react';

export default function App() {
  // 状态管理
  const [gameState, setGameState] = useState('setup'); // 'setup', 'playing', 'loading'
  const [worldSetting, setWorldSetting] = useState('在2084年的新东京，你是一名因为植入体排斥反应而失去工作的退役侦探。今天，一位神秘的雇主敲响了你事务所的门...');
  const [genre, setGenre] = useState('赛博朋克 / 悬疑');
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  
  // API 配置状态
  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('https://api.openai.com/v1/chat/completions');
  const [apiModel, setApiModel] = useState('gpt-3.5-turbo');
  
  const chatEndRef = useRef(null);

  // 滚动到最新消息
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // 模拟/真实的 API 调用函数
  const generateStory = async (prompt, history) => {
    setGameState('loading');
    
    // 如果没有 API Key，使用模拟数据演示
    if (!apiKey) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve("【系统提示：未检测到 API Key，当前为演示模式】\n\n神秘雇主摘下墨镜，露出一只闪烁着红光的机械眼。“我需要你找一个人，”他递给你一张全息照片，“报酬是一百万信用点，以及...治好你排斥反应的特效药。”\n\n你看着照片上的人，瞳孔微缩，那是你三年前被宣告死亡的妹妹。\n\n你要怎么回答他？\n1. 接受委托。\n2. 拔枪对准他，询问他为什么会有这张照片。\n3. 拒绝，并让他滚出去。");
          setGameState('playing');
        }, 1500);
      });
    }

    // 真实的 API 调用逻辑 (兼容 OpenAI 格式的调用)
    try {
      const messages = [
        { role: 'system', content: `你是一个互动文字冒险游戏的地下城主（DM）。当前游戏背景：${genre}。世界观设定：${worldSetting}。你需要根据玩家的动作，以第二人称（你）描述发生的事件，推动剧情发展，并在结尾给出面临的困境或选择。语言要生动、有沉浸感。` },
        ...history.map(msg => ({ role: msg.type === 'user' ? 'user' : 'assistant', content: msg.content })),
        { role: 'user', content: prompt }
      ];

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: apiModel,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP 错误状态码: ${response.status}`);
      }
      const data = await response.json();
      setGameState('playing');
      return data.choices[0].message.content;

    } catch (error) {
      console.error(error);
      setGameState('playing');
      return `【系统错误】: 连接大模型失败。请检查 API Key、接口地址是否正确，或是否存在跨域(CORS)限制。\n错误详情: ${error.message}`;
    }
  };

  // 开始游戏
  const handleStartGame = async () => {
    if (!worldSetting.trim()) return;
    
    setChatHistory([]);
    const initialPrompt = "游戏开始。请根据世界观设定，描绘玩家当前的处境，并给出第一个互动抉择。";
    const responseText = await generateStory(initialPrompt, []);
    
    setChatHistory([{ type: 'system', content: responseText }]);
  };

  // 发送玩家动作
  const handleSendMessage = async () => {
    if (!userInput.trim() || gameState === 'loading') return;

    const newUserMessage = { type: 'user', content: userInput };
    const currentHistory = [...chatHistory, newUserMessage];
    setChatHistory(currentHistory);
    setUserInput('');

    const aiResponse = await generateStory(userInput, chatHistory);
    setChatHistory([...currentHistory, { type: 'system', content: aiResponse }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-cyan-900 selection:text-cyan-100">
      
      {/* 左侧边栏 - 设置区域 */}
      <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <BookOpen className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">OmniNarrative</h1>
            <p className="text-xs text-slate-500">AI 互动剧本引擎 v1.0</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <Settings size={16} /> API 配置 (必填以启用真实调用)
            </label>
            <input 
              type="password"
              placeholder="输入 API Key (如 sk-...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-700"
            />
            <input 
              type="text"
              placeholder="API 接口地址"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-slate-300"
            />
            <input 
              type="text"
              placeholder="模型名称"
              value={apiModel}
              onChange={(e) => setApiModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-slate-300"
            />
            <p className="text-xs text-slate-600">若 API Key 留空则运行本地演示模式。</p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <BookOpen size={16} /> 剧本类型
            </label>
            <input 
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              disabled={gameState !== 'setup'}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <Cpu size={16} /> 世界观与初始设定
            </label>
            <textarea 
              rows={6}
              value={worldSetting}
              onChange={(e) => setWorldSetting(e.target.value)}
              disabled={gameState !== 'setup'}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-cyan-500 disabled:opacity-50 transition-all"
            />
          </div>

          {gameState === 'setup' ? (
            <button 
              onClick={handleStartGame}
              className="w-full py-3 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/50 transition-all active:scale-[0.98]"
            >
              <Play size={18} fill="currentColor" /> 载入世界引擎
            </button>
          ) : (
            <button 
              onClick={() => { setGameState('setup'); setChatHistory([]); }}
              className="w-full py-3 rounded-md border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <RefreshCw size={18} /> 终止模拟 (重置)
            </button>
          )}

          {!apiKey && (
            <div className="p-3 bg-amber-900/20 border border-amber-900/50 rounded-md flex gap-3 text-amber-500/90 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>当前处于无 API Key 状态，系统将返回预设的演示剧本。申请获得 Token 后填入上方即可体验完整 AI 推演。</p>
            </div>
          )}
        </div>
      </div>

      {/* 右侧主区域 - 互动窗口 */}
      <div className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

        {gameState === 'setup' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-4 z-10">
            <Cpu size={64} className="text-slate-800" strokeWidth={1} />
            <p className="text-lg">请在左侧配置世界引擎，然后点击开始</p>
          </div>
        ) : (
          <>
            {/* 剧情展示区 */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 z-10 scroll-smooth custom-scrollbar">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                  
                  {msg.type === 'system' && (
                    <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center mr-4 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                      <Cpu size={16} className="text-cyan-400" />
                    </div>
                  )}

                  <div className={`max-w-[75%] rounded-2xl px-6 py-4 leading-relaxed tracking-wide ${
                    msg.type === 'user' 
                      ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-sm shadow-lg shadow-blue-900/20' 
                      : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-tl-sm backdrop-blur-sm'
                  }`}>
                    {msg.content.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        {i !== msg.content.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </div>

                  {msg.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center ml-4 shrink-0">
                      <User size={16} className="text-blue-400" />
                    </div>
                  )}

                </div>
              ))}
              
              {gameState === 'loading' && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center mr-4 shrink-0">
                    <Cpu size={16} className="text-cyan-400 animate-pulse" />
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-sm px-6 py-4 flex items-center gap-2 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    <span className="ml-2 text-sm text-cyan-500/80">世界引擎演算中...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* 输入区 */}
            <div className="p-6 bg-slate-900/80 backdrop-blur-md border-t border-slate-800/50 z-10">
              <div className="max-w-4xl mx-auto relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative flex items-center bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                  <textarea
                    rows={1}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="输入你的行动、对话或选择 (例如: '我选择拔枪' 或 '质问他为什么要找我')... [按 Enter 发送]"
                    disabled={gameState === 'loading'}
                    className="flex-1 bg-transparent px-4 py-4 focus:outline-none resize-none disabled:opacity-50 text-slate-200 placeholder:text-slate-600"
                    style={{ minHeight: '56px', maxHeight: '150px' }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || gameState === 'loading'}
                    className="mx-2 p-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
              <div className="max-w-4xl mx-auto mt-2 text-center">
                <p className="text-xs text-slate-600">OmniNarrative 核心驱动由 AI 模型提供支持，内容可能存在虚构元素。</p>
              </div>
            </div>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
}