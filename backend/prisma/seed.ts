import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting AgriBridge Database Seeding...');

  const isProd = process.env.NODE_ENV === 'production';
  const allowReset = process.env.ALLOW_SEED_RESET === 'true';
  const seedDemoData = process.env.SEED_DEMO_DATA === 'true' || (!isProd && process.env.SEED_DEMO_DATA !== 'false');

  if (isProd && !allowReset) {
    console.log('🔒 Production mode: Skipping destructive table cleanup to protect existing data.');
  } else {
    // Clear existing records in reverse dependency order (Development / Reset only)
    console.log('🧹 Clearing development database tables...');
    await prisma.review.deleteMany();
    await prisma.dispute.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.pickupStop.deleteMany();
    await prisma.pickupRoute.deleteMany();
    await prisma.delivery.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.match.deleteMany();
    await prisma.supplyPoolMember.deleteMany();
    await prisma.supplyPool.deleteMany();
    await prisma.demandPoolMember.deleteMany();
    await prisma.demandPool.deleteMany();
    await prisma.purchaseRequirement.deleteMany();
    await prisma.farmerCrop.deleteMany();
    await prisma.farm.deleteMany();
    await prisma.schemeEligibility.deleteMany();
    await prisma.governmentScheme.deleteMany();
    await prisma.marketDemand.deleteMany();
    await prisma.marketPrice.deleteMany();
    await prisma.crop.deleteMany();
    await prisma.languagePreference.deleteMany();
    await prisma.farmerProfile.deleteMany();
    await prisma.buyerProfile.deleteMany();
    await prisma.user.deleteMany();
    console.log('🧹 Cleaned existing development database tables.');
  }

  // Common password hashes
  const salt = await bcrypt.genSalt(10);
  const farmerPassHash = await bcrypt.hash('Farmer@123', salt);
  const buyerPassHash = await bcrypt.hash('Buyer@123', salt);
  const adminPassHash = await bcrypt.hash('Admin@123', salt);

  // 1. Production Admin Bootstrap or Development Demo Admin
  const bootstrapAdminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const bootstrapAdminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (bootstrapAdminEmail && bootstrapAdminPassword) {
    const customAdminHash = await bcrypt.hash(bootstrapAdminPassword, salt);
    await prisma.user.upsert({
      where: { email: bootstrapAdminEmail.toLowerCase() },
      update: {
        passwordHash: customAdminHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        isVerified: true,
      },
      create: {
        email: bootstrapAdminEmail.toLowerCase(),
        passwordHash: customAdminHash,
        name: 'System Administrator',
        phone: '9840123456',
        role: 'ADMIN',
        status: 'ACTIVE',
        isVerified: true,
        languagePref: {
          create: { languageCode: 'en' },
        },
      },
    });
    console.log(`✅ Production administrator bootstrapped for: ${bootstrapAdminEmail}`);
  } else if (!isProd || allowReset) {
    await prisma.user.upsert({
      where: { email: 'admin@agribridge.demo' },
      update: { passwordHash: adminPassHash },
      create: {
        email: 'admin@agribridge.demo',
        passwordHash: adminPassHash,
        name: 'Dr. Sundaram Swaminathan',
        phone: '9840123456',
        role: 'ADMIN',
        status: 'ACTIVE',
        isVerified: true,
        languagePref: {
          create: { languageCode: 'en' },
        },
      },
    });
    console.log('✅ Seeded demo administrator.');
  }

  // 2. Seed Crops Catalogue (12 crops)
  const cropsData = [
    {
      name: 'Tomato',
      localNamesJson: JSON.stringify({ ta: 'தக்காளி', hi: 'टमाटर', te: 'టమాటా', kn: 'ಟೊಮೆಟೊ' }),
      category: 'VEGETABLE',
      unit: 'kg',
      perishability: 'HIGH',
      typicalShelfLifeDays: 6,
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop',
    },
    {
      name: 'Onion',
      localNamesJson: JSON.stringify({ ta: 'வெங்காயம்', hi: 'प्याज', te: 'ఉల్లిపాయ', kn: 'ಈರುಳ್ಳಿ' }),
      category: 'VEGETABLE',
      unit: 'kg',
      perishability: 'LOW',
      typicalShelfLifeDays: 30,
      imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop',
    },
    {
      name: 'Potato',
      localNamesJson: JSON.stringify({ ta: 'உருளைக்கிழங்கு', hi: 'आलू', te: 'బంగాళాదుంప', kn: 'ಆಲೂಗಡ್ಡೆ' }),
      category: 'VEGETABLE',
      unit: 'kg',
      perishability: 'LOW',
      typicalShelfLifeDays: 45,
      imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop',
    },
    {
      name: 'Carrot',
      localNamesJson: JSON.stringify({ ta: 'கேரட்', hi: 'गाजर', te: 'క్యారెట్', kn: 'ಕ್ಯಾರೆಟ್' }),
      category: 'VEGETABLE',
      unit: 'kg',
      perishability: 'MEDIUM',
      typicalShelfLifeDays: 14,
      imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=600&auto=format&fit=crop',
    },
    {
      name: 'Cabbage',
      localNamesJson: JSON.stringify({ ta: 'முட்டைக்கோஸ்', hi: 'पत्ता गोभी', te: 'క్యాబేజీ', kn: 'ಕೋಸು' }),
      category: 'VEGETABLE',
      unit: 'kg',
      perishability: 'MEDIUM',
      typicalShelfLifeDays: 12,
      imageUrl: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600&auto=format&fit=crop',
    },
    {
      name: 'Cauliflower',
      localNamesJson: JSON.stringify({ ta: 'காலிஃபிளவர்', hi: 'फूलगोभी', te: 'కాలిఫ్లవర్', kn: 'ಹೂಕೋಸು' }),
      category: 'VEGETABLE',
      unit: 'kg',
      perishability: 'HIGH',
      typicalShelfLifeDays: 7,
      imageUrl: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop',
    },
    {
      name: 'Banana (Robusta/G9)',
      localNamesJson: JSON.stringify({ ta: 'வாழைப்பழம்', hi: 'केला', te: 'అరటిపండు', kn: 'ಬಾಳೆಹಣ್ಣು' }),
      category: 'FRUIT',
      unit: 'kg',
      perishability: 'HIGH',
      typicalShelfLifeDays: 6,
      imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop',
    },
    {
      name: 'Mango (Alphonso/Banganapalli)',
      localNamesJson: JSON.stringify({ ta: 'மாம்பழம்', hi: 'आम', te: 'మామిడిపండు', kn: 'ಮಾವಿನಹಣ್ಣು' }),
      category: 'FRUIT',
      unit: 'kg',
      perishability: 'HIGH',
      typicalShelfLifeDays: 8,
      imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop',
    },
    {
      name: 'Paddy Rice (Sona Masoori)',
      localNamesJson: JSON.stringify({ ta: 'நெல்', hi: 'धान / चावल', te: 'వరి', kn: 'ಭತ್ತ' }),
      category: 'GRAIN',
      unit: 'kg',
      perishability: 'LOW',
      typicalShelfLifeDays: 180,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop',
    },
    {
      name: 'Wheat (Sharbati)',
      localNamesJson: JSON.stringify({ ta: 'கோதுமை', hi: 'गेहूं', te: 'గోధుమలు', kn: 'ಗೋಧಿ' }),
      category: 'GRAIN',
      unit: 'kg',
      perishability: 'LOW',
      typicalShelfLifeDays: 180,
      imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop',
    },
    {
      name: 'Brinjal (Eggplant)',
      localNamesJson: JSON.stringify({ ta: 'கத்தரிக்காய்', hi: 'बैंगन', te: 'వంకాయ', kn: 'ಬದನೆಕಾಯಿ' }),
      category: 'VEGETABLE',
      unit: 'kg',
      perishability: 'HIGH',
      typicalShelfLifeDays: 5,
      imageUrl: 'https://images.unsplash.com/photo-1628773822503-930a84d4fb0c?w=600&auto=format&fit=crop',
    },
    {
      name: 'Green Chilli (G4)',
      localNamesJson: JSON.stringify({ ta: 'பச்சை மிளகாய்', hi: 'हरी मिर्च', te: 'పచ్చి మిర్చి', kn: 'ಹಸಿಮೆಣಸಿನಕಾಯಿ' }),
      category: 'SPICE',
      unit: 'kg',
      perishability: 'MEDIUM',
      typicalShelfLifeDays: 10,
      imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop',
    },
  ];

  const createdCrops: Record<string, any> = {};
  for (const c of cropsData) {
    const crop = await prisma.crop.upsert({
      where: { name: c.name },
      update: c,
      create: c,
    });
    createdCrops[c.name] = crop;
  }
  console.log(`✅ Seeded ${Object.keys(createdCrops).length} crops.`);

  const tomatoCrop = createdCrops['Tomato'];
  const onionCrop = createdCrops['Onion'];
  const potatoCrop = createdCrops['Potato'];
  const carrotCrop = createdCrops['Carrot'];

  if (!seedDemoData) {
    console.log('🔒 Production mode: Demo users, demo transactions, and test pools omitted.');
    console.log('✅ Core reference catalogue (Crops, Schemes) verified and seeded successfully.');
    return;
  }

  // 3. Seed 11 Farmers (including primary Demo Farmer + Demo Flow Farmers A, B, C)
  const farmersRaw = [
    {
      email: 'farmer@agribridge.demo',
      name: 'Ramasamy Periasamy (Farmer A)',
      phone: '9842111111',
      lang: 'ta',
      acres: 2.5,
      farmName: 'Periasamy Organic Green Farm',
      village: 'Mohanur',
      district: 'Namakkal',
      state: 'Tamil Nadu',
      lat: 11.0825,
      lon: 78.1432,
      soil: 'Red Sandy Loam',
      crop: tomatoCrop,
      qty: 100, // Farmer A -> 100 kg
      price: 32,
    },
    {
      email: 'farmer.b@agribridge.demo',
      name: 'Murugan Shanmugam (Farmer B)',
      phone: '9842222222',
      lang: 'ta',
      acres: 3.0,
      farmName: 'Murugan Thottam',
      village: 'Rasipuram',
      district: 'Namakkal',
      state: 'Tamil Nadu',
      lat: 11.4037,
      lon: 78.1678,
      soil: 'Alluvial Loam',
      crop: tomatoCrop,
      qty: 150, // Farmer B -> 150 kg
      price: 32,
    },
    {
      email: 'farmer.c@agribridge.demo',
      name: 'Kandasamy Velappan (Farmer C)',
      phone: '9842333333',
      lang: 'ta',
      acres: 4.0,
      farmName: 'Velappan Agro Farms',
      village: 'Paramathi Velur',
      district: 'Namakkal',
      state: 'Tamil Nadu',
      lat: 11.0456,
      lon: 77.9942,
      soil: 'Clay Loam',
      crop: tomatoCrop,
      qty: 250, // Farmer C -> 250 kg
      price: 31,
    },
    {
      email: 'farmer.d@agribridge.demo',
      name: 'Annamalai Natarajan',
      phone: '9842444444',
      lang: 'ta',
      acres: 1.8,
      farmName: 'Kaveri Basin Farms',
      village: 'Tiruchengode',
      district: 'Namakkal',
      state: 'Tamil Nadu',
      lat: 11.3784,
      lon: 77.8924,
      soil: 'Red Loam',
      crop: onionCrop,
      qty: 300,
      price: 28,
    },
    {
      email: 'farmer.e@agribridge.demo',
      name: 'Muthukumar Arumugam',
      phone: '9842555555',
      lang: 'ta',
      acres: 2.2,
      farmName: 'Marutham Integrated Farm',
      village: 'Erode Rural',
      district: 'Erode',
      state: 'Tamil Nadu',
      lat: 11.341,
      lon: 77.7172,
      soil: 'Black Cotton',
      crop: carrotCrop,
      qty: 400,
      price: 45,
    },
    {
      email: 'farmer.f@agribridge.demo',
      name: 'Basavaraj Patil',
      phone: '9842666666',
      lang: 'kn',
      acres: 3.5,
      farmName: 'Patil Krishi Farm',
      village: 'Hoskote',
      district: 'Bengaluru Rural',
      state: 'Karnataka',
      lat: 13.0694,
      lon: 77.7981,
      soil: 'Red Gravelly',
      crop: potatoCrop,
      qty: 600,
      price: 22,
    },
    {
      email: 'farmer.g@agribridge.demo',
      name: 'Venkatesh Gowda',
      phone: '9842777777',
      lang: 'kn',
      acres: 2.8,
      farmName: 'Gowda Horticulture',
      village: 'Kolar Suburb',
      district: 'Kolar',
      state: 'Karnataka',
      lat: 13.1367,
      lon: 78.1292,
      soil: 'Red Sandy',
      crop: tomatoCrop,
      qty: 350,
      price: 33,
    },
    {
      email: 'farmer.h@agribridge.demo',
      name: 'Rameshwar Sharma',
      phone: '9842888888',
      lang: 'hi',
      acres: 2.0,
      farmName: 'Kisan Seva Krishi Farm',
      village: 'Guntur Rural',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      lat: 16.3067,
      lon: 80.4365,
      soil: 'Black Regur',
      crop: createdCrops['Green Chilli (G4)'],
      qty: 200,
      price: 60,
    },
    {
      email: 'farmer.i@agribridge.demo',
      name: 'Srinivasa Rao',
      phone: '9842999999',
      lang: 'te',
      acres: 5.0,
      farmName: 'Krishna Valley Organic',
      village: 'Vijayawada Rural',
      district: 'Krishna',
      state: 'Andhra Pradesh',
      lat: 16.5062,
      lon: 80.648,
      soil: 'Alluvial Delta',
      crop: createdCrops['Paddy Rice (Sona Masoori)'],
      qty: 1200,
      price: 26,
    },
    {
      email: 'farmer.j@agribridge.demo',
      name: 'George Varghese',
      phone: '9842000000',
      lang: 'en',
      acres: 3.2,
      farmName: 'Malabar Spices & Fruit Farm',
      village: 'Wayanad Green Valley',
      district: 'Wayanad',
      state: 'Kerala',
      lat: 11.6854,
      lon: 76.132,
      soil: 'Forest Loam',
      crop: createdCrops['Banana (Robusta/G9)'],
      qty: 500,
      price: 24,
    },
    {
      email: 'farmer.k@agribridge.demo',
      name: 'Selvakumar Thangaraj',
      phone: '9842101010',
      lang: 'ta',
      acres: 1.5,
      farmName: 'Salem Hills Agro',
      village: 'Omalur',
      district: 'Salem',
      state: 'Tamil Nadu',
      lat: 11.7412,
      lon: 78.0423,
      soil: 'Red Soil',
      crop: createdCrops['Mango (Alphonso/Banganapalli)'],
      qty: 350,
      price: 75,
    },
  ];

  const createdFarmers: any[] = [];
  const createdFarmerCrops: any[] = [];

  for (const f of farmersRaw) {
    const user = await prisma.user.create({
      data: {
        email: f.email,
        passwordHash: farmerPassHash,
        name: f.name,
        phone: f.phone,
        role: 'FARMER',
        status: 'ACTIVE',
        isVerified: true,
        languagePref: {
          create: { languageCode: f.lang },
        },
        farmerProfile: {
          create: {
            preferredLanguage: f.lang,
            totalAcres: f.acres,
            bankAccountNumber: `50100${Math.floor(1000000 + Math.random() * 9000000)}`,
            bankIfsc: 'HDFC0000421',
            upiId: `${f.phone}@upi`,
            farms: {
              create: {
                farmName: f.farmName,
                village: f.village,
                district: f.district,
                state: f.state,
                latitude: f.lat,
                longitude: f.lon,
                totalAreaAcres: f.acres,
                soilType: f.soil,
                irrigationType: 'Borewell & Drip Automation',
              },
            },
          },
        },
      },
      include: {
        farmerProfile: {
          include: { farms: true },
        },
      },
    });

    createdFarmers.push(user);

    // Create produce
    const farm = user.farmerProfile!.farms[0];
    const farmerCrop = await prisma.farmerCrop.create({
      data: {
        farmerProfileId: user.farmerProfile!.id,
        farmId: farm.id,
        cropId: f.crop.id,
        availableQuantity: f.qty,
        allocatedQuantity: 0,
        unit: 'kg',
        expectedPricePerUnit: f.price,
        harvestDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // in 4 days
        qualityGrade: 'GRADE_A',
        status: 'AVAILABLE',
        notes: `Freshly handpicked, farm-gate certified Grade A ${f.crop.name}.`,
      },
      include: { crop: true, farm: true },
    });

    createdFarmerCrops.push(farmerCrop);
  }
  console.log(`✅ Seeded ${createdFarmers.length} Farmers with active farms & crop listings.`);

  // 4. Seed 6 Commercial Business Buyers
  const buyersRaw = [
    {
      email: 'buyer@agribridge.demo',
      name: 'FreshDirect Hypermarkets (Buyer A)',
      phone: '9843111111',
      bizName: 'FreshDirect Retail Chains Ltd',
      bizType: 'RETAILER',
      gstin: '33AABCF1234F1Z8',
      address: 'Plot 42, Central Cold Chain Hub, Ambattur Industrial Estate',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600058',
      lat: 13.0827,
      lon: 80.2707,
    },
    {
      email: 'buyer.b@agribridge.demo',
      name: 'Anand Bhavan Grand Hotels (Buyer B)',
      phone: '9843222222',
      bizName: 'Anand Bhavan Hospitality Group',
      bizType: 'HOTEL',
      gstin: '33AABCA9876K1Z2',
      address: '24 Anna Salai, T. Nagar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600017',
      lat: 13.0418,
      lon: 80.2341,
    },
    {
      email: 'buyer.c@agribridge.demo',
      name: 'Kovai Pure Food Processors (Buyer C)',
      phone: '9843333333',
      bizName: 'Kovai Agro Processing Hub',
      bizType: 'FOOD_PROCESSOR',
      gstin: '33AABCK5544J1Z9',
      address: 'SIDCO Industrial Park, Malumichampatti',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641021',
      lat: 10.9167,
      lon: 76.9833,
    },
    {
      email: 'buyer.d@agribridge.demo',
      name: 'Deccan Wholesale Mandi Traders',
      phone: '9843444444',
      bizName: 'Deccan Agro Bulk Wholesalers',
      bizType: 'WHOLESALER',
      gstin: '29AABCD1122G1Z1',
      address: 'Yeshwanthpur APMC Wholesale Complex',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560022',
      lat: 13.0238,
      lon: 77.5489,
    },
    {
      email: 'buyer.e@agribridge.demo',
      name: 'SpiceCoast Exports International',
      phone: '9843555555',
      bizName: 'SpiceCoast Exporters LLP',
      bizType: 'EXPORTER',
      gstin: '32AABCS4455H1Z3',
      address: 'Cochin Port Terminal Road, Willingdon Island',
      city: 'Kochi',
      state: 'Kerala',
      pincode: '682003',
      lat: 9.9312,
      lon: 76.2673,
    },
    {
      email: 'buyer.f@agribridge.demo',
      name: 'GreenTable Gourmet Restaurants',
      phone: '9843666666',
      bizName: 'GreenTable Cloud Kitchens',
      bizType: 'RESTAURANT',
      gstin: '36AABCG7788M1Z4',
      address: 'Hitech City, Madhapur',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
      lat: 17.4483,
      lon: 78.3915,
    },
  ];

  const createdBuyers: any[] = [];
  for (const b of buyersRaw) {
    const user = await prisma.user.create({
      data: {
        email: b.email,
        passwordHash: buyerPassHash,
        name: b.name,
        phone: b.phone,
        role: 'BUYER',
        status: 'ACTIVE',
        isVerified: true,
        languagePref: {
          create: { languageCode: 'en' },
        },
        buyerProfile: {
          create: {
            businessName: b.bizName,
            businessType: b.bizType,
            gstin: b.gstin,
            address: b.address,
            city: b.city,
            state: b.state,
            pincode: b.pincode,
            latitude: b.lat,
            longitude: b.lon,
          },
        },
      },
      include: { buyerProfile: true },
    });
    createdBuyers.push(user);
  }
  console.log(`✅ Seeded ${createdBuyers.length} Verified Commercial B2B Buyers.`);

  // 5. Seed Government Schemes (5 Major National & State Programs)
  const schemesData = [
    {
      schemeName: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
      shortCode: 'PM-KISAN',
      ministry: 'Ministry of Agriculture & Farmers Welfare, GoI',
      description: 'Central sector scheme providing income support of ₹6,000 per year in three equal instalments of ₹2,000 to all landholding farmer families.',
      state: 'All India',
      targetFarmerType: 'Small & Marginal Farmers',
      applicableCropsJson: JSON.stringify(['All']),
      minLandAcres: 0.1,
      maxLandAcres: 5.0,
      maxAnnualIncome: 250000,
      requiredDocumentsJson: JSON.stringify(['Aadhaar Card', 'Land Ownership Record (Khata/Chitta)', 'Bank Passbook / NPCI Linked Account']),
      benefitsDescription: '₹6,000 per annum direct cash transfer directly to beneficiary bank account via DBT.',
      benefitAmount: 6000,
      applicationUrl: 'https://pmkisan.gov.in',
      deadline: 'Ongoing',
    },
    {
      schemeName: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      shortCode: 'PMFBY',
      ministry: 'Ministry of Agriculture & Farmers Welfare, GoI',
      description: 'Comprehensive yield-based crop insurance coverage against non-preventable natural risks from pre-sowing to post-harvest stages.',
      state: 'All India',
      targetFarmerType: 'All Farmers (Loanee & Non-Loanee)',
      applicableCropsJson: JSON.stringify(['Tomato', 'Onion', 'Potato', 'Paddy Rice (Sona Masoori)', 'Wheat (Sharbati)']),
      minLandAcres: 0.1,
      maxLandAcres: 50.0,
      maxAnnualIncome: 1000000,
      requiredDocumentsJson: JSON.stringify(['Land Record (RoR)', 'Sowing Certificate from VAO', 'Cancelled Cheque', 'Aadhaar']),
      benefitsDescription: 'Comprehensive financial compensation up to sum insured value in event of drought, unseasonal rain, pests, or flood damage.',
      benefitAmount: 45000,
      applicationUrl: 'https://pmfby.gov.in',
      deadline: 'Seasonal Cutoff Dates',
    },
    {
      schemeName: 'Sub-Mission on Agricultural Mechanization (SMAM)',
      shortCode: 'SMAM',
      ministry: 'Department of Agriculture & Farmers Welfare',
      description: 'Subsidies up to 50% to 80% for purchase of modern farm machinery, mini-tractors, rotavators, power tillers, and custom hiring centers.',
      state: 'All India',
      targetFarmerType: 'Small, Marginal, SC/ST, and Women Farmers',
      applicableCropsJson: JSON.stringify(['All']),
      minLandAcres: 0.5,
      maxLandAcres: 10.0,
      maxAnnualIncome: 500000,
      requiredDocumentsJson: JSON.stringify(['Aadhaar Card', 'Land Patta Document', 'Quotation from authorized dealer', 'Bank Account']),
      benefitsDescription: '40% to 50% capital subsidy on tractor and modern farm implements (up to ₹1,50,000).',
      benefitAmount: 125000,
      applicationUrl: 'https://agrimachinery.nic.in',
      deadline: 'Open Annual Portal',
    },
    {
      schemeName: 'Agriculture Infrastructure Fund (AIF)',
      shortCode: 'AIF',
      ministry: 'Department of Agriculture, Cooperation & Farmers Welfare',
      description: 'Financing facility for investment in post-harvest management infrastructure, farm-gate cold rooms, sorting-grading units, and pooling centers.',
      state: 'All India',
      targetFarmerType: 'Farmer Producer Organizations (FPOs), SHGs, Aggregators',
      applicableCropsJson: JSON.stringify(['All']),
      minLandAcres: 1.0,
      maxLandAcres: 100.0,
      maxAnnualIncome: 2000000,
      requiredDocumentsJson: JSON.stringify(['Detailed Project Report (DPR)', 'Land Lease/Ownership', 'PAN & Aadhaar', 'Bank Sanction Letter']),
      benefitsDescription: '3% per annum interest subvention on bank loans up to ₹2 Crore for up to 7 years + Credit Guarantee cover.',
      benefitAmount: 300000,
      applicationUrl: 'https://agriinfra.dac.gov.in',
      deadline: 'Valid up to FY 2032-33',
    },
    {
      schemeName: 'Uzhavar Sandhai & Direct Farmer Marketing Scheme',
      shortCode: 'TN-UZHAVAR',
      ministry: 'Department of Agricultural Marketing & Agri Business, Tamil Nadu',
      description: 'Eliminates middleman commission by providing free stall space, digital weighing scales, and direct market access for vegetable and fruit cultivators.',
      state: 'Tamil Nadu',
      targetFarmerType: 'Vegetable and Fruit Cultivators',
      applicableCropsJson: JSON.stringify(['Tomato', 'Onion', 'Carrot', 'Cabbage', 'Brinjal (Eggplant)', 'Green Chilli (G4)']),
      minLandAcres: 0.1,
      maxLandAcres: 5.0,
      maxAnnualIncome: 300000,
      requiredDocumentsJson: JSON.stringify(['Farmer Identity Card issued by Horticulture Dept', 'Land Adangal Record', 'Aadhaar Card']),
      benefitsDescription: 'Zero commission market access, free daily price updates, and subsidized transportation assistance.',
      benefitAmount: 15000,
      applicationUrl: 'https://tnhorticulture.tn.gov.in',
      deadline: 'Ongoing',
    },
  ];

  for (const s of schemesData) {
    await prisma.governmentScheme.upsert({
      where: { shortCode: s.shortCode },
      update: s,
      create: s,
    });
  }
  console.log(`✅ Seeded ${schemesData.length} Government Schemes with rules engine criteria.`);

  // 6. Seed Market Prices (Realistic APMC benchmark prices)
  const marketPricesData = [
    { cropId: tomatoCrop.id, marketName: 'Namakkal APMC Mandi', district: 'Namakkal', state: 'Tamil Nadu', minPrice: 28, maxPrice: 38, modalPrice: 34, trendDirection: 'UP' },
    { cropId: tomatoCrop.id, marketName: 'Koyambedu Wholesale Market', district: 'Chennai', state: 'Tamil Nadu', minPrice: 32, maxPrice: 42, modalPrice: 38, trendDirection: 'UP' },
    { cropId: tomatoCrop.id, marketName: 'Kolar Mandi', district: 'Kolar', state: 'Karnataka', minPrice: 26, maxPrice: 35, modalPrice: 30, trendDirection: 'STABLE' },
    { cropId: onionCrop.id, marketName: 'Nashik Lasalgaon APMC', district: 'Nashik', state: 'Maharashtra', minPrice: 22, maxPrice: 31, modalPrice: 27, trendDirection: 'STABLE' },
    { cropId: onionCrop.id, marketName: 'Ottanchatram Vegetable Market', district: 'Dindigul', state: 'Tamil Nadu', minPrice: 25, maxPrice: 34, modalPrice: 29, trendDirection: 'DOWN' },
    { cropId: potatoCrop.id, marketName: 'Hassan APMC Mandi', district: 'Hassan', state: 'Karnataka', minPrice: 18, maxPrice: 26, modalPrice: 22, trendDirection: 'STABLE' },
    { cropId: carrotCrop.id, marketName: 'Mettupalayam Agri Market', district: 'Coimbatore', state: 'Tamil Nadu', minPrice: 40, maxPrice: 52, modalPrice: 46, trendDirection: 'UP' },
    { cropId: createdCrops['Cabbage'].id, marketName: 'Ooty Hill Produce Center', district: 'Nilgiris', state: 'Tamil Nadu', minPrice: 15, maxPrice: 24, modalPrice: 20, trendDirection: 'STABLE' },
    { cropId: createdCrops['Banana (Robusta/G9)'].id, marketName: 'Tiruchirappalli Fruit Market', district: 'Tiruchirappalli', state: 'Tamil Nadu', minPrice: 20, maxPrice: 28, modalPrice: 25, trendDirection: 'UP' },
    { cropId: createdCrops['Paddy Rice (Sona Masoori)'].id, marketName: 'Thanjavur Grain Mandi', district: 'Thanjavur', state: 'Tamil Nadu', minPrice: 24, maxPrice: 30, modalPrice: 27, trendDirection: 'STABLE' },
    { cropId: createdCrops['Green Chilli (G4)'].id, marketName: 'Guntur Mirchi Yard', district: 'Guntur', state: 'Andhra Pradesh', minPrice: 55, maxPrice: 72, modalPrice: 65, trendDirection: 'UP' },
  ];

  for (const mp of marketPricesData) {
    await prisma.marketPrice.create({
      data: {
        ...mp,
        priceDate: new Date(),
        isDemoData: true,
        source: 'State APMC Mandi Real-Time Benchmark Feed',
      },
    });
  }
  console.log(`✅ Seeded ${marketPricesData.length} Mandi Market Price Records.`);

  // 7. Seed Market Demands
  const demandsData = [
    { cropId: tomatoCrop.id, district: 'Chennai', state: 'Tamil Nadu', requiredQuantity: 5000, urgencyLevel: 'HIGH', buyerType: 'RETAILER', avgOfferedPrice: 36, activeInquiries: 12 },
    { cropId: tomatoCrop.id, district: 'Coimbatore', state: 'Tamil Nadu', requiredQuantity: 3500, urgencyLevel: 'MEDIUM', buyerType: 'FOOD_PROCESSOR', avgOfferedPrice: 33, activeInquiries: 8 },
    { cropId: onionCrop.id, district: 'Bengaluru', state: 'Karnataka', requiredQuantity: 8000, urgencyLevel: 'HIGH', buyerType: 'WHOLESALER', avgOfferedPrice: 28, activeInquiries: 15 },
    { cropId: carrotCrop.id, district: 'Chennai', state: 'Tamil Nadu', requiredQuantity: 2500, urgencyLevel: 'MEDIUM', buyerType: 'HOTEL', avgOfferedPrice: 48, activeInquiries: 6 },
    { cropId: potatoCrop.id, district: 'Hyderabad', state: 'Telangana', requiredQuantity: 6000, urgencyLevel: 'LOW', buyerType: 'RETAILER', avgOfferedPrice: 23, activeInquiries: 9 },
    { cropId: createdCrops['Green Chilli (G4)'].id, district: 'Kochi', state: 'Kerala', requiredQuantity: 1800, urgencyLevel: 'HIGH', buyerType: 'EXPORTER', avgOfferedPrice: 68, activeInquiries: 5 },
  ];

  for (const md of demandsData) {
    await prisma.marketDemand.create({
      data: {
        ...md,
        period: 'Weekly Commercial Batch',
        isDemoData: true,
      },
    });
  }
  console.log(`✅ Seeded Market Demands.`);

  // =========================================================================
  // 8. SEED CORE DEMO SCENARIO 1 (Section 38):
  // Farmer A (100 kg), Farmer B (150 kg), Farmer C (250 kg) pooled into Tomato Bulk Pool (500 kg)
  // Buyer A (FreshDirect) creates requirement: 500 kg Tomato
  // Matched, Route Calculated: Farm A -> Farm B -> Farm C -> Buyer Warehouse
  // Accepted, Picked Up, Delivered, Paid!
  // =========================================================================
  console.log('🌾 Setting up Demo Flow 1: 500 kg Pooled Supply -> Route -> Delivery...');

  const farmerA = createdFarmers[0].farmerProfile;
  const farmerB = createdFarmers[1].farmerProfile;
  const farmerC = createdFarmers[2].farmerProfile;

  const cropA = createdFarmerCrops[0];
  const cropB = createdFarmerCrops[1];
  const cropC = createdFarmerCrops[2];

  const buyerA = createdBuyers[0].buyerProfile; // FreshDirect in Chennai

  // Create Supply Pool: Tomato Bulk Pool (500 kg)
  const tomatoSupplyPool = await prisma.supplyPool.create({
    data: {
      cropId: tomatoCrop.id,
      poolName: 'Namakkal Prime Tomato Bulk Pool',
      targetQuantity: 500,
      currentQuantity: 500,
      minPricePerUnit: 31,
      maxPricePerUnit: 32,
      avgPricePerUnit: 31.5,
      qualityGrade: 'GRADE_A',
      harvestWindowStart: new Date(),
      harvestWindowEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      district: 'Namakkal',
      state: 'Tamil Nadu',
      centerLatitude: 11.2189,
      centerLongitude: 78.1674,
      status: 'MATCHED',
    },
  });

  // Add members
  await prisma.supplyPoolMember.createMany({
    data: [
      {
        supplyPoolId: tomatoSupplyPool.id,
        farmerProfileId: farmerA.id,
        farmerCropId: cropA.id,
        contributedQuantity: 100,
        expectedPricePerUnit: 32,
        status: 'PICKED_UP',
      },
      {
        supplyPoolId: tomatoSupplyPool.id,
        farmerProfileId: farmerB.id,
        farmerCropId: cropB.id,
        contributedQuantity: 150,
        expectedPricePerUnit: 32,
        status: 'PICKED_UP',
      },
      {
        supplyPoolId: tomatoSupplyPool.id,
        farmerProfileId: farmerC.id,
        farmerCropId: cropC.id,
        contributedQuantity: 250,
        expectedPricePerUnit: 31,
        status: 'PICKED_UP',
      },
    ],
  });

  // Mark farmer crop allocation
  await prisma.farmerCrop.update({ where: { id: cropA.id }, data: { allocatedQuantity: 100, status: 'FULLY_ALLOCATED' } });
  await prisma.farmerCrop.update({ where: { id: cropB.id }, data: { allocatedQuantity: 150, status: 'FULLY_ALLOCATED' } });
  await prisma.farmerCrop.update({ where: { id: cropC.id }, data: { allocatedQuantity: 250, status: 'FULLY_ALLOCATED' } });

  // Buyer A Purchase Requirement
  const buyerReq = await prisma.purchaseRequirement.create({
    data: {
      buyerProfileId: buyerA.id,
      cropId: tomatoCrop.id,
      quantity: 500,
      unit: 'kg',
      qualityGrade: 'GRADE_A',
      maxPricePerUnit: 35,
      deliveryAddress: 'Plot 42, Central Cold Chain Hub, Ambattur Industrial Estate, Chennai',
      deliveryDistrict: 'Chennai',
      deliveryState: 'Tamil Nadu',
      deliveryLatitude: 13.0827,
      deliveryLongitude: 80.2707,
      requiredDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'MATCHED',
    },
  });

  // Create Match
  const match1 = await prisma.match.create({
    data: {
      supplyPoolId: tomatoSupplyPool.id,
      purchaseRequirementId: buyerReq.id,
      matchScore: 96.5,
      compatibilityDetailsJson: JSON.stringify({
        cropMatch: true,
        quantityScore: 100,
        priceScore: 98,
        distanceKm: 345,
        gradeMatch: true,
      }),
      status: 'ACCEPTED',
    },
  });

  // Create Order
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'AGRI-DEMO-2026-001',
      buyerProfileId: buyerA.id,
      supplyPoolId: tomatoSupplyPool.id,
      purchaseRequirementId: buyerReq.id,
      cropId: tomatoCrop.id,
      totalQuantity: 500,
      unitPrice: 31.5,
      totalPrice: 15750, // ₹15,750
      platformFee: 315, // 2%
      status: 'COMPLETED',
      farmerPickupConfirmed: true,
      buyerDeliveryConfirmed: true,
      notes: 'Demo Order: Fully completed end-to-end with pickup route, delivery, and released escrow payout.',
    },
  });

  // Order Items
  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order1.id,
        farmerProfileId: farmerA.id,
        farmerCropId: cropA.id,
        farmId: farmerA.farms[0].id,
        quantity: 100,
        unitPrice: 32,
        subtotal: 3200,
        status: 'COMPLETED',
      },
      {
        orderId: order1.id,
        farmerProfileId: farmerB.id,
        farmerCropId: cropB.id,
        farmId: farmerB.farms[0].id,
        quantity: 150,
        unitPrice: 32,
        subtotal: 4800,
        status: 'COMPLETED',
      },
      {
        orderId: order1.id,
        farmerProfileId: farmerC.id,
        farmerCropId: cropC.id,
        farmId: farmerC.farms[0].id,
        quantity: 250,
        unitPrice: 31,
        subtotal: 7750,
        status: 'COMPLETED',
      },
    ],
  });

  // Create PickupRoute with Ordered Stops (Farm A -> Farm B -> Farm C -> Buyer Warehouse)
  const route1 = await prisma.pickupRoute.create({
    data: {
      orderId: order1.id,
      totalDistanceKm: 368.5,
      estimatedDurationMins: 420,
      estimatedTransportCost: 7250,
      vehicleCapacityKg: 1500,
      vehicleType: 'Tata Ace (Mini Truck)',
      optimizationMethod: 'Nearest-Neighbor + 2-Opt Heuristic',
      status: 'COMPLETED',
    },
  });

  await prisma.pickupStop.createMany({
    data: [
      {
        pickupRouteId: route1.id,
        farmId: farmerA.farms[0].id,
        stopSequence: 1,
        farmName: 'Periasamy Organic Green Farm (Farmer A)',
        village: 'Mohanur, Namakkal',
        latitude: 11.0825,
        longitude: 78.1432,
        quantityToCollectKg: 100,
        collectedQuantityKg: 100,
        stopDistanceKm: 0,
        status: 'LOADED',
        pickupTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        pickupRouteId: route1.id,
        farmId: farmerC.farms[0].id,
        stopSequence: 2,
        farmName: 'Velappan Agro Farms (Farmer C)',
        village: 'Paramathi Velur, Namakkal',
        latitude: 11.0456,
        longitude: 77.9942,
        quantityToCollectKg: 250,
        collectedQuantityKg: 250,
        stopDistanceKm: 18.2,
        status: 'LOADED',
        pickupTimestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
      },
      {
        pickupRouteId: route1.id,
        farmId: farmerB.farms[0].id,
        stopSequence: 3,
        farmName: 'Murugan Thottam (Farmer B)',
        village: 'Rasipuram, Namakkal',
        latitude: 11.4037,
        longitude: 78.1678,
        quantityToCollectKg: 150,
        collectedQuantityKg: 150,
        stopDistanceKm: 42.5,
        status: 'LOADED',
        pickupTimestamp: new Date(Date.now() - 21 * 60 * 60 * 1000),
      },
    ],
  });

  // Delivery record
  await prisma.delivery.create({
    data: {
      orderId: order1.id,
      destinationName: 'FreshDirect Ambattur Central Warehouse',
      destinationAddress: 'Plot 42, Central Cold Chain Hub, Ambattur Industrial Estate, Chennai',
      latitude: 13.0827,
      longitude: 80.2707,
      scheduledDeliveryDate: new Date(),
      actualDeliveryDate: new Date(),
      recipientName: 'Gopalakrishnan (Warehouse In-charge)',
      recipientPhone: '9843111111',
      status: 'DELIVERED',
    },
  });

  // Payment record
  const payment1 = await prisma.payment.create({
    data: {
      orderId: order1.id,
      buyerProfileId: buyerA.id,
      amount: 15750,
      currency: 'INR',
      provider: 'MOCK',
      providerPaymentId: 'MOCK_PAY_UPI_SUCCESS_DEMO',
      providerOrderId: 'MOCK_ORD_DEMO_001',
      status: 'SUCCESS',
      paidAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    },
  });

  // Transactions: Escrow Hold + Farmer Payouts
  await prisma.transaction.create({
    data: {
      orderId: order1.id,
      paymentId: payment1.id,
      fromUserId: createdBuyers[0].id,
      amount: 15750,
      feeAmount: 315,
      netAmount: 15435,
      type: 'ESCROW_HOLD',
      status: 'COMPLETED',
      referenceNumber: 'TXN-ESCROW-2026-001',
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        orderId: order1.id,
        paymentId: payment1.id,
        toUserId: createdFarmers[0].id,
        amount: 3200,
        netAmount: 3200,
        type: 'FARMER_PAYOUT',
        status: 'COMPLETED',
        referenceNumber: 'TXN-PAYOUT-FARMER-A',
      },
      {
        orderId: order1.id,
        paymentId: payment1.id,
        toUserId: createdFarmers[1].id,
        amount: 4800,
        netAmount: 4800,
        type: 'FARMER_PAYOUT',
        status: 'COMPLETED',
        referenceNumber: 'TXN-PAYOUT-FARMER-B',
      },
      {
        orderId: order1.id,
        paymentId: payment1.id,
        toUserId: createdFarmers[2].id,
        amount: 7750,
        netAmount: 7750,
        type: 'FARMER_PAYOUT',
        status: 'COMPLETED',
        referenceNumber: 'TXN-PAYOUT-FARMER-C',
      },
    ],
  });

  // =========================================================================
  // 9. SEED DEMO SCENARIO 2 (Section 39): Pooled Demand
  // Buyer A (100 kg), Buyer B (150 kg), Buyer C (250 kg) pooled into 500 kg Demand Pool
  // =========================================================================
  console.log('🛒 Setting up Demo Flow 2: Pooled Buying Demand Pool (500 kg)...');

  const demandPool2 = await prisma.demandPool.create({
    data: {
      cropId: onionCrop.id,
      poolName: 'Greater Chennai Bulk Onion Demand Collective',
      targetQuantity: 500,
      currentQuantity: 500,
      maxPricePerUnit: 30,
      qualityGrade: 'GRADE_A',
      deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      deliveryDistrict: 'Chennai',
      deliveryState: 'Tamil Nadu',
      centerLatitude: 13.06,
      centerLongitude: 80.25,
      status: 'TARGET_REACHED',
    },
  });

  await prisma.demandPoolMember.createMany({
    data: [
      {
        demandPoolId: demandPool2.id,
        buyerProfileId: createdBuyers[0].buyerProfile!.id,
        requestedQuantity: 100,
        offeredPricePerUnit: 30,
        status: 'COMMITTED',
      },
      {
        demandPoolId: demandPool2.id,
        buyerProfileId: createdBuyers[1].buyerProfile!.id,
        requestedQuantity: 150,
        offeredPricePerUnit: 30,
        status: 'COMMITTED',
      },
      {
        demandPoolId: demandPool2.id,
        buyerProfileId: createdBuyers[2].buyerProfile!.id,
        requestedQuantity: 250,
        offeredPricePerUnit: 29,
        status: 'COMMITTED',
      },
    ],
  });

  // 10. Seed Active OPEN Supply Pools for live UI interaction
  await prisma.supplyPool.createMany({
    data: [
      {
        cropId: tomatoCrop.id,
        poolName: 'Salem & Erode Fresh Harvest Pool',
        targetQuantity: 400,
        currentQuantity: 200,
        minPricePerUnit: 30,
        maxPricePerUnit: 34,
        avgPricePerUnit: 32,
        qualityGrade: 'GRADE_A',
        harvestWindowStart: new Date(),
        harvestWindowEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        district: 'Salem',
        state: 'Tamil Nadu',
        centerLatitude: 11.6643,
        centerLongitude: 78.146,
        status: 'OPEN',
      },
      {
        cropId: carrotCrop.id,
        poolName: 'Nilgiris Cool Climate Carrot Collective',
        targetQuantity: 600,
        currentQuantity: 400,
        minPricePerUnit: 42,
        maxPricePerUnit: 48,
        avgPricePerUnit: 45,
        qualityGrade: 'GRADE_A',
        harvestWindowStart: new Date(),
        harvestWindowEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        district: 'Nilgiris',
        state: 'Tamil Nadu',
        centerLatitude: 11.4102,
        centerLongitude: 76.695,
        status: 'OPEN',
      },
      {
        cropId: potatoCrop.id,
        poolName: 'Hassan Red Soil Potato Supply Group',
        targetQuantity: 800,
        currentQuantity: 300,
        minPricePerUnit: 20,
        maxPricePerUnit: 24,
        avgPricePerUnit: 22,
        qualityGrade: 'GRADE_A',
        harvestWindowStart: new Date(),
        harvestWindowEnd: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        district: 'Hassan',
        state: 'Karnataka',
        centerLatitude: 13.0033,
        centerLongitude: 76.1004,
        status: 'OPEN',
      },
    ],
  });

  // Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: createdFarmers[0].id,
        title: 'Welcome to AgriBridge! 🌾',
        message: 'Your farmer profile is verified. You can list produce, form supply pools, and receive bulk orders.',
        type: 'SYSTEM',
        actionUrl: '/farmer/produce',
      },
      {
        userId: createdFarmers[0].id,
        title: 'Payout Disbursed (₹3,200) 💰',
        message: 'Order #AGRI-DEMO-2026-001 completed. Payout credited to your HDFC bank account.',
        type: 'PAYMENT',
        actionUrl: '/farmer/transactions',
      },
      {
        userId: createdBuyers[0].id,
        title: 'Order Delivered & Verified ✅',
        message: 'Order #AGRI-DEMO-2026-001 for 500 kg Tomato safely received and inspected at Ambattur hub.',
        type: 'DELIVERY',
        actionUrl: '/buyer/orders',
      },
    ],
  });

  console.log('🎉 Seeding successfully completed!');
  console.log('----------------------------------------------------');
  console.log('DEMO CREDENTIALS:');
  console.log('👨‍🌾 Farmer: farmer@agribridge.demo   | Password: Farmer@123');
  console.log('🏢 Buyer:  buyer@agribridge.demo    | Password: Buyer@123');
  console.log('🛡️ Admin:  admin@agribridge.demo    | Password: Admin@123');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
