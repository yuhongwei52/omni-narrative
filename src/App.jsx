import React, { useState, useEffect, useRef } from 'react';
import { Play, Send, BookOpen, Settings, RefreshCw, Cpu, User, AlertCircle, Bookmark, Trash2, Clock, Library } from 'lucide-react';

export default function App() {
  // --- 状态管理 ---
  const [gameState, setGameState] = useState('setup'); // 'setup', 'playing', 'loading'
  const [activeTab, setActiveTab] = useState('setup'); // 'setup' (设定), 'library' (书架)
  
  // 剧情相关设定 (自动保存)
  const [worldSetting, setWorldSetting] = useState(() => localStorage.getItem('omni_worldSetting') || '在2084年的新东京，你是一名因为植入体排斥反应而失去工作的退役侦探。今天，一位神秘的雇主敲响了你事务所的门...');
  const [genre, setGenre] = useState(() => localStorage.getItem('omni_genre') || '赛博朋克 / 悬疑');
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  
  // API 配置 (自动保存)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('omni_apiKey') || '');
  const [apiEndpoint, setApiEndpoint] = useState(() => localStorage.getItem('omni_apiEndpoint') || 'https://api.openai.com/v1/chat/completions');
  const [apiModel, setApiModel] = useState(() => localStorage.getItem('omni_apiModel') || 'gpt-3.5-turbo');

  // 书架(存档)数据
  const [savedStories, setSavedStories] = useState(() => {
    const saved = localStorage.getItem('omni_saved_stories');
    return saved ? JSON.parse(saved) : [];
  });
  
  // 当前正在游玩的存档 ID
  const [currentStoryId, setCurrentStoryId] = useState(null);

  const chatEndRef = useRef(null);

  // 监听并保存基础配置
  useEffect(() => {
    localStorage.setItem('omni_apiKey', apiKey);
    localStorage.setItem('omni_apiEndpoint', apiEndpoint);
    localStorage.setItem('omni_apiModel', apiModel);
    localStorage.setItem('omni_worldSetting', worldSetting);
    localStorage.setItem('omni_genre', genre);
  }, [apiKey, apiEndpoint, apiModel, worldSetting, genre]);

  // 监听并保存书架数据
  useEffect(() => {
    localStorage.setItem('omni_saved_stories', JSON.stringify(savedStories));
  }, [savedStories]);

  // 当游戏状态或聊天记录更新时，如果处于游玩状态，自动更新当前存档
  useEffect(() => {
    if (gameState === 'playing' && currentStoryId && chatHistory.length > 0) {
      setSavedStories(prev => prev.map(story => 
        story.id === currentStoryId 
          ? { ...story, history: chatHistory, lastPlayed: Date.now() }
          : story
      ));
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, gameState, currentStoryId]);

  // --- 核心逻辑 ---

  const generateStory = async (prompt, history) => {
    setGameState('loading');
    
    // 演示模式
    if (!apiKey) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve("【演示模式】\n\n神秘雇主摘下墨镜，露出一只闪烁着红光的机械眼。“我需要你找一个人，”他递给你一张全息照片，“报酬是一百万信用点，以及...治好你排斥反应的特效药。”\n\n你要怎么回答他？\n1. 接受委托。\n2. 拔枪对准他。");
          setGameState('playing');
        }, 1500);
      });
    }

    try {
      const messages = [
        { role: 'system', content: `你是一个互动文字冒险游戏的地下城主（DM）。当前游戏背景：${genre}。世界观设定：${worldSetting}。你需要根据玩家的动作，以第二人称（你）描述发生的事件，推动剧情发展，并在结尾给出面临的困境或选择。` },
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
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      setGameState('playing');
      return data.choices[0].message.content;

    } catch (error) {
      console.error(error);
      setGameState('playing');
      return `【系统错误】: 连接模型失败。请检查 API 配置。\n详情: ${error.message}`;
    }
  };

  // 新建游戏 (创建新存档)
  const handleStartNewGame = async () => {
    if (!worldSetting.trim()) return;
    
    const newId = Date.now().toString();
    setCurrentStoryId(newId);
    setChatHistory([]);
    setActiveTab('setup'); // 切换回设定面板展示配置
    
    const initialPrompt = "游戏开始。请根据世界观设定，描绘玩家当前的处境，并给出第一个互动抉择。";
    const responseText = await generateStory(initialPrompt, []);
    
    const initialHistory = [{ type: 'system', content: responseText }];
    setChatHistory(initialHistory);

    // 添加到书架
    const newStory = {
      id: newId,
      title: `${genre} - ${new Date().toLocaleDateString()}`,
      genre: genre,
      worldSetting: worldSetting,
      history: initialHistory,
      lastPlayed: Date.now()
    };
    setSavedStories(prev => [newStory, ...prev]);
  };

  // 读取存档
  const handleLoadStory = (story) => {
    setGenre(story.genre);
    setWorldSetting(story.worldSetting);
    setChatHistory(story.history);
    setCurrentStoryId(story.id);
    setGameState('playing');
    setActiveTab('setup'); // 读取后切回主配置面板
  };

  // 删除存档
  const handleDeleteStory = (e, id) => {
    e.stopPropagation(); // 阻止触发读取事件
    if (window.confirm('确定要删除这条故事记录吗？无法恢复。')) {
      setSavedStories(prev => prev.filter(s => s.id !== id));
      if (currentStoryId === id) {
        setGameState('setup');
        setChatHistory([]);
        setCurrentStoryId(null);
      }
    }
  };

  // 终止当前模拟
  const handleStopSimulation = () => {
    setGameState('setup');
    setChatHistory([]);
    setCurrentStoryId(null);
  };

  // 发送消息
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

  // 格式化时间戳
  const formatTime = (ts) => {
    const d = new Date(ts);
    return `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-cyan-900 selection:text-cyan-100">
      
      {/* --- 左侧边栏 --- */}
      <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-10 shrink-0">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">OmniNarrative</h1>
            <p className="text-xs text-slate-500">AI 互动剧本引擎</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('setup')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'setup' ? 'text-cyan-400 border-b-2 border-cyan-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Settings size={16} /> 引擎设定
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'library' ? 'text-cyan-400 border-b-2 border-cyan-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Library size={16} /> 我的书架
            {savedStories.length > 0 && <span className="bg-slate-700 text-xs px-1.5 py-0.5 rounded-full">{savedStories.length}</span>}
          </button>
        </div>

        {/* 面板内容 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {/* 设定面板 */}
          {activeTab === 'setup' && (
            <div className="p-6 space-y-6">
              
              {/* API 配置区域 */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">连接配置</label>
                <input 
                  type="password"
                  placeholder="API Key (必填)"
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
              </div>

              {/* 世界观配置区域 */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">世界生成器</label>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-400"><BookOpen size={14} /> 剧本类型</label>
                  <input 
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    disabled={gameState !== 'setup'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-400"><Bookmark size={14} /> 初始设定</label>
                  <textarea 
                    rows={5}
                    value={worldSetting}
                    onChange={(e) => setWorldSetting(e.target.value)}
                    disabled={gameState !== 'setup'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-cyan-500 disabled:opacity-50 transition-all"
                  />
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="pt-4 border-t border-slate-800">
                {gameState === 'setup' ? (
                  <button 
                    onClick={handleStartNewGame}
                    className="w-full py-3 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/50 transition-all active:scale-[0.98]"
                  >
                    <Play size={18} fill="currentColor" /> 新建故事
                  </button>
                ) : (
                  <button 
                    onClick={handleStopSimulation}
                    className="w-full py-3 rounded-md border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <RefreshCw size={18} /> 退出当前故事
                  </button>
                )}
              </div>

              {!apiKey && (
                <div className="p-3 bg-amber-900/20 border border-amber-900/50 rounded-md flex gap-3 text-amber-500/90 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p>无 API Key，将运行本地演示。申请 Token 后填入上方可解锁完整推演。</p>
                </div>
              )}
            </div>
          )}

          {/* 书架面板 */}
          {activeTab === 'library' && (
            <div className="p-4 space-y-3">
              {savedStories.length === 0 ? (
                <div className="text-center py-10 text-slate-500 flex flex-col items-center gap-3">
                  <Library size={32} className="opacity-50" />
                  <p className="text-sm">书架空空如也<br/>去“引擎设定”开启第一段冒险吧</p>
                </div>
              ) : (
                savedStories.map(story => (
                  <div 
                    key={story.id}
                    onClick={() => handleLoadStory(story)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer group ${currentStoryId === story.id ? 'bg-cyan-950/30 border-cyan-800' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-slate-200 text-sm line-clamp-1 pr-2">{story.title}</h3>
                      <button 
                        onClick={(e) => handleDeleteStory(e, story.id)}
                        className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="删除存档"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{story.worldSetting}</p>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(story.lastPlayed)}</span>
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">{story.history.length} 条记录</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      {/* --- 右侧主区域 (剧情视窗) --- */}
      <div className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

        {gameState === 'setup' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-4 z-10 animate-in fade-in">
            <Cpu size={64} className="text-slate-800" strokeWidth={1} />
            <p className="text-lg tracking-widest uppercase">等待世界线接入</p>
          </div>
        ) : (
          <>
            {/* 对话列表区 */}
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
                    placeholder="输入你的行动或对话... [按 Enter 发送]"
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
            </div>
          </>
        )}
      </div>

      {/* 滚动条样式 */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
}