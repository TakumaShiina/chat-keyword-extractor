// pages/api/fetchChat.js
import axios from 'axios';
import cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URLが必要です' });
  }

  try {
    // URLからチャットデータを取得
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    // HTMLをパース
    const $ = cheerio.load(response.data);
    const messages = [];

    // メッセージ要素を抽出
    $('.messages .message').each((index, element) => {
      // チップ（投げ銭）メッセージの処理
      const tipCommentBody = $(element).find('.tip-comment-body');
      const coinAmount = $(element).find('.tip-amount-highlight');
      const username = $(element).find('.user-levels-username-text');

      if (tipCommentBody.length && coinAmount.length && username.length) {
        const commentText = tipCommentBody.text().trim();
        const coinText = coinAmount.text().trim();
        const usernameText = username.text().trim();

        // メッセージタイプを判定
        let messageType = 'メッセージ';
        if ($(element).find('.tip-comment.tip-comment-with-highlight.tip-menu').length) {
          messageType = 'プレゼントメニュー';
        } else if ($(element).find('.tip-comment-epic-goal').length) {
          messageType = 'エピックゴール';
        }

        const formattedText = `[${messageType}] ${coinText}：${commentText} 【${usernameText}】`;

        messages.push({
          id: uuidv4(),
          text: formattedText,
          type: messageType,
          checked: false,
          timestamp: new Date().toISOString()
        });
      }

      // ルーレット（Wheel of Fortune）メッセージの処理
      if ($(element).hasClass('plugin-message') && 
          $(element).find('.plugin-message-plugin-name').text().includes('Wheel of Fortune')) {
        const prizeText = $(element).find('.plugin-message-accent').text().trim() || '';
        const usernameElement = $(element).find('.user-levels-username-text');
        const usernameText = usernameElement.length ? usernameElement.text().trim() : '';
        
        if (prizeText && usernameText) {
          const formattedText = `[ルーレット] ：${prizeText} 【${usernameText}】`;
          messages.push({
            id: uuidv4(),
            text: formattedText,
            type: 'ルーレット',
            checked: false,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    return res.status(200).json({ messages });
  } catch (error) {
    console.error('Error fetching chat data:', error);
    return res.status(500).json({ 
      error: 'チャットデータの取得中にエラーが発生しました',
      details: error.message 
    });
  }
}
