import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '../config/env';
import prisma from '../config/database';

export interface AssistantResponse {
  answer: string;
  sourceType: 'GEMINI_AI' | 'DETERMINISTIC_GROUNDED_ENGINE';
  databaseFacts: string[];
  suggestedActions?: { label: string; url: string }[];
  audioText?: string;
}

/**
 * Retrieves live database context to ground all AI answers
 */
async function getDatabaseGroundingContext(userId?: string) {
  const [topCrops, recentPrices, recentDemands, activePools, schemes] = await Promise.all([
    prisma.crop.findMany({ take: 8, select: { name: true, category: true, typicalShelfLifeDays: true } }),
    prisma.marketPrice.findMany({
      take: 6,
      orderBy: { priceDate: 'desc' },
      include: { crop: { select: { name: true } } },
    }),
    prisma.marketDemand.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { crop: { select: { name: true } } },
    }),
    prisma.supplyPool.findMany({
      where: { status: 'OPEN' },
      take: 5,
      include: { crop: { select: { name: true } } },
    }),
    prisma.governmentScheme.findMany({
      where: { isActive: true },
      take: 5,
      select: { schemeName: true, shortCode: true, benefitsDescription: true, targetFarmerType: true },
    }),
  ]);

  let userContext = '';
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: {
          include: {
            farms: true,
            farmerCrops: { include: { crop: true } },
          },
        },
        buyerProfile: {
          include: {
            purchaseRequirements: { include: { crop: true } },
          },
        },
      },
    });

    if (user?.farmerProfile) {
      const crops = user.farmerProfile.farmerCrops.map(
        (c) => `${c.crop.name} (${c.availableQuantity} ${c.unit} @ ₹${c.expectedPricePerUnit}/unit)`
      );
      userContext = `Current Farmer: ${user.name}, Total land: ${user.farmerProfile.totalAcres} acres, Listed produce: ${crops.join(', ') || 'None yet'}`;
    } else if (user?.buyerProfile) {
      const reqs = user.buyerProfile.purchaseRequirements.map(
        (r) => `${r.crop.name} (${r.quantity} ${r.unit} max ₹${r.maxPricePerUnit})`
      );
      userContext = `Current Buyer: ${user.name} (${user.buyerProfile.businessName}), Type: ${user.buyerProfile.businessType}, Active requirements: ${reqs.join(', ') || 'None yet'}`;
    }
  }

  return {
    topCrops,
    recentPrices,
    recentDemands,
    activePools,
    schemes,
    userContext,
  };
}

/**
 * Intelligent deterministic fallback engine grounded in live database data
 */
