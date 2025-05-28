// src/utils/chatgptService.js

import axios from "axios";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// ChatGPT API uchun axios instance
const chatgptClient = axios.create({
  baseURL: OPENAI_API_URL,
  headers: {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  timeout: 60000, // 60 sekund
});

// Alifbo aniqlash
export const detectScript = (text) => {
  const cyrillicCount = (text.match(/[а-яәғқңөүһ]/gi) || []).length;
  const latinCount = (text.match(/[a-zәğqńöüşi]/gi) || []).length;

  if (cyrillicCount > latinCount) return "cyrillic";
  if (latinCount > cyrillicCount) return "latin";
  return "mixed";
};

// Imlo tekshirish uchun ChatGPT so'rovi
export const checkSpelling = async (text) => {
  const script = detectScript(text);
  const language =
    script === "cyrillic"
      ? "қарақалпақ тилинде кирилл әлипбесинде"
      : "qaraqalpaq tilinde lotin alifbosida";

  const prompt = `
Мен ${language} жазылған мәтинди имла текшерувин сорайман.

Мәтин: "${text}"

Сизден мына тапсырманы орындаўыңызды сорайман:
1. Барлық сөзлерди тексерип, имла хатасы бар сөзлерди анықлаң
2. Әр хатасы бар сөз үшин 3-5 дурыс вариант усыныс бериң
3. Жаўапты міндетли түрде JSON форматында бериң

JSON форматы:
{
  "results": [
    {
      "word": "хатасы бар сөз",
      "isCorrect": false,
      "suggestions": ["дурыс1", "дурыс2", "дурыс3"],
      "start": басталыў_позициясы,
      "end": аяқталыў_позициясы
    }
  ],
  "statistics": {
    "totalWords": барлық_сөз_саны,
    "correctWords": дурыс_сөзлер_саны,
    "incorrectWords": хатасы_бар_сөзлер_саны,
    "accuracy": анықлық_пайызы
  }
}

Тек JSON форматында жаўап бериң, қосымша түсиндирме берме.`;

  try {
    const response = await chatgptClient.post("", {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Сіз қарақалпақ тілінің мамандыктуғы имла текшерувшісіз. Сіз тек JSON форматында жауап берасіз.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = response.data.choices[0].message.content.trim();

    try {
      const result = JSON.parse(content);

      // Pozitsiyalarni hisoblash
      if (result.results) {
        result.results.forEach((item) => {
          const regex = new RegExp(`\\b${item.word}\\b`, "gi");
          const match = regex.exec(text);
          if (match) {
            item.start = match.index;
            item.end = match.index + item.word.length;
          }
        });
      }

      return {
        success: true,
        data: result,
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return {
        success: false,
        error: "ChatGPT javobini parse qilishda xato",
      };
    }
  } catch (error) {
    console.error("ChatGPT API error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error?.message ||
        "ChatGPT bilan bog'lanishda xato",
    };
  }
};

// Matnni to'liq to'g'irlash
export const correctText = async (text) => {
  const script = detectScript(text);
  const language =
    script === "cyrillic"
      ? "қарақалпақ тилинде кирилл әлипбесинде"
      : "qaraqalpaq tilinde lotin alifbosida";

  const prompt = `
Мен ${language} жазылған мәтинди толық имла хаталарынан тазалаўды сорайман.

Мәтин: "${text}"

Тапсырма:
1. Барлық имла хаталарын түзетиң
2. Тек хаталарды түзетип, мәтинниң мағынасын өзгертпеиң
3. Сөзлердиң орналасыў ретин сақлаиң
4. Тыныс белгилерин дурыс қойың

Жаўапты тек түзетилген мәтин түринде бериң, қосымша түсиндирме қоспаиң.`;

  try {
    const response = await chatgptClient.post("", {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Сиз қарақалпақ тилиниң маманлықтуғы редакторысыз. Сиз тек түзетилген мәтинди қайтарасыз.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const correctedText = response.data.choices[0].message.content.trim();

    return {
      success: true,
      data: {
        original: text,
        corrected: correctedText,
      },
    };
  } catch (error) {
    console.error("ChatGPT API error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error?.message ||
        "ChatGPT bilan bog'lanishda xato",
    };
  }
};

// Transliteratsiya
export const transliterate = async (text, targetScript) => {
  const sourceScript = detectScript(text);

  if (sourceScript === targetScript) {
    return {
      success: true,
      data: {
        original: text,
        converted: text,
        from: sourceScript,
        to: targetScript,
      },
    };
  }

  const fromLang = sourceScript === "cyrillic" ? "кирилл" : "lotin";
  const toLang = targetScript === "cyrillic" ? "кирилл" : "lotin";

  const prompt = `
Мен қарақалпақ тіліндегі мәтінді ${fromLang} әлипбесінен ${toLang} әлипбесіне аударуды сұрайман.

Мәтін: "${text}"

Қағидаттар:
${
  targetScript === "latin"
    ? `
Кирилл -> Lotin:
а->a, ә->ә, б->b, в->v, г->g, ғ->ğ, д->d, е->e, ж->j, з->z, и->ı, й->y, к->k, қ->q, л->l, м->m, н->n, ң->ń, о->o, ө->ö, п->p, р->r, с->s, т->t, у->w, ү->ü, ф->f, х->x, ц->ts, ч->sh, ш->ş, ы->ı, э->e, ю->yu, я->ya
`
    : `
Lotin -> Кирилл:
a->а, ә->ә, b->б, v->в, g->г, ğ->ғ, d->д, e->е, j->ж, z->з, ı->и, i->и, y->й, k->к, q->қ, l->л, m->м, n->н, ń->ң, o->о, ö->ө, p->п, r->р, s->с, t->т, w->у, ü->ү, f->ф, x->х, ts->ц, sh->ч, ş->ш
`
}

Тек аударылған мәтінді беріц, қосымша түсіндірме қоспаіц.`;

  try {
    const response = await chatgptClient.post("", {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Сиз қарақалпақ тили транслитераторысыз. Сиз тек аўдарылған мәтинди қайтарасыз.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const convertedText = response.data.choices[0].message.content.trim();

    return {
      success: true,
      data: {
        original: text,
        converted: convertedText,
        from: sourceScript,
        to: targetScript,
      },
    };
  } catch (error) {
    console.error("ChatGPT API error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error?.message ||
        "ChatGPT bilan bog'lanishda xato",
    };
  }
};

// Auto transliteratsiya
export const autoTransliterate = async (text) => {
  const sourceScript = detectScript(text);
  const targetScript = sourceScript === "cyrillic" ? "latin" : "cyrillic";

  return await transliterate(text, targetScript);
};
