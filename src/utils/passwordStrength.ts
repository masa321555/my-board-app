import zxcvbn from 'zxcvbn';

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string;
  suggestions: string[];
  isStrong: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      feedback: 'パスワードを入力してください',
      suggestions: [],
      isStrong: false,
    };
  }

  const result = zxcvbn(password);
  
  // スコアに基づくフィードバック
  const feedbackMap: Record<number, string> = {
    0: '非常に弱い',
    1: '弱い',
    2: '普通',
    3: '強い',
    4: '非常に強い',
  };

  // 日本語の提案
  const suggestions: string[] = [];
  
  if (result.feedback.suggestions.length > 0) {
    result.feedback.suggestions.forEach((suggestion) => {
      switch (suggestion) {
        case 'Use a few words, avoid common phrases':
          suggestions.push('複数の単語を組み合わせて、一般的なフレーズは避けてください');
          break;
        case 'No need for symbols, digits, or uppercase letters':
          suggestions.push('記号、数字、大文字は必須ではありません');
          break;
        case 'Add another word or two. Uncommon words are better.':
          suggestions.push('さらに1〜2語追加してください。一般的でない単語が良いです');
          break;
        case 'Capitalization doesn\'t help very much':
          suggestions.push('大文字だけでは十分ではありません');
          break;
        case 'All-uppercase is almost as easy to guess as all-lowercase':
          suggestions.push('すべて大文字は、すべて小文字と同じくらい推測されやすいです');
          break;
        case 'Reversed words aren\'t much harder to guess':
          suggestions.push('逆さまの単語も推測されやすいです');
          break;
        case 'Predictable substitutions like \'@\' instead of \'a\' don\'t help very much':
          suggestions.push('「@」を「a」の代わりに使うような予測可能な置換は効果的ではありません');
          break;
        default:
          if (suggestion.includes('Avoid repeated words and characters')) {
            suggestions.push('繰り返しの単語や文字は避けてください');
          } else if (suggestion.includes('Avoid sequences')) {
            suggestions.push('連続した文字や数字は避けてください');
          } else if (suggestion.includes('Avoid recent years')) {
            suggestions.push('最近の年号は避けてください');
          } else if (suggestion.includes('Avoid dates')) {
            suggestions.push('日付は避けてください');
          }
      }
    });
  }

  // 追加の要件チェック
  if (password.length < 8) {
    suggestions.unshift('パスワードは8文字以上にしてください');
  }

  return {
    score: result.score,
    feedback: feedbackMap[result.score],
    suggestions,
    isStrong: result.score >= 1 && password.length >= 8,
  };
}

// パスワード強度の色を取得
export function getPasswordStrengthColor(score: number): string {
  const colors = {
    0: '#d32f2f', // red
    1: '#f57c00', // orange
    2: '#fbc02d', // yellow
    3: '#388e3c', // green
    4: '#1976d2', // blue
  };
  return colors[score as keyof typeof colors] || colors[0];
}