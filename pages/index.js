// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [url, setUrl] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hideMessages, setHideMessages] = useState(false);
  const [hideEpicGoals, setHideEpicGoals] = useState(false);
  const [hideExcludedWords, setHideExcludedWords] = useState(false);
  const [excludeWords, setExcludeWords] = useState(Array(20).fill(''));
  const [sortMode, setSortMode] = useState('time');
  const [showModal, setShowModal] = useState(false);
  const [groupLimits, setGroupLimits] = useState({});

  useEffect(() => {
    // ローカルストレージから設定を読み込む
    const storedHideMessages = localStorage.getItem('hideMessages') === 'true';
    const storedHideEpicGoals = localStorage.getItem('hideEpicGoals') === 'true';
    const storedHideExcludedWords = localStorage.getItem('hideExcludedWords') === 'true';
    const storedExcludeWords = JSON.parse(localStorage.getItem('excludeWords') || '[]');
    const storedSortMode = localStorage.getItem('sortMode') || 'time';
    const storedGroupLimits = JSON.parse(localStorage.getItem('groupLimits') || '{}');
    const storedMessages = JSON.parse(localStorage.getItem('messages') || '[]');

    setHideMessages(storedHideMessages);
    setHideEpicGoals(storedHideEpicGoals);
    setHideExcludedWords(storedHideExcludedWords);
    setExcludeWords(storedExcludeWords.length ? storedExcludeWords : Array(20).fill(''));
    setSortMode(storedSortMode);
    setGroupLimits(storedGroupLimits);
    setMessages(storedMessages);
  }, []);

  // 設定を保存する関数
  const saveSettings = (key, value) => {
    localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
  };

  // URL入力の変更ハンドラー
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };

  // チャットデータの取得
  const fetchChatData = async () => {
    if (!url) {
      setError('URLを入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/fetchChat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('チャットデータの取得に失敗しました');
      }

      const data = await response.json();
      setMessages(data.messages);
      saveSettings('messages', data.messages);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // メッセージが除外ワードを含むかチェック
  const containsExcludeWord = (text) => {
    if (!hideExcludedWords) return false;
    return excludeWords.some(word => word && text.includes(word));
  };

  // チェック状態の変更ハンドラー
  const handleCheckboxChange = (id) => {
    const updatedMessages = messages.map(message => 
      message.id === id ? { ...message, checked: !message.checked } : message
    );
    setMessages(updatedMessages);
    saveSettings('messages', updatedMessages);
  };

  // チェック済み項目の削除
  const removeCheckedItems = () => {
    const uncheckedMessages = messages.filter(message => !message.checked);
    setMessages(uncheckedMessages);
    saveSettings('messages', uncheckedMessages);
  };

  // データのリセット
  const resetData = () => {
    setMessages([]);
    saveSettings('messages', []);
  };

  // フィルター設定の変更ハンドラー
  const handleFilterChange = (setter, key) => (e) => {
    const value = e.target.checked;
    setter(value);
    saveSettings(key, value);
  };

  // ソートモードの変更ハンドラー
  const handleSortModeChange = (e) => {
    const value = e.target.value;
    setSortMode(value);
    saveSettings('sortMode', value);
  };

  // 除外ワードの保存
  const saveExcludeWords = () => {
    const filtered = excludeWords.filter(word => word.trim() !== '');
    setExcludeWords(filtered.length ? filtered : Array(20).fill(''));
    saveSettings('excludeWords', filtered);
    setShowModal(false);
  };

  // グループの上限変更ハンドラー
  const handleGroupLimitChange = (groupKey, value) => {
    const newLimits = { ...groupLimits, [groupKey]: value };
    setGroupLimits(newLimits);
    saveSettings('groupLimits', newLimits);
  };

  // グループ内のすべてのメッセージをチェック/アンチェック
  const toggleGroupChecks = (groupMessages) => {
    const groupIds = groupMessages.map(msg => msg.id);
    const allChecked = groupMessages.every(msg => {
      const found = messages.find(m => m.id === msg.id);
      return found && found.checked;
    });

    const updatedMessages = messages.map(message => 
      groupIds.includes(message.id) ? { ...message, checked: !allChecked } : message
    );
    
    setMessages(updatedMessages);
    saveSettings('messages', updatedMessages);
  };

  // メッセージをフィルタリングして表示
  const getFilteredMessages = () => {
    return messages.filter(msg => {
      if (hideMessages && msg.type === 'メッセージ') return false;
      if (hideEpicGoals && msg.type === 'エピックゴール') return false;
      if (containsExcludeWord(msg.text)) return false;
      return true;
    });
  };

  const filteredMessages = getFilteredMessages();

  // 時間順表示
  const renderTimeOrder = () => {
    return filteredMessages
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .map(message => (
        <div key={message.id} className="checkbox-item">
          <label>
            <input 
              type="checkbox" 
              checked={message.checked || false} 
              onChange={() => handleCheckboxChange(message.id)}
            />
            <span>{message.text}</span>
          </label>
        </div>
      ));
  };

  const loadDemoData = () => {
    const demoMessages = [
      // サンプルメッセージをここに追加
      {
        id: '1',
        text: '[メッセージ] 100トークン：ありがとう！ 【user1】',
        type: 'メッセージ',
        checked: false,
        timestamp: new Date().toISOString()
      },
      // ... 他のデモメッセージ
    ];
    setMessages(demoMessages);
    saveSettings('messages', demoMessages);
  };

  // 内容でグループ化表示
  const renderGroupedContent = () => {
    const groupedMessages = {};
    filteredMessages.forEach(message => {
      const match = message.text.match(/\[(.*?)\] .*?：(.*?) 【/);
      if (match) {
        const [, type, commentText] = match;
        const groupKey = `[${type}] ：${commentText}`;

        if (!groupedMessages[groupKey]) {
          groupedMessages[groupKey] = [];
        }
        groupedMessages[groupKey].push(message);
      }
    });

    return Object.entries(groupedMessages).map(([groupKey, messages]) => {
      // ユーザーごとのカウント用マップを作成
      const userCounts = {};
      messages.forEach(message => {
        const usernameMatch = message.text.match(/【(.*?)】/);
        if (usernameMatch) {
          const username = usernameMatch[1];
          userCounts[username] = (userCounts[username] || 0) + 1;
        }
      });

      // ユーザー数とメッセージ数を計算
      const uniqueUsers = Object.keys(userCounts);
      const totalUsers = uniqueUsers.length;
      
      // グループの上限設定を取得（デフォルトは無制限）
      const groupLimit = groupLimits[groupKey] !== undefined ? groupLimits[groupKey] : 'infinity';
      
      // 表示可能なメッセージ数を計算
      let displayableMessageCount = 0;
      Object.entries(userCounts).forEach(([username, count]) => {
        if (groupLimit === 'infinity') {
          displayableMessageCount += count;
        } else {
          displayableMessageCount += Math.min(count, parseInt(groupLimit, 10));
        }
      });

      return (
        <div key={groupKey} className="message-group">
          <div className="message-group-header">
            <button 
              className="group-check-button"
              onClick={() => toggleGroupChecks(messages)}
            >
              All Check
            </button>
            <span>
              {groupKey} (<strong>{displayableMessageCount}件</strong> / <strong>{totalUsers}ユーザー</strong>)
            </span>
            <div className="user-limit-container">
              <label>上限:</label>
              <select 
                className="user-limit-select"
                value={groupLimit}
                onChange={(e) => handleGroupLimitChange(groupKey, e.target.value)}
              >
                <option value="infinity">∞</option>
                {[...Array(20)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
          </div>

          {Object.entries(userCounts).map(([username, count]) => {
            // 最新のメッセージを取得
            const userMessages = messages.filter(msg => {
              const usernameMatch = msg.text.match(/【(.*?)】/);
              return usernameMatch && usernameMatch[1] === username;
            }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            if (userMessages.length === 0) return null;
            
            const latestMessage = userMessages[0];
            const isOverLimit = groupLimit !== 'infinity' && count > parseInt(groupLimit, 10);
            
            return (
              <div key={`${groupKey}-${username}`} className="checkbox-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={latestMessage.checked || false} 
                    onChange={() => handleCheckboxChange(latestMessage.id)}
                  />
                  <span>{username}</span>
                  {count > 1 && (
                    <span className={isOverLimit ? 'count-over-limit' : ''}>
                      {` [${count}件]`}
                    </span>
                  )}
                </label>
              </div>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="container">
      <Head>
        <title>チャットキーワード抽出ツール</title>
        <meta name="description" content="チャットからキーワードを抽出してリスト化するツール" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">チャットキーワード抽出ツール</h1>
        
        <div className="url-input">
          <input
            type="text"
            value={url}
            onChange={handleUrlChange}
            placeholder="チャットURL（例: https://stripchat.com/username）"
          />
          <button onClick={fetchChatData} disabled={loading}>
            {loading ? '取得中...' : 'チャット取得'}
          </button>
        </div>
        
        {error && <div className="error">{error}</div>}

        <div className="filter-options">
          <div className="options-row">
            <label className="filter-option">
              <input
                type="checkbox"
                checked={hideMessages}
                onChange={handleFilterChange(setHideMessages, 'hideMessages')}
              />
              メッセージを非表示
            </label>
            <label className="filter-option">
              <input
                type="checkbox"
                checked={hideEpicGoals}
                onChange={handleFilterChange(setHideEpicGoals, 'hideEpicGoals')}
              />
              エピックゴールを非表示
            </label>
          </div>
          <div className="options-row">
            <label className="filter-option">
              <input
                type="checkbox"
                checked={hideExcludedWords}
                onChange={handleFilterChange(setHideExcludedWords, 'hideExcludedWords')}
              />
              除外ワードを非表示
            </label>
            <button className="config-button" onClick={() => setShowModal(true)}>
              除外ワード設定
            </button>
          </div>
          <div className="options-row">
            <select
              className="sort-select"
              value={sortMode}
              onChange={handleSortModeChange}
            >
              <option value="time">時間順</option>
              <option value="content">内容でグループ化</option>
            </select>
          </div>
        </div>

        <div className="checkbox-list">
          {sortMode === 'time' ? renderTimeOrder() : renderGroupedContent()}
        </div>

        <div className="button-container">
          <div className="action-buttons">
            <button onClick={removeCheckedItems}>チェック済みの項目を削除</button>
            <button onClick={resetData}>リセット</button>
            <button onClick={loadDemoData} className="demo-button">デモデータを表示</button>
          </div>
        </div>



        {/* 除外ワード設定モーダル */}
        {showModal && (
          <div className="modal show">
            <div className="modal-content">
              <h2>除外ワード設定</h2>
              <div className="exclude-words-list">
                {excludeWords.map((word, index) => (
                  <div key={index} className="exclude-word-item">
                    <input
                      type="text"
                      value={word}
                      placeholder={`除外ワード ${index + 1}`}
                      onChange={(e) => {
                        const newWords = [...excludeWords];
                        newWords[index] = e.target.value;
                        setExcludeWords(newWords);
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="modal-buttons">
                <button id="saveExcludeWords" onClick={saveExcludeWords}>保存</button>
                <button id="closeModal" onClick={() => setShowModal(false)}>キャンセル</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          width: 100%;
          max-width: 800px;
          padding: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .title {
          margin: 0 0 1rem;
          line-height: 1.15;
          font-size: 2rem;
          text-align: center;
        }

        .url-input {
          display: flex;
          margin-bottom: 1rem;
          gap: 8px;
        }

        .url-input input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .url-input button {
          padding: 0.5rem 1rem;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .url-input button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .error {
          color: red;
          margin-bottom: 1rem;
        }

        .filter-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 8px;
        }

        .options-row {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .filter-option {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #333;
        }

        .sort-select {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ddd;
          font-size: 14px;
          background-color: white;
          cursor: pointer;
        }

        .checkbox-list {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 160px;
          padding-bottom: 20px;
        }

        .checkbox-item {
          margin: 8px 0;
          padding: 12px 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
        }

        .checkbox-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .checkbox-item label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1.5;
        }

        .button-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 12px 16px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(8px);
          border-top: 1px solid rgba(0,0,0,0.1);
          z-index: 1000;
          display: flex;
          justify-content: center;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          max-width: 800px;
          width: 100%;
        }

        .action-buttons button {
          padding: 10px 20px;
          cursor: pointer;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s ease;
          flex: 1;
        }

        .action-buttons button:first-child {
          background: #4CAF50;
          color: white;
        }

        .action-buttons button:last-child {
          background: #f44336;
          color: white;
        }

        .action-buttons button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .message-group {
          margin: 8px 0;
          padding: 12px;
          background: rgba(255,255,255,0.8);
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .message-group-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }

        .group-check-button {
          padding: 1px 4px;
          font-size: 10px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.2s ease;
          line-height: 1.2;
        }

        .user-limit-container {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .user-limit-select {
          padding: 2px 4px;
          border-radius: 3px;
          border: 1px solid #ddd;
          background-color: white;
          cursor: pointer;
        }

        .count-over-limit {
          color: red;
          font-weight: bold;
        }

        .config-button {
          padding: 4px 8px;
          font-size: 12px;
          background: #666;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          z-index: 2000;
        }

        .modal.show {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .exclude-words-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .exclude-word-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .exclude-word-item input {
          flex: 1;
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 12px;
        }

        .modal-buttons {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .modal-buttons button {
          padding: 6px 12px;
          font-size: 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        #saveExcludeWords {
          background: #4CAF50;
          color: white;
        }

        #closeModal {
          background: #666;
          color: white;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
            Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
          background-color: #f8f9fa;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