function generateDeterministicAnswer(
  query: string,
  language: 'en' | 'ta' | 'hi',
  ctx: Awaited<ReturnType<typeof getDatabaseGroundingContext>>
): AssistantResponse {
  const q = query.toLowerCase();
  const dbFacts: string[] = [];

  // 1. Price queries
  if (q.includes('price') || q.includes('விலை') || q.includes('rate') || q.includes('भाव') || q.includes('दाम')) {
    const matchedPrice = ctx.recentPrices.find(
      (p) => q.includes(p.crop.name.toLowerCase()) || q.includes('tomato') || q.includes('தக்காளி') || q.includes('टमाटर')
    ) || ctx.recentPrices[0];

    if (matchedPrice) {
      dbFacts.push(
        `[DATABASE FACT] ${matchedPrice.crop.name} at ${matchedPrice.marketName}, ${matchedPrice.district}: Modal Price ₹${matchedPrice.modalPrice}/kg (Range ₹${matchedPrice.minPrice} - ₹${matchedPrice.maxPrice}). Trend: ${matchedPrice.trendDirection}.`
      );

      if (language === 'ta') {
        const text = `சந்தைத் தரவுப்படி, ${matchedPrice.crop.name} விலை கிலோவிற்கு சராசரியாக ₹${matchedPrice.modalPrice} ஆக உள்ளது (குறைந்தபட்சம் ₹${matchedPrice.minPrice}, அதிகபட்சம் ₹${matchedPrice.maxPrice}). விலை போக்கு: ${matchedPrice.trendDirection}. நீங்கள் AgriBridge Pooling மூலம் மொத்தமாக விற்பனை செய்தால் நல்ல லாபம் பெறலாம்.`;
        return {
          answer: `[DATABASE FACT]\n${dbFacts[0]}\n\n[AI EXPLANATION]\n${text}`,
          sourceType: 'DETERMINISTIC_GROUNDED_ENGINE',
          databaseFacts: dbFacts,
          audioText: text,
          suggestedActions: [{ label: 'சந்தை விலைகளை பார்க்க', url: '/market' }],
        };
      } else if (language === 'hi') {
        const text = `मार्केट डेटा के अनुसार, ${matchedPrice.crop.name} का औसत मंडी भाव ₹${matchedPrice.modalPrice}/किग्रा है (न्यूनतम ₹${matchedPrice.minPrice} - अधिकतम ₹${matchedPrice.maxPrice}). ट्रेंड: ${matchedPrice.trendDirection}. AgriBridge सप्लाई पूल में शामिल होकर आप बेहतर थोक मूल्य प्राप्त कर सकते हैं।`;
        return {
          answer: `[DATABASE FACT]\n${dbFacts[0]}\n\n[AI EXPLANATION]\n${text}`,
          sourceType: 'DETERMINISTIC_GROUNDED_ENGINE',
          databaseFacts: dbFacts,
          audioText: text,
          suggestedActions: [{ label: 'मंडी भाव देखें', url: '/market' }],
        };
      } else {
        const text = `According to verified platform mandi feeds, ${matchedPrice.crop.name} is trading at a modal price of ₹${matchedPrice.modalPrice}/kg in ${matchedPrice.marketName} (range ₹${matchedPrice.minPrice} - ₹${matchedPrice.maxPrice}/kg). Price trend is ${matchedPrice.trendDirection}. Pooling your harvest with nearby farmers enables you to target large B2B buyers at optimal pricing.`;
        return {
          answer: `[DATABASE FACT]\n${dbFacts[0]}\n\n[AI EXPLANATION]\n${text}`,
          sourceType: 'DETERMINISTIC_GROUNDED_ENGINE',
          databaseFacts: dbFacts,
          audioText: text,
          suggestedActions: [{ label: 'View Live Market Board', url: '/market' }],
        };
      }
    }
  }

  // 2. Scheme queries
  if (q.includes('scheme') || q.includes('திட்டம்') || q.includes('திட்டங்கள்') || q.includes('योजना') || q.includes('subsidy')) {
    const schemeList = ctx.schemes.slice(0, 3);
    schemeList.forEach((s) => {
      dbFacts.push(`[DATABASE FACT] ${s.schemeName} (${s.shortCode}): ${s.benefitsDescription} for ${s.targetFarmerType}.`);
    });

    if (language === 'ta') {
      const text = `உங்களுக்குப் பரிந்துரைக்கப்படும் முக்கிய அரசு திட்டங்கள்:\n1. பி.எம்-கிசான் (PM-KISAN): ஆண்டுக்கு ₹6,000 நேரடி உதவி.\n2. பயிர் காப்பீட்டுத் திட்டம் (PMFBY): இயற்கை இடர்பாடுகளுக்கான நிதிப் பாதுகாப்பு.\n3. SMAM திட்டம்: விவசாய கருவிகளுக்கு மானியம்.\n\nமேலும் விவரங்களை அரசாங்க அதிகாரப்பூர்வ போர்ட்டலில் சரிபார்க்கவும்.`;
      return {
        answer: `[DATABASE FACT]\n${dbFacts.join('\n')}\n\n[AI EXPLANATION]\n${text}`,
        sourceType: 'DETERMINISTIC_GROUNDED_ENGINE',
        databaseFacts: dbFacts,
        audioText: text,
        suggestedActions: [{ label: 'அரசு திட்டங்கள் பக்கம்', url: '/farmer/schemes' }],
      };
    } else if (language === 'hi') {
      const text = `प्रमुख सरकारी योजनाएं:\n1. पीएम-किसान: ₹6,000 वार्षिक प्रत्यक्ष सहायता।\n2. पीएम फसल बीमा योजना (PMFBY): फसलों की सुरक्षा।\n3. कृषि यंत्रीकरण उप-मिशन (SMAM): कृषि उपकरणों पर सब्सिडी।\n\nविस्तृत जानकारी हेतु आधिकारिक पोर्टल पर जांच करें।`;
      return {
        answer: `[DATABASE FACT]\n${dbFacts.join('\n')}\n\n[AI EXPLANATION]\n${text}`,
        sourceType: 'DETERMINISTIC_GROUNDED_ENGINE',
        databaseFacts: dbFacts,
        audioText: text,
        suggestedActions: [{ label: 'सरकारी योजनाएं देखें', url: '/farmer/schemes' }],
      };
    } else {
      const text = `Based on our verified schemes database, key programs available for small and marginal farmers include PM-KISAN (direct income support of ₹6,000/year), PMFBY (Pradhan Mantri Fasal Bima Yojana for crop loss protection), and SMAM (farm machinery subsidies). Please use our Scheme Eligibility Calculator to check your exact criteria.`;
      return {
        answer: `[DATABASE FACT]\n${dbFacts.join('\n')}\n\n[AI EXPLANATION]\n${text}`,
        sourceType: 'DETERMINISTIC_GROUNDED_ENGINE',
        databaseFacts: dbFacts,
        audioText: text,
        suggestedActions: [{ label: 'Check Scheme Eligibility', url: '/farmer/schemes' }],
      };
    }
  }

  // 3. Demand queries
  if (q.includes('demand') || q.includes('தேவை') || q.includes('माग') || q.includes('buyer') || q.includes('bulk')) {
    const dem = ctx.recentDemands[0];
    if (dem) {
      dbFacts.push(
        `[DATABASE FACT] Active buyer requirement for ${dem.crop.name} in ${dem.district}, ${dem.state}: ${dem.requiredQuantity} kg requested by ${dem.buyerType} with average offered price ₹${dem.avgOfferedPrice}/kg (Urgency: ${dem.urgencyLevel}).`
      );
    }

    if (language === 'ta') {
      const text = `தற்போது சில்லறை மற்றும் மொத்த வாங்குபவர்களிடம் இருந்து காய்கறிகளுக்கு அதிக தேவை உள்ளது. குறிப்பாக தக்காளி, வெங்காயம் மற்றும் கேரட் தேவைகள் தீவிரமாக உள்ளன. நீங்கள் உங்கள் விளைச்சலை சப்ளை பூலில் சேர்த்து இந்த வாங்குபவர்களுடன் உடனடியாக இணைக்கப்படலாம்.`;
      return {
        answer: `[DATABASE FACT]\n${dbFacts[0] || 'Platform demand active'}\n\n[AI EXPLANATION]\n${text}`,
        sourceType: 'DETERMINISTIC_GROUNDED_ENGINE',
        databaseFacts: dbFacts,
        audioText: text,
        suggestedActions: [{ label: 'சப்ளை பூல்களை பார்க்க', url: '/farmer/pools' }],
      };
    } else if (language === 'hi') {
      const text = `वर्तमान में थोक खरीदारों द्वारा टमाटर, प्याज और सब्जियों की अच्छी मांग है। आप अपनी उपज को सप्लाई पूल में जोड़कर इन खरीदारों से सीधे जुड़ सकते हैं और परिवहन लागत में बचत कर सकते हैं।`;
      return {
        answer: `[DATABASE FACT]\n${dbFacts[0] || 'Platform demand active'}\n\n[AI EXPLANATION]\n${text}`,
        sourceType: 'DETERMINISTIC_GROUNDED_ENGINE',
        databaseFacts: dbFacts,
        audioText: text,
        suggestedActions: [{ label: 'सप्लाई पूल देखें', url: '/farmer/pools' }],
      };
    } else {
      const text = `AgriBridge currently has active verified B2B purchase requests across retail and processing hubs. When individual farmers contribute quantities (e.g. 50 kg or 100 kg) to a Supply Pool, our matching engine aggregates them into commercial batches (500 kg+) and automatically calculates optimal pickup logistics.`;
      return {
        answer: `[DATABASE FACT]\n${dbFacts[0] || 'Active B2B purchase pools in system'}\n\n[AI EXPLANATION]\n${text}`,
        sourceType: 'DETERMINISTIC_GROUNDED_ENGINE',
        databaseFacts: dbFacts,
        audioText: text,
        suggestedActions: [{ label: 'Browse Supply Pools', url: '/farmer/pools' }],
      };
    }
  }

  // 4. Default / General platform guide
  dbFacts.push(
    `[DATABASE FACT] AgriBridge platform connects ${ctx.topCrops.length}+ crop varieties across smallholder farmers and verified commercial buyers with multi-stop route optimization.`
  );

  if (language === 'ta') {
    const text = `வணக்கம்! அக்ரிபிரிட்ஜ் (AgriBridge) உதவியாளர் உங்களை வரவேற்கிறது. நீங்கள் சந்தை விலைகள், சப்ளை பூலிங், அரசு திட்டங்கள், அல்லது ஆர்டர் நிலவரம் குறித்து கேட்கலாம். உதாரணம்: "இன்றைய தக்காளி விலை என்ன?" அல்லது "எனக்கு என்ன அரசு திட்டங்கள் கிடைக்கும்?"`;
    return {
      answer: `[DATABASE FACT]\n${dbFacts[0]}\n\n[AI EXPLANATION]\n${text}`,
      sourceType: 'DETERMINISTIC_GROUNDED_ENGINE',
      databaseFacts: dbFacts,
      audioText: text,
      suggestedActions: [{ label: 'சந்தை நுண்ணறிவு', url: '/market' }, { label: 'சப்ளை பூல்கள்', url: '/farmer/pools' }],
    };
  } else if (language === 'hi') {
    const text = `नमस्ते! AgriBridge सहायक में आपका स्वागत है। आप मंडी भाव, सामूहिक बिक्री (सप्लाई पूल), सरकारी योजनाएं या ऑर्डर ट्रैकिंग के बारे में पूछ सकते हैं। उदाहरण: "टमाटर का आज का भाव क्या है?" या "मेरे लिए कौन सी योजनाएं उपलब्ध हैं?"`;
    return {
      answer: `[DATABASE FACT]\n${dbFacts[0]}\n\n[AI EXPLANATION]\n${text}`,
      sourceType: 'DETERMINISTIC_GROUNDED_ENGINE',
      databaseFacts: dbFacts,
      audioText: text,
      suggestedActions: [{ label: 'मंडी भाव', url: '/market' }, { label: 'सप्लाई पूल', url: '/farmer/pools' }],
    };
  } else {
    const text = `Welcome to AgriBridge Assistant! I can assist you with real-time crop market prices, joining or creating pooled supply groups, checking government scheme eligibility, and tracking orders and pickup routes. Try asking: "What is today's tomato price?" or "How does supply pooling work?"`;
    return {
      answer: `[DATABASE FACT]\n${dbFacts[0]}\n\n[AI EXPLANATION]\n${text}`,
      sourceType: 'DETERMINISTIC_GROUNDED_ENGINE',
      databaseFacts: dbFacts,
      audioText: text,
      suggestedActions: [{ label: 'Market Intelligence', url: '/market' }, { label: 'Active Supply Pools', url: '/farmer/pools' }],
    };
  }
}

