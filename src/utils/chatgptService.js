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
  const latinCount = (text.match(/[a-zәğqńöüşiı]/gi) || []).length;

  if (cyrillicCount > latinCount) return "cyrillic";
  if (latinCount > cyrillicCount) return "latin";
  return "mixed";
};

// Imlo tekshirish uchun ChatGPT so'rovi
export const checkSpelling = async (text) => {
  const script = detectScript(text);
  const isLatin = script === "latin";

  const prompt = isLatin
    ? `Qaraqalpaq tilinde lotin alifbosida yozilgan matnni imlo tekshiruv qiling.

Matn: "${text}"

Vazifa:
1. Barcha so'zlarni tekshiring va imlo xatolarini aniqlang
2. Har bir xato so'z uchun bitta to'g'ri variant bering
3. Javobni JSON formatda bering

JSON format:
{
  "results": [
    {
      "word": "xato_so'z",
      "isCorrect": false,
      "suggestions": ["to'g'ri_variant"],
      "start": boshlanish_pozitsiyasi,
      "end": tugash_pozitsiyasi
    }
  ]
}

Faqat JSON formatda javob bering.`
    : `Қарақалпақ тилинде кирилл әлипбесинде жазылған мәтинди имло текшерув қылың.

Мәтин: "${text}"

Вазифа:
1. Барлық сөзлерди текшериң ҳәм имло хаталарын анықлаң
2. Ҳәр бир хата сөз ушын битте дурыс вариант бериң
3. Жаўапты JSON форматда бериң

JSON формат:
{
  "results": [
    {
      "word": "хата_сөз",
      "isCorrect": false,
      "suggestions": ["дурыс_вариант"],
      "start": басланыс_позициясы,
      "end": туғас_позициясы
    }
  ]
}

Тек JSON форматда жаўап бериң.`;

  try {
    const response = await chatgptClient.post("", {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: isLatin
            ? "Siz qaraqalpaq tili imlo tekshiruvchisisiz. Faqat JSON formatda javob berasiz."
            : "Сиз қарақалпақ тили имло текшерившисиз. Тек JSON форматда жаўап бересиз.",
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

        // Statistics qo'shish
        const totalWords = text.split(/\s+/).filter((w) => w.length > 0).length;
        const incorrectWords = result.results.filter(
          (r) => !r.isCorrect
        ).length;

        result.statistics = {
          totalWords: totalWords,
          correctWords: totalWords - incorrectWords,
          incorrectWords: incorrectWords,
          accuracy:
            totalWords > 0
              ? (((totalWords - incorrectWords) / totalWords) * 100).toFixed(1)
              : 100,
          textLength: text.length,
        };
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
  const isLatin = script === "latin";

  const prompt = isLatin
    ? `Qaraqalpaq tilinde lotin alifbosida yozilgan matndagi barcha imlo xatolarini to'g'irlang.

Matn: "${text}"

Faqat to'g'irlangan matnni qaytaring, qo'shimcha tushuntirish bermang.`
    : `Қарақалпақ тилинде кирилл әлипбесинде жазылған мәтиндеги барлық имло хаталарын дүзетиң.

Мәтин: "${text}"

Тек дүзетилген мәтинди қайтарың, қосымша түсиндирме бермең.`;

  try {
    const response = await chatgptClient.post("", {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: isLatin
            ? "Siz qaraqalpaq tili muharriri. Faqat to'g'irlangan matnni qaytarasiz, boshqa hech narsa yozmaysiz."
            : "Сиз қарақалпақ тили муҳаррири. Тек дүзетилген мәтинди қайтарасыз, басқа ҳеш нәрсе жазбайсыз.",
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

  const isToLatin = targetScript === "latin";

  const prompt = isToLatin
    ? `Qoraqalpaq tilindegi kirill alifbosidagi matnni lotin alifbosiga o'tkazing.

Matn: "${text}"

Qoidalar:
а→a, ә→á, б→b, в→v, г→g, ғ→ǵ, д→d, е→e, ё→yo, ж→j, з→z, и→i, й→y, к→k, қ→q, л→l, м→m, н→n, ң→ń, о→o, ө→ó, п→p, р→r, с→s, т→t, у→u, ү→ú, ў→w, ф→f, х→x, ҳ→h, ц→c, ч→ch, ш→sh, щ→sh, ъ→', ы→ı, ь→, э→e, ю→yu, я→ya

Faqat o'tkazilgan matnni bering.`
    : `Qaraqalpaq tilindegi lotin alifbosidagi matnni kirill alifbosiga o'tkazing.

Matn: "${text}"

Qoidalar:
a→а, á→ә, b→б, v→в, g→г, ǵ→ғ, d→д, e→е, j→ж, z→з, i→и, ı→ы, y→й, k→к, q→қ, l→л, m→м, n→н, ń→ң, o→о, ó→ө, p→п, r→р, s→с, t→т, u→у, ú→ү, w→ў, f→ф, x→х, h→ҳ, c→ц, ch→ч, sh→ш

Faqat o'tkazilgan matnni bering.`;

  try {
    const response = await chatgptClient.post("", {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Siz qaraqalpaq tili transliteratori. Faqat o'tkazilgan matnni qaytarasiz.",
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
