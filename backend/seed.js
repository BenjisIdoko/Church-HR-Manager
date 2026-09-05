const { statements, ensureReady, execRaw } = require('./database');
const bcrypt = require('bcryptjs');

// Seed initial data
const seedData = async () => {
  try {
    await ensureReady();

    // Always seed login accounts, even without demo data - otherwise there
    // is no way to sign in to a freshly created database.
    const seedUsers = [
      {
        name: 'Super Admin',
        email: 'admin@church.com',
        password: 'Admin@123',
        role: 'superadmin',
        workerId: 'W000',
      },
      {
        name: 'Manager User',
        email: 'manager@church.com',
        password: 'Manager@123',
        role: 'manager',
        workerId: null,
      },
      {
        name: 'Alice Johnson',
        email: 'alice@church.org',
        password: 'Member@123',
        role: 'member',
        workerId: 'W001',
      },
    ];

    for (const user of seedUsers) {
      const hash = bcrypt.hashSync(user.password, 10);
      await statements.insertUser.run(user.name, user.email, hash, user.role, user.workerId);
    }
    console.log(`Seeded ${seedUsers.length} login account(s). IMPORTANT: change these default passwords immediately after first login.`);

    if (process.env.LOAD_SAMPLE_DATA !== 'true') {
      const workerCount = (await statements.getWorkerCount.get('Active'))?.count || 0;
      const todayStr = new Date().toISOString().split('T')[0];
      const todayStats = await statements.getAttendanceStats.get(todayStr);
      await statements.updateKPIs.run(workerCount, todayStats?.present || 0, todayStats?.absent || 0);
      console.log('Sample data loading skipped. Set LOAD_SAMPLE_DATA=true to seed demo records.');
      return;
    }

    console.log('Seeding database with sample data...');

    await execRaw(`
      DELETE FROM clock_in_records;
      DELETE FROM attendance;
      DELETE FROM absences;
      DELETE FROM workers;
      DELETE FROM sqlite_sequence WHERE name IN ('workers', 'attendance', 'absences', 'clock_in_records');
    `);

    const demoSettings = {
      clock_in_portal_enabled: 'true',
      clock_in_portal_name: 'Church Clock-In Portal',
      clock_in_portal_description: 'Use this portal to clock in and out when on church grounds.',
      church_latitude: '9.0765',
      church_longitude: '7.3986',
      geofence_radius_meters: '200',
      geofence_tolerance_meters: '50',
      device_import_enabled: 'true',
    };

    for (const [key, value] of Object.entries(demoSettings)) {
      await statements.upsertSetting.run(key, value);
    }

    // Insert sample workers
    const workers = [
  {
    "externalId": "W001",
    "name": "Osarumeh Enobakhare",
    "email": "osarumeh.enobakhare@churchhr.org",
    "phone": "+234 800 000 0001",
    "dept": "Intercessors",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W002",
    "name": "Samuel Sonayon",
    "email": "samuel.sonayon@churchhr.org",
    "phone": "+234 800 000 0002",
    "dept": "Intercessors",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W003",
    "name": "Kehinde Ali-Balogun",
    "email": "kehinde.ali.balogun@churchhr.org",
    "phone": "+234 800 000 0003",
    "dept": "Intercessors",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W004",
    "name": "Peace Friday",
    "email": "peace.friday@churchhr.org",
    "phone": "+234 800 000 0004",
    "dept": "Intercessors",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W005",
    "name": "Esther Anthony",
    "email": "esther.anthony@churchhr.org",
    "phone": "+234 800 000 0005",
    "dept": "Intercessors",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W006",
    "name": "Bethel Ikechukwu",
    "email": "bethel.ikechukwu@churchhr.org",
    "phone": "+234 800 000 0006",
    "dept": "Intercessors",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W007",
    "name": "Suzan Shayepe Makinde",
    "email": "suzan.shayepe.makinde@churchhr.org",
    "phone": "+234 800 000 0007",
    "dept": "Intercessors",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W008",
    "name": "Elizabeth Ijeh",
    "email": "elizabeth.ijeh@churchhr.org",
    "phone": "+234 800 000 0008",
    "dept": "Intercessors",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W009",
    "name": "Margaret Tinuala",
    "email": "margaret.tinuala@churchhr.org",
    "phone": "+234 800 000 0009",
    "dept": "Intercessors",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W010",
    "name": "John Kalu",
    "email": "john.kalu@churchhr.org",
    "phone": "+234 800 000 0010",
    "dept": "Intercessors",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W011",
    "name": "Victoria Ayideji",
    "email": "victoria.ayideji@churchhr.org",
    "phone": "+234 800 000 0011",
    "dept": "Intercessors",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W012",
    "name": "Lisa Arinola",
    "email": "lisa.arinola@churchhr.org",
    "phone": "+234 800 000 0012",
    "dept": "Intercessors",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W013",
    "name": "Patience Omo-Osagie",
    "email": "patience.omo.osagie@churchhr.org",
    "phone": "+234 800 000 0013",
    "dept": "Intercessors",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W014",
    "name": "Esther Daniel-Ipaye",
    "email": "esther.daniel.ipaye@churchhr.org",
    "phone": "+234 800 000 0014",
    "dept": "Hospitality & Team Engage",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W015",
    "name": "Blessing Akpeji",
    "email": "blessing.akpeji@churchhr.org",
    "phone": "+234 800 000 0015",
    "dept": "Hospitality & Team Engage",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W016",
    "name": "Funmilayo Levites",
    "email": "funmilayo.levites@churchhr.org",
    "phone": "+234 800 000 0016",
    "dept": "Hospitality",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W017",
    "name": "Josephine Iliya",
    "email": "josephine.iliya@churchhr.org",
    "phone": "+234 800 000 0017",
    "dept": "Hospitality",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W018",
    "name": "Emmanuel Haruna",
    "email": "emmanuel.haruna@churchhr.org",
    "phone": "+234 800 000 0018",
    "dept": "Hospitality",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W019",
    "name": "Rita Ikriko",
    "email": "rita.ikriko@churchhr.org",
    "phone": "+234 800 000 0019",
    "dept": "TCC/Ushafa Children",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W020",
    "name": "Blessing Ozia",
    "email": "blessing.ozia@churchhr.org",
    "phone": "+234 800 000 0020",
    "dept": "TCC/Ushafa Children",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W021",
    "name": "Dolapo Brenda Sander",
    "email": "dolapo.brenda.sander@churchhr.org",
    "phone": "+234 800 000 0021",
    "dept": "TCC/Ushafa Children",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W022",
    "name": "Ken Sunday Osagie",
    "email": "ken.sunday.osagie@churchhr.org",
    "phone": "+234 800 000 0022",
    "dept": "TCC/Ushafa Children",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W023",
    "name": "Divine Ofonime Asuquo",
    "email": "divine.ofonime.asuquo@churchhr.org",
    "phone": "+234 800 000 0023",
    "dept": "TCC/Ushafa Children",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W024",
    "name": "Esther Frederick",
    "email": "esther.frederick@churchhr.org",
    "phone": "+234 800 000 0024",
    "dept": "TCC/Ushafa Children",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W025",
    "name": "Otitoju Christiana",
    "email": "otitoju.christiana@churchhr.org",
    "phone": "+234 800 000 0025",
    "dept": "TCC/Ushafa Children",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W026",
    "name": "Praise Victor",
    "email": "praise.victor@churchhr.org",
    "phone": "+234 800 000 0026",
    "dept": "TCC/Ushafa Children",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W027",
    "name": "Prudence Aisudionoe-Progress",
    "email": "prudence.aisudionoe.progress@churchhr.org",
    "phone": "+234 800 000 0027",
    "dept": "Events/Program",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W028",
    "name": "Osarumwense Ekhator",
    "email": "osarumwense.ekhator@churchhr.org",
    "phone": "+234 800 000 0028",
    "dept": "Events/Program",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W029",
    "name": "Benjamin Emmanuel",
    "email": "benjamin.emmanuel@churchhr.org",
    "phone": "+234 800 000 0029",
    "dept": "Events/Program",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W030",
    "name": "Ojochenemi Minabai Seibofa",
    "email": "ojochenemi.minabai.seibofa@churchhr.org",
    "phone": "+234 800 000 0030",
    "dept": "Events/Program",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W031",
    "name": "Gladys Samuel",
    "email": "gladys.samuel@churchhr.org",
    "phone": "+234 800 000 0031",
    "dept": "Events/Program",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W032",
    "name": "Prescious Ayodele",
    "email": "prescious.ayodele@churchhr.org",
    "phone": "+234 800 000 0032",
    "dept": "Events/Program",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W033",
    "name": "Omowumi Chukwunwike",
    "email": "omowumi.chukwunwike@churchhr.org",
    "phone": "+234 800 000 0033",
    "dept": "Events/Program",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W034",
    "name": "Ekeminiabasi Ikpembe",
    "email": "ekeminiabasi.ikpembe@churchhr.org",
    "phone": "+234 800 000 0034",
    "dept": "Events/Program",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W035",
    "name": "Dorcas Napoleon",
    "email": "dorcas.napoleon@churchhr.org",
    "phone": "+234 800 000 0035",
    "dept": "Greeters",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W036",
    "name": "Victoria Charles",
    "email": "victoria.charles@churchhr.org",
    "phone": "+234 800 000 0036",
    "dept": "Greeters",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W037",
    "name": "Esther Ehizibue",
    "email": "esther.ehizibue@churchhr.org",
    "phone": "+234 800 000 0037",
    "dept": "Ushers",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W038",
    "name": "Lydia Ossai",
    "email": "lydia.ossai@churchhr.org",
    "phone": "+234 800 000 0038",
    "dept": "Greeters",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W039",
    "name": "Nwachukwu ossai",
    "email": "nwachukwu.ossai@churchhr.org",
    "phone": "+234 800 000 0039",
    "dept": "Ushers",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W040",
    "name": "Ini Gabriel",
    "email": "ini.gabriel@churchhr.org",
    "phone": "+234 800 000 0040",
    "dept": "Greeters",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W041",
    "name": "Mercy Ode Peter",
    "email": "mercy.ode.peter@churchhr.org",
    "phone": "+234 800 000 0041",
    "dept": "Ushers",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W042",
    "name": "Favour Ajayi",
    "email": "favour.ajayi@churchhr.org",
    "phone": "+234 800 000 0042",
    "dept": "Ushers",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W043",
    "name": "Shemfe Taiye",
    "email": "shemfe.taiye@churchhr.org",
    "phone": "+234 800 000 0043",
    "dept": "Greeters",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W044",
    "name": "Ogunbiyi Joyce",
    "email": "ogunbiyi.joyce@churchhr.org",
    "phone": "+234 800 000 0044",
    "dept": "Ushers",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W045",
    "name": "Joseph Faithfulness",
    "email": "joseph.faithfulness@churchhr.org",
    "phone": "+234 800 000 0045",
    "dept": "Greeters",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W046",
    "name": "Blessing Mattew",
    "email": "blessing.mattew@churchhr.org",
    "phone": "+234 800 000 0046",
    "dept": "Ushers",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W047",
    "name": "Ebeniyi Mary",
    "email": "ebeniyi.mary@churchhr.org",
    "phone": "+234 800 000 0047",
    "dept": "Greeters",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W048",
    "name": "Victoria Charles",
    "email": "victoria.charles@churchhr.org",
    "phone": "+234 800 000 0048",
    "dept": "Greeters",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W049",
    "name": "Austin Kyuinni",
    "email": "austin.kyuinni@churchhr.org",
    "phone": "+234 800 000 0049",
    "dept": "Media",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W050",
    "name": "Lawson Luke Nwachukwu",
    "email": "lawson.luke.nwachukwu@churchhr.org",
    "phone": "+234 800 000 0050",
    "dept": "Media",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W051",
    "name": "Tijesunimi Olugbeminiyi",
    "email": "tijesunimi.olugbeminiyi@churchhr.org",
    "phone": "+234 800 000 0051",
    "dept": "Media",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W052",
    "name": "Joseph Seed",
    "email": "joseph.seed@churchhr.org",
    "phone": "+234 800 000 0052",
    "dept": "Media",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W053",
    "name": "Fiyin Olugbeminiyi",
    "email": "fiyin.olugbeminiyi@churchhr.org",
    "phone": "+234 800 000 0053",
    "dept": "Media",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W054",
    "name": "Mogboluwaga Olugbeminiyi",
    "email": "mogboluwaga.olugbeminiyi@churchhr.org",
    "phone": "+234 800 000 0054",
    "dept": "Media",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W055",
    "name": "Praise William",
    "email": "praise.william@churchhr.org",
    "phone": "+234 800 000 0055",
    "dept": "Media",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W056",
    "name": "Destiny William",
    "email": "destiny.william@churchhr.org",
    "phone": "+234 800 000 0056",
    "dept": "Media",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W057",
    "name": "Oloruntele Alli-balogun",
    "email": "oloruntele.alli.balogun@churchhr.org",
    "phone": "+234 800 000 0057",
    "dept": "Media",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W058",
    "name": "Marvelous Ayodele",
    "email": "marvelous.ayodele@churchhr.org",
    "phone": "+234 800 000 0058",
    "dept": "Media",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W059",
    "name": "Bolaji Akinbowale",
    "email": "bolaji.akinbowale@churchhr.org",
    "phone": "+234 800 000 0059",
    "dept": "Media",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W060",
    "name": "Isreal Victor",
    "email": "isreal.victor@churchhr.org",
    "phone": "+234 800 000 0060",
    "dept": "Media",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W061",
    "name": "Daniella Chima Azu",
    "email": "daniella.chima.azu@churchhr.org",
    "phone": "+234 800 000 0061",
    "dept": "Media",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W062",
    "name": "Femi Tinuala",
    "email": "femi.tinuala@churchhr.org",
    "phone": "+234 800 000 0062",
    "dept": "Media",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W063",
    "name": "Rejoice Akali",
    "email": "rejoice.akali@churchhr.org",
    "phone": "+234 800 000 0063",
    "dept": "Media",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W064",
    "name": "Modupeola Onuha-Ekwuru",
    "email": "modupeola.onuha.ekwuru@churchhr.org",
    "phone": "+234 800 000 0064",
    "dept": "Response Team",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W065",
    "name": "Idakwo Priscillia Onyowoicho",
    "email": "idakwo.priscillia.onyowoicho@churchhr.org",
    "phone": "+234 800 000 0065",
    "dept": "Response Team",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W066",
    "name": "Victoria Charles",
    "email": "victoria.charles@churchhr.org",
    "phone": "+234 800 000 0066",
    "dept": "Creative Team",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W067",
    "name": "Femi D. Amele",
    "email": "femi.d..amele@churchhr.org",
    "phone": "+234 800 000 0067",
    "dept": "Creative Team",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W068",
    "name": "King David",
    "email": "king.david@churchhr.org",
    "phone": "+234 800 000 0068",
    "dept": "Creative Team",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W069",
    "name": "Ejiro Mercy Richard",
    "email": "ejiro.mercy.richard@churchhr.org",
    "phone": "+234 800 000 0069",
    "dept": "Creative Team",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W070",
    "name": "Emmanuel Emmanuella",
    "email": "emmanuel.emmanuella@churchhr.org",
    "phone": "+234 800 000 0070",
    "dept": "Creative Team",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W071",
    "name": "Praise Ogankpa",
    "email": "praise.ogankpa@churchhr.org",
    "phone": "+234 800 000 0071",
    "dept": "Creative Team",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W072",
    "name": "Grace Ese",
    "email": "grace.ese@churchhr.org",
    "phone": "+234 800 000 0072",
    "dept": "Creative Team",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W073",
    "name": "Worthy George Timothy",
    "email": "worthy.george.timothy@churchhr.org",
    "phone": "+234 800 000 0073",
    "dept": "Creative Team",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W074",
    "name": "Victoria Ochanya udoh",
    "email": "victoria.ochanya.udoh@churchhr.org",
    "phone": "+234 800 000 0074",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W075",
    "name": "Rita isaac",
    "email": "rita.isaac@churchhr.org",
    "phone": "+234 800 000 0075",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W076",
    "name": "Adole Patrick Odu",
    "email": "adole.patrick.odu@churchhr.org",
    "phone": "+234 800 000 0076",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W077",
    "name": "Idris S. Eddy",
    "email": "idris.s..eddy@churchhr.org",
    "phone": "+234 800 000 0077",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W078",
    "name": "Victoria M. Victor -",
    "email": "victoria.m..victor..@churchhr.org",
    "phone": "+234 800 000 0078",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W079",
    "name": "Simon Brendan Sanda",
    "email": "simon.brendan.sanda@churchhr.org",
    "phone": "+234 800 000 0079",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W080",
    "name": "Stella .S. Akaangee",
    "email": "stella..s..akaangee@churchhr.org",
    "phone": "+234 800 000 0080",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W081",
    "name": "James T. Olajide",
    "email": "james.t..olajide@churchhr.org",
    "phone": "+234 800 000 0081",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W082",
    "name": "Rogers P. Acheru-",
    "email": "rogers.p..acheru.@churchhr.org",
    "phone": "+234 800 000 0082",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W083",
    "name": "Sergius Tochukwu Oti",
    "email": "sergius.tochukwu.oti@churchhr.org",
    "phone": "+234 800 000 0083",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W084",
    "name": "Istifanus shekwosalasi Blessing",
    "email": "istifanus.shekwosalasi.blessing@churchhr.org",
    "phone": "+234 800 000 0084",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W085",
    "name": "Angela Amu",
    "email": "angela.amu@churchhr.org",
    "phone": "+234 800 000 0085",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W086",
    "name": "Jimmy Oko",
    "email": "jimmy.oko@churchhr.org",
    "phone": "+234 800 000 0086",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W087",
    "name": "Frank Akpeji",
    "email": "frank.akpeji@churchhr.org",
    "phone": "+234 800 000 0087",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W088",
    "name": "Patrick okebugwu",
    "email": "patrick.okebugwu@churchhr.org",
    "phone": "+234 800 000 0088",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W089",
    "name": "Idoko Richard",
    "email": "idoko.richard@churchhr.org",
    "phone": "+234 800 000 0089",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W090",
    "name": "Saibofa. M",
    "email": "saibofa..m@churchhr.org",
    "phone": "+234 800 000 0090",
    "dept": "Protocol",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W091",
    "name": "Akinwale Adewale",
    "email": "akinwale.adewale@churchhr.org",
    "phone": "+234 800 000 0091",
    "dept": "Logistics",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W092",
    "name": "Omega Alpha Emmanuel",
    "email": "omega.alpha.emmanuel@churchhr.org",
    "phone": "+234 800 000 0092",
    "dept": "Logistics",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W093",
    "name": "Suzan Akojenry",
    "email": "suzan.akojenry@churchhr.org",
    "phone": "+234 800 000 0093",
    "dept": "Finance",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W094",
    "name": "Abel Yusuf",
    "email": "abel.yusuf@churchhr.org",
    "phone": "+234 800 000 0094",
    "dept": "Finance",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W095",
    "name": "Hafsat Idris",
    "email": "hafsat.idris@churchhr.org",
    "phone": "+234 800 000 0095",
    "dept": "Welfare",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W096",
    "name": "Roseline Ajayi",
    "email": "roseline.ajayi@churchhr.org",
    "phone": "+234 800 000 0096",
    "dept": "Welfare",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W097",
    "name": "Gabriel Danladi",
    "email": "gabriel.danladi@churchhr.org",
    "phone": "+234 800 000 0097",
    "dept": "Hospitality",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W098",
    "name": "Modupe Adu",
    "email": "modupe.adu@churchhr.org",
    "phone": "+234 800 000 0098",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W099",
    "name": "Augusta Ekezie",
    "email": "augusta.ekezie@churchhr.org",
    "phone": "+234 800 000 0099",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W100",
    "name": "Gift Abel",
    "email": "gift.abel@churchhr.org",
    "phone": "+234 800 000 0100",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W101",
    "name": "Jessica Paul",
    "email": "jessica.paul@churchhr.org",
    "phone": "+234 800 000 0101",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W102",
    "name": "Joy Onyinye",
    "email": "joy.onyinye@churchhr.org",
    "phone": "+234 800 000 0102",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W103",
    "name": "Marcel Onyinye",
    "email": "marcel.onyinye@churchhr.org",
    "phone": "+234 800 000 0103",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W104",
    "name": "Faith Ayodele",
    "email": "faith.ayodele@churchhr.org",
    "phone": "+234 800 000 0104",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W105",
    "name": "Rebecca Tyowase",
    "email": "rebecca.tyowase@churchhr.org",
    "phone": "+234 800 000 0105",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W106",
    "name": "Solomon Asein",
    "email": "solomon.asein@churchhr.org",
    "phone": "+234 800 000 0106",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W107",
    "name": "Susan Saiyepe",
    "email": "susan.saiyepe@churchhr.org",
    "phone": "+234 800 000 0107",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W108",
    "name": "Patience Chigudu",
    "email": "patience.chigudu@churchhr.org",
    "phone": "+234 800 000 0108",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W109",
    "name": "Abiayi Isaac",
    "email": "abiayi.isaac@churchhr.org",
    "phone": "+234 800 000 0109",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W110",
    "name": "Damilola Akingbolasan",
    "email": "damilola.akingbolasan@churchhr.org",
    "phone": "+234 800 000 0110",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W111",
    "name": "Mrs Richard",
    "email": "mrs.richard@churchhr.org",
    "phone": "+234 800 000 0111",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W112",
    "name": "Grace William",
    "email": "grace.william@churchhr.org",
    "phone": "+234 800 000 0112",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W113",
    "name": "Dorcas Gabriel",
    "email": "dorcas.gabriel@churchhr.org",
    "phone": "+234 800 000 0113",
    "dept": "Sanctuary",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W001",
    "name": "Osasogie Enobakhare",
    "email": "osasogie.enobakhare@churchhr.org",
    "phone": "+234 800 000 0001",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W002",
    "name": "⁠Goshen Ebor",
    "email": ".goshen.ebor@churchhr.org",
    "phone": "+234 800 000 0002",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W003",
    "name": "Emmanuel Mba",
    "email": "emmanuel.mba@churchhr.org",
    "phone": "+234 800 000 0003",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W004",
    "name": "⁠Grace Dave",
    "email": ".grace.dave@churchhr.org",
    "phone": "+234 800 000 0004",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W005",
    "name": "Joshua Dave",
    "email": "joshua.dave@churchhr.org",
    "phone": "+234 800 000 0005",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W006",
    "name": "Goodness Mba",
    "email": "goodness.mba@churchhr.org",
    "phone": "+234 800 000 0006",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W007",
    "name": "⁠⁠Imole Shobogun",
    "email": "..imole.shobogun@churchhr.org",
    "phone": "+234 800 000 0007",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W008",
    "name": "Oduwa Enobakhare",
    "email": "oduwa.enobakhare@churchhr.org",
    "phone": "+234 800 000 0008",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W009",
    "name": "Sarah Samuel",
    "email": "sarah.samuel@churchhr.org",
    "phone": "+234 800 000 0009",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W010",
    "name": "Elfridah Progress",
    "email": "elfridah.progress@churchhr.org",
    "phone": "+234 800 000 0010",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W011",
    "name": "Unique Ayideji",
    "email": "unique.ayideji@churchhr.org",
    "phone": "+234 800 000 0011",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W012",
    "name": "Seun Olushola",
    "email": "seun.olushola@churchhr.org",
    "phone": "+234 800 000 0012",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W013",
    "name": "Perez Idoko",
    "email": "perez.idoko@churchhr.org",
    "phone": "+234 800 000 0013",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W014",
    "name": "Rinnah Akpeji",
    "email": "rinnah.akpeji@churchhr.org",
    "phone": "+234 800 000 0014",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W015",
    "name": "Bukunmi Ajayi",
    "email": "bukunmi.ajayi@churchhr.org",
    "phone": "+234 800 000 0015",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W016",
    "name": "Gloria Ayideyi",
    "email": "gloria.ayideyi@churchhr.org",
    "phone": "+234 800 000 0016",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W017",
    "name": "⁠Peace Ayideji",
    "email": ".peace.ayideji@churchhr.org",
    "phone": "+234 800 000 0017",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W018",
    "name": "Onu Akojenry",
    "email": "onu.akojenry@churchhr.org",
    "phone": "+234 800 000 0018",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W019",
    "name": "Oma-ojo Akojenry",
    "email": "oma.ojo.akojenry@churchhr.org",
    "phone": "+234 800 000 0019",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  },
  {
    "externalId": "W020",
    "name": "Karen Tinuala",
    "email": "karen.tinuala@churchhr.org",
    "phone": "+234 800 000 0020",
    "dept": "General Workforce",
    "role": "Member",
    "status": "Active"
  }
];

    // Deduplicate sample workers by externalId
    const uniqueWorkersMap = new Map();
    for (const worker of workers) {
      if (worker.externalId && !uniqueWorkersMap.has(worker.externalId)) {
        uniqueWorkersMap.set(worker.externalId, worker);
      }
    }
    const uniqueWorkers = Array.from(uniqueWorkersMap.values());

    // Insert sample workers and collect their IDs
    const insertedWorkers = [];
    for (const worker of uniqueWorkers) {
      const result = await statements.insertWorker.run(
        worker.externalId,
        worker.name,
        worker.email,
        worker.phone,
        worker.dept,
        worker.role,
        worker.status
      );
      insertedWorkers.push({ ...worker, id: result.lastInsertRowid });
    }

    console.log(`Inserted ${insertedWorkers.length} workers`);

    // Generate attendance data for the last 30 days
    const services = ['Sunday Service', 'Thursday Service', 'Wednesday Service'];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      // Different attendance rates for different days
      const attendanceRate = dayOfWeek === 0 ? 0.90 : dayOfWeek === 4 ? 0.70 : 0.60;
      const lateRate = 0.15;

      for (const worker of insertedWorkers) {
        for (const service of services) {
          const rand = Math.random();
          let status = 'Absent';

          if (rand < attendanceRate) {
            status = Math.random() < lateRate ? 'Late' : 'Present';
          }

          await statements.insertAttendance.run(
            worker.id,
            service,
            status,
            dateStr
          );
        }
      }
    }

    console.log('Generated attendance data for 30 days');

    // Update KPIs
    const workerCount = (await statements.getWorkerCount.get('Active')).count;
    const todayStr = today.toISOString().split('T')[0];
    const todayStats = await statements.getAttendanceStats.get(todayStr);

    await statements.updateKPIs.run(
      workerCount,
      todayStats.present,
      todayStats.absent
    );

    console.log('Sample database seeded successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  seedData().then(() => {
    console.log('Seeding complete');
    process.exit(0);
  });
}

module.exports = { seedData };