/**
 * Handles conversational queries from users (voice or text)
 */
export async function askAgriBridgeAssistant(params: {
  query: string;
  userId?: string;
  language?: 'en' | 'ta' | 'hi';
}): Promise<AssistantResponse> {
  const { query, userId, language = 'en' } = params;
  const ctx = await getDatabaseGroundingContext(userId);

  // If Gemini API key is configured, utilize Gemini model with strict grounding
  if (ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim() !== '') {
    try {
      const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
You are the AgriBridge AI Assistant for Indian farmers and B2B buyers.
Answer the user's question clearly in the language: ${language === 'ta' ? 'Tamil' : language === 'hi' ? 'Hindi' : 'English'}.

CRITICAL RULES:
1. You MUST NOT invent market prices, schemes, or fake order numbers.
2. Ground all facts in the provided DATABASE CONTEXT below.
3. Structure your response into these exact 3 sections:
[USER INPUT]
${query}

[DATABASE FACT]
(Summarize the exact facts from context relevant to their query)

[AI EXPLANATION]
(Helpful, clear, empathetic explanation in the selected language)

DATABASE CONTEXT:
${JSON.stringify({
  prices: ctx.recentPrices.map((p) => `${p.crop.name}: Modal ₹${p.modalPrice}/kg in ${p.marketName} (${p.district})`),
  demands: ctx.recentDemands.map((d) => `${d.crop.name}: ${d.requiredQuantity}kg in ${d.district} for ${d.buyerType}`),
  pools: ctx.activePools.map((p) => `${p.poolName}: Target ${p.targetQuantity}kg, Current ${p.currentQuantity}kg`),
  schemes: ctx.schemes.map((s) => `${s.schemeName} (${s.shortCode}): ${s.benefitsDescription}`),
  userProfile: ctx.userContext,
})}
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      return {
        answer: text,
        sourceType: 'GEMINI_AI',
        databaseFacts: ctx.recentPrices.slice(0, 3).map((p) => `${p.crop.name} modal price ₹${p.modalPrice}/kg`),
        audioText: text.replace(/\[USER INPUT\][\s\S]*?\[AI EXPLANATION\]/, '').trim(),
      };
    } catch (error) {
      console.warn('Gemini API call failed or timed out, falling back to deterministic engine:', error);
      return generateDeterministicAnswer(query, language, ctx);
    }
  }

  // Deterministic grounded response fallback
  return generateDeterministicAnswer(query, language, ctx);
}
