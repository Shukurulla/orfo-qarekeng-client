// src/utils/OrfoAIService.js

import axios from "axios";

// RapidAPI Gemini Pro konfiguratsiyasi
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = "gemini-pro-ai.p.rapidapi.com";
const RAPIDAPI_URL = "https://gemini-pro-ai.p.rapidapi.com/";

// Axios instance yaratish
const rapidApiClient = axios.create({
  baseURL: RAPIDAPI_URL,
  timeout: 60000, // 60 sekund
  headers: {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": RAPIDAPI_HOST,
    "Content-Type": "application/json",
  },
});

// Alifbo aniqlash (lokal funksiya)
export const detectScript = (text) => {
  const cyrillicCount = (text.match(/[а-яәғқңөүһҳ]/gi) || []).length;
  const latinCount = (text.match(/[a-zәğqńöüşıĞQŃÖÜŞI]/gi) || []).length;
  const totalLetters = cyrillicCount + latinCount;

  if (totalLetters === 0) return "unknown";

  if (cyrillicCount > latinCount) return "cyrillic";
  if (latinCount > cyrillicCount) return "latin";
  return "mixed";
};

// RapidAPI Gemini Pro so'rovi yuborish
const sendGeminiRequest = async (prompt) => {
  try {
    const response = await rapidApiClient.post("", {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    if (
      response.data &&
      response.data.candidates &&
      response.data.candidates[0]
    ) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Invalid response format from Gemini API");
    }
  } catch (error) {
    console.error("RapidAPI Gemini error:", error);

    if (error.response) {
      // API dan qaytgan xato
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText;
      throw new Error(`API Error: ${status} - ${message}`);
    } else if (error.request) {
      // Network xato
      throw new Error("Network error: Unable to connect to RapidAPI Gemini");
    } else {
      // Boshqa xatolar
      throw new Error(error.message || "Unknown error occurred");
    }
  }
};

// JSON ni tozalash va parse qilish
const cleanAndParseJSON = (text) => {
  try {
    // Avval to'g'ridan-to'g'ri parse qilishga harakat qilish
    return JSON.parse(text);
  } catch (error) {
    console.log("Direct parse failed, trying to clean JSON...");

    // JSON ni tozalash
    let cleanText = text;

    // Markdown code block larini olib tashlash
    cleanText = cleanText.replace(/```json\s*/g, "").replace(/```\s*/g, "");

    // Boshida va oxirida qo'shimcha matnlarni olib tashlash
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }

    // Noto'g'ri escape sequencelarni to'g'irlash
    cleanText = cleanText
      .replace(/\\"/g, '"') // Noto'g'ri escape qilingan qo'shtirnoqlar
      .replace(/\\n/g, " ") // Newline larni bo'sh joy bilan almashtirish
      .replace(/\\t/g, " ") // Tab larni bo'sh joy bilan almashtirish
      .replace(/\n/g, " ") // Haqiqiy newline larni ham tozalash
      .replace(/\t/g, " ") // Haqiqiy tab larni ham tozalash
      .replace(/\\/g, "") // Boshqa backslash larni olib tashlash
      .replace(/,(\s*[}\]])/g, "$1"); // Oxirgi vergullarni olib tashlash

    // Bo'sh string larni to'g'irlash
    cleanText = cleanText.replace(
      /:\s*"([^"]*)"([^,}\]]*)/g,
      (match, content, after) => {
        // Agar qo'shtirnoq ichida noto'g'ri belgilar bo'lsa
        const cleanContent = content.replace(/[^\w\s\-\.]/g, "");
        return `: "${cleanContent}"${after}`;
      }
    );

    try {
      return JSON.parse(cleanText);
    } catch (secondError) {
      console.error("JSON cleaning failed too:", secondError);
      console.log("Clean text:", cleanText);

      // Oxirgi urinish: oddiy structure yaratish
      return {
        results: [],
        error: "Failed to parse Gemini response",
        rawResponse: text.substring(0, 500) + "...",
      };
    }
  }
};

// Imlo tekshirish uchun RapidAPI Gemini so'rovi
export const checkSpelling = async (text) => {
  const script = detectScript(text);
  const isLatin = script === "latin" || script === "mixed";

  const prompt = `You are a Karakalpak language spell checker. Analyze the following text for spelling errors.

Text: "${text}"
Script: ${isLatin ? "Latin" : "Cyrillic"}

Instructions:
1. Check each word for spelling errors
2. Mark words as correct (true) or incorrect (false)
3. For incorrect words, provide 1-3 correct suggestions
4. Return ONLY a valid JSON object

Expected JSON format:
{
  "results": [
    {
      "word": "word1",
      "isCorrect": true,
      "suggestions": []
    },
    {
      "word": "word2",
      "isCorrect": false,
      "suggestions": ["correction1", "correction2"]
    }
  ]
}

Response must be valid JSON only. No explanations or additional text.`;

  try {
    const content = await sendGeminiRequest(prompt);
    console.log("Raw Gemini response:", content);

    // JSON ni tozalash va parse qilish
    const parsedResult = cleanAndParseJSON(content);

    if (!parsedResult.results) {
      // Agar results yo'q bo'lsa, fallback yaratish
      console.warn("No results in parsed data, creating fallback");
      const words = text.split(/\s+/).filter((w) => w.trim());
      parsedResult.results = words.map((word) => ({
        word: word.replace(/[.,!?;:"'()]/g, ""),
        isCorrect: true, // Default to correct if parsing failed
        suggestions: [],
      }));
    }

    // So'zlarning pozitsiyalarini hisoblash
    const words = text.split(/\s+/);
    let currentPos = 0;

    parsedResult.results.forEach((result) => {
      const wordIndex = words.findIndex((word, index) => {
        const cleanWord = word.replace(/[.,!?;:"'()]/g, "").toLowerCase();
        return cleanWord === result.word.toLowerCase() && index >= currentPos;
      });

      if (wordIndex !== -1) {
        const beforeWords = words.slice(0, wordIndex).join(" ");
        result.start = beforeWords.length + (beforeWords ? 1 : 0);
        result.end = result.start + result.word.length;
        currentPos = wordIndex + 1;
      } else {
        // Agar pozitsiya topilmasa, taxminiy pozitsiya
        result.start = 0;
        result.end = result.word.length;
      }
    });

    // Statistika hisoblash
    const totalWords = words.length;
    const incorrectWords = parsedResult.results.filter(
      (r) => !r.isCorrect
    ).length;
    const correctWords = totalWords - incorrectWords;
    const accuracy =
      totalWords > 0 ? ((correctWords / totalWords) * 100).toFixed(1) : 100;

    parsedResult.statistics = {
      totalWords,
      correctWords,
      incorrectWords,
      accuracy: parseFloat(accuracy),
      textLength: text.length,
      scriptType: script,
    };

    return {
      success: true,
      data: parsedResult,
    };
  } catch (error) {
    console.error("RapidAPI Gemini API error:", error);
    return {
      success: false,
      error: error.message || "RapidAPI Gemini bilan bog'lanishda xato",
    };
  }
};

// Matnni to'liq to'g'irlash
export const correctText = async (text) => {
  const script = detectScript(text);
  const isLatin = script === "latin" || script === "mixed";

  const prompt = `You are a Karakalpak language text corrector. Fix all spelling errors in the following text.

Original text: "${text}"
Script: ${isLatin ? "Latin" : "Cyrillic"}

Instructions:
- Correct all spelling errors
- Keep original text structure and punctuation
- Return only the corrected text
- Do not add explanations or additional text

Corrected text:`;

  try {
    const correctedText = await sendGeminiRequest(prompt);

    return {
      success: true,
      data: {
        original: text,
        corrected: correctedText.trim(),
      },
    };
  } catch (error) {
    console.error("RapidAPI Gemini API error:", error);
    return {
      success: false,
      error: error.message || "RapidAPI Gemini bilan bog'lanishda xato",
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
    ? `Convert this Karakalpak text from Cyrillic to Latin script.

Text: "${text}"

Conversion rules:
а→a, ә→ә, б→b, в→v, г→g, ғ→ğ, д→d, е→e, ё→yo, ж→j, з→z, и→i, й→y, к→k, қ→q, л→l, м→m, н→n, ң→ń, о→o, ө→ö, п→p, р→r, с→s, т→t, у→u, ү→ü, ў→w, ф→f, х→x, ҳ→h, ц→c, ч→ch, ш→sh, щ→shh, ъ→', ы→ı, ь→', э→e, ю→yu, я→ya

Return only the converted text, nothing else.`
    : `Convert this Karakalpak text from Latin to Cyrillic script.

Text: "${text}"

Conversion rules:
a→а, ә→ә, b→б, v→в, g→г, ğ→ғ, d→д, e→е, j→ж, z→з, i→и, ı→ы, y→й, k→к, q→қ, l→л, m→м, n→н, ń→ң, o→о, ö→ө, p→п, r→р, s→с, t→т, u→у, ü→ү, w→ў, f→ф, x→х, h→ҳ, c→ц, ch→ч, sh→ш, yu→ю, ya→я

Return only the converted text, nothing else.`;

  try {
    const convertedText = await sendGeminiRequest(prompt);

    return {
      success: true,
      data: {
        original: text,
        converted: convertedText.trim(),
        from: sourceScript,
        to: targetScript,
      },
    };
  } catch (error) {
    console.error("RapidAPI Gemini API error:", error);
    return {
      success: false,
      error: error.message || "RapidAPI Gemini bilan bog'lanishda xato",
    };
  }
};

// Auto transliteratsiya
export const autoTransliterate = async (text) => {
  const sourceScript = detectScript(text);
  const targetScript = sourceScript === "cyrillic" ? "latin" : "cyrillic";

  return await transliterate(text, targetScript);
};

// Matnni yaxshilash - ma'nosini o'zgartirmasdan mukammallashtirish
export const improveText = async (text, options = {}) => {
  const {
    language = "uz",
    script,
    style = "professional",
    level = 3,
  } = options;

  const langMap = {
    uz: "o'zbek",
    kaa: "qoraqalpoq",
    ru: "rus",
  };

  const styleMap = {
    professional: {
      uz: "professional va rasmiy",
      kaa: "профессионал ҳәм расмий",
      ru: "профессиональный и официальный",
    },
    academic: {
      uz: "ilmiy va akademik",
      kaa: "ғылыми ҳәм академиялық",
      ru: "научный и академический",
    },
    literary: {
      uz: "adabiy va go'zal",
      kaa: "әдебий ҳәм сулыў",
      ru: "литературный и красивый",
    },
    formal: {
      uz: "rasmiy va qat'iy",
      kaa: "расмий ҳәм қатъий",
      ru: "официальный и строгий",
    },
    friendly: {
      uz: "do'stona va samimiy",
      kaa: "достлық ҳәм самимий",
      ru: "дружелюбный и искренний",
    },
  };

  const levelMap = {
    1: {
      uz: "minimal o'zgarish - faqat eng zarur",
      kaa: "минимал өзгериў - тек ең қәжет",
      ru: "минимальные изменения - только самое необходимое",
    },
    2: {
      uz: "engil yaxshilash",
      kaa: "жеңил жақсылластырыў",
      ru: "легкое улучшение",
    },
    3: {
      uz: "o'rtacha yaxshilash",
      kaa: "орташа жақсылластырыў",
      ru: "среднее улучшение",
    },
    4: {
      uz: "kuchli yaxshilash",
      kaa: "күшли жақсылластырыў",
      ru: "сильное улучшение",
    },
    5: {
      uz: "maksimal yaxshilash - to'liq qayta ishlash",
      kaa: "максимал жақсылластырыў - толық қайта ишлеү",
      ru: "максимальное улучшение - полная переработка",
    },
  };

  const langName = langMap[language] || "o'zbek";
  const styleDesc =
    styleMap[style]?.[language] || styleMap.professional[language];
  const levelDesc = levelMap[level]?.[language] || levelMap[3][language];

  let prompt = "";

  if (language === "uz") {
    prompt = `Siz professional matn muharriri va yozuvchi siz. Quyidagi matnni yaxshilang va mukammallashtiring.

Asl matn: "${text}"

Vazifangiz:
1. Matn ma'nosini mutlaqo o'zgartirmang
2. Asosiy g'oyalarni saqlang
3. Yozuv sifatini oshiring va ${styleDesc} uslubda qayta yozing
4. ${levelDesc} qiling
5. Grammatik va uslubiy xatolarni to'g'rilang
6. Matnni yanada aniq, tushunarli va ta'sirli qiling
7. O'zbek tilida mukammal imloviy to'g'rilik bilan yozing

Qoidalar:
- Matnning asosiy ma'nosini o'zgartirmang
- Faktlarni o'zgartirmang  
- Faqat yozuv sifatini yaxshilang
- Professional va adabiy til ishlatring
- Takrorlarni kamaytiring
- Matnni ravon va o'qishli qiling

Faqat yaxshilangan matnni qaytaring, boshqa tushuntirish bermang. iltimos javobni ${script} uslubda yozing`;
  } else if (language === "kaa") {
    prompt = `Сиз профессионал мәтин муҳаррири ҳәм жазыўшысыз. Төмендеги мәтинди жақсыластырың ҳәм мукәммәллестириң.

Асыл мәтин: "${text}"

Сиздиң ўазыйпаңыз:
1. Мәтин мәнисин мутлақ өзгертпең
2. Тийкарғы идеяларды сақлаң
3. Жазыў сапасын көтериң ҳәм ${styleDesc} услубта қайта жазың
4. ${levelDesc} қылың
5. Грамматикалық ҳәм услубий қәтелерди дүзетиң
6. Мәтинди одан да анық, түсиникли ҳәм тәсирли қылың
7. Қарақалпақ тилинде мукәммәл имлалық дурыслық пенен жазың

Қағыйдалар:
- Мәтинниң тийкарғы мәнисин өзгертпең
- Фактларды өзгертпең
- Тек жазыў сапасын жақсыластырың
- Профессионал ҳәм әдебий тил қоллаң
- Тақырарларды азайтың
- Мәтинди раўан ҳәм оқылыслы қылың
 
Тек жақсыластырылған мәтинди қайтарың, басқа түсиндирме бериң. Илтимас, қарақалпақ тилинде профессионал болсын. Және әлипбе ${script} болсын.`;
  } else {
    prompt = `Вы профессиональный редактор и писатель. Улучшите и усовершенствуйте следующий текст.

Исходный текст: "${text}"

Ваша задача:
1. Не изменяйте смысл текста ни в коем случае
2. Сохраните основные идеи
3. Повысьте качество письма и перепишите в ${styleDesc} стиле
4. Выполните ${levelDesc}
5. Исправьте грамматические и стилистические ошибки
6. Сделайте текст более точным, понятным и эффективным
7. Пишите с безупречной орфографической правильностью на русском языке

Правила:
- Не изменяйте основной смысл текста
- Не изменяйте факты
- Улучшайте только качество письма
- Используйте профессиональный и литературный язык
- Уменьшите повторы
- Сделайте текст плавным и читаемым

Верните только улучшенный текст, без дополнительных объяснений.`;
  }

  try {
    const improvedText = await sendGeminiRequest(prompt);

    return {
      success: true,
      data: {
        original: text,
        improved: improvedText.trim(),
        language: language,
        style: style,
        level: level,
        improved_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Text improvement error:", error);
    return {
      success: false,
      error: error.message || "Matn yaxshilashda xato",
    };
  }
};

// Matnni tekshirish - yuridik hujjat yaratish uchun mos yoki yo'qligini aniqlash
export const validateInput = async (text, language = "uz") => {
  const langMap = {
    uz: "o'zbek",
    kaa: "qoraqalpoq",
    ru: "rus",
  };

  const langName = langMap[language] || "o'zbek";

  const prompt = `Siz professional matn tahlilchisiz. Quyidagi matnni tahlil qiling va yuridik hujjat (shartnoma, kelishuv, ariza, va hokazo) yaratish uchun mos yoki yo'qligini aniqlang.

Matn: "${text}"
Til: ${langName}

Tekshirish mezonlari:
1. Matn ma'noli va tushunarli bo'lishi kerak
2. Aniq bir mavzu yoki maqsadga tegishli bo'lishi kerak 
3. "dasdasda", "test", "aaa" kabi ma'nosiz matnlar bo'lmasligi kerak
4. Yuridik hujjat yaratish uchun yetarli ma'lumot bo'lishi kerak
5. Kamida 2-3 ta asosiy g'oya yoki faktni o'z ichiga olishi kerak

Javob formatini JSON ko'rinishida bering:
{
  "isValid": true/false,
  "reason": "nima uchun mos/mos emas",
  "suggestions": ["taklif 1", "taklif 2", "taklif 3"],
  "topic": "matn mavzusi",
  "confidence": 85
}

Faqat JSON formatda javob bering.`;

  try {
    const content = await sendGeminiRequest(prompt);
    console.log("Validation response:", content);

    const parsedResult = cleanAndParseJSON(content);

    return {
      success: true,
      data: parsedResult,
    };
  } catch (error) {
    console.error("Validation error:", error);
    return {
      success: false,
      error: error.message || "Matn tekshirishda xato",
    };
  }
};

// Yuridik hujjat yaratish
export const generateDocument = async (
  inputText,
  documentType,
  language = "uz"
) => {
  const langMap = {
    uz: {
      name: "o'zbek",
      sample: "Rasmiy hujjat namunasi o'zbek tilida",
    },
    kaa: {
      name: "qoraqalpoq",
      sample: "Расмий ҳужжат намунаси қарақалпақ тилинде",
    },
    ru: {
      name: "rus",
      sample: "Образец официального документа на русском языке",
    },
  };

  const docTypeMap = {
    contract:
      language === "uz"
        ? "Shartnoma"
        : language === "kaa"
        ? "Шартнама"
        : "Договор",
    agreement:
      language === "uz"
        ? "Kelishuv"
        : language === "kaa"
        ? "Келисув"
        : "Соглашение",
    statement:
      language === "uz"
        ? "Bayonot"
        : language === "kaa"
        ? "Баянат"
        : "Заявление",
    application:
      language === "uz" ? "Ariza" : language === "kaa" ? "Ариза" : "Заявление",
    complaint:
      language === "uz" ? "Shikoyat" : language === "kaa" ? "Шикоят" : "Жалоба",
  };

  const selectedLang = langMap[language] || langMap.uz;
  const docTypeName = docTypeMap[documentType] || docTypeMap.contract;

  let prompt = "";

  if (language === "uz") {
    prompt = `Siz professional yuridik hujjat yozuvchi siz. Quyidagi ma'lumotlar asosida rasmiy "${docTypeName}" hujjatini o'zbek tilida yarating.

Asosiy ma'lumotlar: "${inputText}"

Hujjat talablari:
1. Rasmiy yuridik format va til ishlatilishi
2. Barcha kerakli bo'limlar mavjud bo'lishi (sarlavha, asosiy qism, imzo joyi)
3. Professional va aniq ifodalar
4. Sana va joy uchun bo'sh joylar qoldirish
5. Hujjat yuridik jihatdan to'g'ri va amal qiladigan bo'lishi
6. O'zbek tilida imloviy xatosiz yozilishi

Hujjat strukturasi:
- Sarlavha
- Tomonlar (agar kerak bo'lsa)
- Asosiy mazmun
- Shartlar (agar kerak bo'lsa)  
- Sanalar va imzo joylari

Faqat tayyor hujjat matnini qaytaring, boshqa tushuntirish bermang.`;
  } else if (language === "kaa") {
    prompt = `Сиз профессионал юридикалық ҳужжат жазуўшысыз. Төмендеги мағлыўматлар асасында расмий "${docTypeName}" ҳужжатын қарақалпақ тилинде жаратың.

Асосий мағлыўматлар: "${inputText}"

Ҳужжат талаплары:
1. Расмий юридикалық формат ҳәм тил қолланылыўы
2. Барлық қәжетли бөлимлер мәвжуд болыўы (сарлавҳа, асосий бөлим, қол қойыў жәри)
3. Профессионал ҳәм анық ифадалар
4. Сана ҳәм жер ушын бос жерлер қалдырыў
5. Ҳужжат юридикалық жағынан дурыс ҳәм әмел қылатуғын болыўы
6. Қарақалпақ тилинде имловий хатасыз жазылыўы

Ҳужжат структурасы:
- Сарлавҳа
- Тәреплер (егер қәжет болса)
- Асосий мазмуны
- Шартлар (егер қәжет болса)
- Саналар ҳәм қол қойыў жерлери

Тек тайяр ҳужжат мәтинин қайтарың, басқа түсиндириў бермең.`;
  } else {
    prompt = `Вы профессиональный составитель юридических документов. На основе следующей информации создайте официальный документ "${docTypeName}" на русском языке.

Основная информация: "${inputText}"

Требования к документу:
1. Использование официального юридического формата и языка
2. Наличие всех необходимых разделов (заголовок, основная часть, место для подписи)
3. Профессиональные и точные выражения
4. Оставление пустых мест для даты и места
5. Документ должен быть юридически корректным и действующим
6. Написание на русском языке без орфографических ошибок

Структура документа:
- Заголовок
- Стороны (если необходимо)
- Основное содержание
- Условия (если необходимо)
- Даты и места для подписей

Верните только готовый текст документа, без дополнительных объяснений.`;
  }

  try {
    const documentText = await sendGeminiRequest(prompt);

    return {
      success: true,
      data: {
        document: documentText.trim(),
        type: documentType,
        language: language,
        generated: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Document generation error:", error);
    return {
      success: false,
      error: error.message || "Hujjat yaratishda xato",
    };
  }
};

// So'z takliflarini olish
export const getWordSuggestions = async (word, limit = 5) => {
  const script = detectScript(word);
  const isLatin = script === "latin" || script === "mixed";

  const prompt = `Provide ${limit} spelling suggestions for the Karakalpak word "${word}" written in ${
    isLatin ? "Latin" : "Cyrillic"
  } script.

Return response ONLY in JSON format:
{
  "suggestions": [
    {
      "word": "suggestion_1",
      "confidence": 95
    },
    {
      "word": "suggestion_2", 
      "confidence": 90
    }
  ]
}

Return ONLY JSON response.`;

  try {
    const content = await sendGeminiRequest(prompt);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : content;

    const parsedResult = JSON.parse(jsonContent);

    return {
      success: true,
      data: parsedResult.suggestions || [],
    };
  } catch (error) {
    console.error("RapidAPI Gemini API error:", error);
    return {
      success: false,
      error: error.message || "RapidAPI Gemini bilan bog'lanishda xato",
    };
  }
};

// API connection test
export const testConnection = async () => {
  try {
    const testPrompt = `Test API connection. Return this exact JSON:
{
  "status": "connected",
  "message": "RapidAPI Gemini working"
}`;

    const response = await sendGeminiRequest(testPrompt);
    console.log("Test response:", response);

    // JSON parse qilishga harakat qilish
    try {
      const parsed = cleanAndParseJSON(response);
      return {
        success: true,
        message: "RapidAPI Gemini connection successful",
        response: response,
        parsed: parsed,
      };
    } catch (parseError) {
      return {
        success: true,
        message: "RapidAPI connected but JSON parsing issue",
        response: response,
        parseError: parseError.message,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Batch imlo tekshirish
export const batchCheckSpelling = async (texts) => {
  const results = [];

  for (const text of texts) {
    try {
      const result = await checkSpelling(text);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        text: text,
      });
    }
  }

  return {
    success: true,
    data: results,
  };
};
